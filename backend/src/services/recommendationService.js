import mongoose from "mongoose";
import Content from "../models/Content.js";
import Question from "../models/Question.js";
import QuizAttempt from "../models/QuizAttempt.js";
import RecommendationCache, { RECO_TTL_SECONDS } from "../models/RecommendationCache.js";
import { getStudentAnalytics, getRecentMistakes, pickWeakTopics } from "./analyticsService.js";
import { embed, cosine, generateJSON } from "./llmService.js";

export const VECTOR_INDEX = "content_vector_index";
const TYPE_ORDER = { note: 0, video: 1, practice: 2 };

// ---------- Vector search ----------

async function atlasVectorSearch(queryVector, limit) {
  return Content.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX,
        path: "embedding",
        queryVector,
        numCandidates: 100,
        limit,
      },
    },
    { $set: { score: { $meta: "vectorSearchScore" } } },
    { $unset: "embedding" },
  ]);
}

// Same idea computed in Node: used when Atlas Search isn't available
// (local MongoDB, or the index is still building).
async function inAppCosineSearch(queryVector, limit) {
  const docs = await Content.find().select("+embedding").lean();
  return docs
    .filter((d) => d.embedding?.length === queryVector.length)
    .map(({ embedding, ...d }) => ({ ...d, score: cosine(queryVector, embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function searchContent(text, limit = 4) {
  let queryVector;
  try {
    queryVector = await embed(text);
  } catch (err) {
    console.warn("Embedding failed:", err.message.slice(0, 200));
    return { results: [], method: "none" };
  }
  try {
    const results = await atlasVectorSearch(queryVector, limit);
    if (results.length) return { results, method: "atlas-vector-search" };
  } catch (err) {
    console.warn("$vectorSearch unavailable, using in-app cosine:", err.message.slice(0, 150));
  }
  return { results: await inAppCosineSearch(queryVector, limit), method: "in-app-cosine" };
}

// ---------- Recommendation pipeline ----------

function buildPrompt({ analytics, weak, mistakes, resources }) {
  return `You are a friendly study coach for a computer-science student.

TOPIC PERFORMANCE (accuracy %, questions attempted):
${analytics.byTopic.map((t) => `- ${t.topic}: ${t.accuracy}% (${t.attempted} q)`).join("\n")}

WEAK TOPICS: ${weak.map((w) => w.topic).join(", ")}

RECENTLY MISSED QUESTIONS:
${mistakes.map((m) => `- [${m.topic}] ${m.questions.join(" | ")}`).join("\n") || "- none recorded"}

AVAILABLE RESOURCES (from vector search over our content library; only use these ids):
${resources.map((r) => `- id=${r._id} | ${r.type} | ${r.topic} | ${r.title}: ${r.summary}`).join("\n")}

Return ONLY JSON with this exact shape:
{
  "summary": "2-3 sentences, plain language, addressed to the student, explaining what they are weak at and why",
  "weakTopics": [{ "topic": "<one of the weak topics>", "reason": "one sentence based on the data" }],
  "studyPlan": [{ "step": 1, "title": "short title", "action": "what to do and what to focus on", "resourceId": "<id from the list>" }],
  "practiceQuestions": [{ "topic": "<weak topic>", "question": "...", "options": ["a","b","c","d"], "answerIndex": 0, "explanation": "one sentence" }]
}
Rules: 4-6 study plan steps ordered from concepts to practice; exactly 2 new practice questions per weak topic,
4 options each, answerIndex 0-3, not copies of the missed questions; base everything on the resources above.`;
}

async function fallbackPlan({ weak, resources, userId }) {
  const sorted = [...resources].sort(
    (a, b) => a.topic.localeCompare(b.topic) || TYPE_ORDER[a.type] - TYPE_ORDER[b.type],
  );
  const verb = { note: "Read", video: "Watch", practice: "Work through" };
  // Prefer questions from the bank the student hasn't answered correctly yet.
  const solvedRows = await QuizAttempt.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $unwind: "$answers" },
    { $match: { "answers.correct": true } },
    { $group: { _id: "$answers.question" } },
  ]);
  const solved = solvedRows.map((r) => r._id).filter(Boolean);
  const bank = await Question.find({
    topic: { $in: weak.map((w) => w.topic) },
    _id: { $nin: solved },
  }).lean();
  return {
    summary: `Your accuracy is lowest in ${weak.map((w) => `${w.topic} (${w.accuracy}%)`).join(", ")}. Start with the notes to fix the concepts, then watch the video, then practise.`,
    weakTopics: weak.map((w) => ({ topic: w.topic, reason: `Only ${w.accuracy}% correct across ${w.attempted} questions.` })),
    studyPlan: sorted.map((r, i) => ({
      step: i + 1,
      title: `${verb[r.type]}: ${r.title}`,
      action: r.summary,
      resourceId: String(r._id),
    })),
    practiceQuestions: weak.flatMap((w) => bank.filter((q) => q.topic === w.topic).slice(0, 2)),
  };
}

export async function getRecommendations(userId, { refresh = false } = {}) {
  const user = new mongoose.Types.ObjectId(userId);

  if (!refresh) {
    const fresh = new Date(Date.now() - RECO_TTL_SECONDS * 1000);
    const cached = await RecommendationCache.findOne({ user, createdAt: { $gt: fresh } })
      .sort({ createdAt: -1 })
      .lean();
    if (cached) return { ...cached, cached: true };
  }

  const analytics = await getStudentAnalytics(userId);
  if (!analytics.byTopic.length) return { status: "no-data" };

  const weak = pickWeakTopics(analytics.byTopic);
  const mistakes = await getRecentMistakes(userId, weak.map((w) => w.topic));

  // One semantic query per weak topic, grounded in what the student got wrong.
  const seen = new Map();
  let retrieval = "in-app-cosine";
  for (const w of weak) {
    const missed = mistakes.find((m) => m.topic === w.topic)?.questions || [];
    const { results, method } = await searchContent(
      `${w.topic}. Student struggles with: ${missed.join(" ")}`,
      3,
    );
    if (method !== "none") retrieval = method;
    results.forEach((r) => !seen.has(String(r._id)) && seen.set(String(r._id), r));
  }
  let resources = [...seen.values()];
  if (!resources.length) {
    retrieval = "topic-filter";
    resources = await Content.find({ topic: { $in: weak.map((w) => w.topic) } }).lean();
  }

  let plan = await generateJSON(buildPrompt({ analytics, weak, mistakes, resources }));
  const generatedBy = plan ? "gemini" : "fallback";
  if (!plan) plan = await fallbackPlan({ weak, resources, userId });

  const byId = new Map(resources.map((r) => [String(r._id), r]));
  const doc = {
    user,
    summary: plan.summary,
    weakTopics: weak.map((w) => ({
      topic: w.topic,
      accuracy: w.accuracy,
      reason: plan.weakTopics?.find((x) => x.topic === w.topic)?.reason || "",
    })),
    studyPlan: (plan.studyPlan || []).map((s, i) => {
      const r = byId.get(String(s.resourceId));
      return {
        step: i + 1,
        title: s.title,
        action: s.action,
        resource: r && { _id: r._id, title: r.title, type: r.type, topic: r.topic, url: r.url, score: r.score },
      };
    }),
    practiceQuestions: (plan.practiceQuestions || [])
      .filter((q) => Array.isArray(q.options) && q.options.length >= 2 && q.answerIndex < q.options.length)
      .map(({ topic, question, options, answerIndex, explanation }) => ({ topic, question, options, answerIndex, explanation })),
    generatedBy,
    retrieval,
  };

  await RecommendationCache.deleteMany({ user });
  const saved = await RecommendationCache.create(doc);
  return { ...saved.toObject(), cached: false };
}

export const invalidateRecommendations = (userId) =>
  RecommendationCache.deleteMany({ user: new mongoose.Types.ObjectId(userId) });
