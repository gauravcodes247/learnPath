// Usage: npm run seed   (wipes and reloads content, questions and the demo student)
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Content from "../models/Content.js";
import Question from "../models/Question.js";
import QuizAttempt from "../models/QuizAttempt.js";
import RecommendationCache from "../models/RecommendationCache.js";
import { embed, embeddingProvider, EMBED_DIM } from "../services/llmService.js";
import { VECTOR_INDEX } from "../services/recommendationService.js";
import { content, questions, students, teachers, admin, TOPICS } from "./data.js";

const PASSWORD = "123456"; // for every seeded account

// Small seeded RNG so every seed produces the same demo history.
let s = 42;
const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);

async function ensureVectorIndex() {
  const coll = Content.collection;
  try {
    const existing = await coll.listSearchIndexes(VECTOR_INDEX).toArray();
    if (existing.length) return console.log(`Vector index "${VECTOR_INDEX}" already exists`);
    await coll.createSearchIndex({
      name: VECTOR_INDEX,
      type: "vectorSearch",
      definition: {
        fields: [
          { type: "vector", path: "embedding", numDimensions: EMBED_DIM, similarity: "cosine" },
          { type: "filter", path: "topic" },
        ],
      },
    });
    console.log(`Created Atlas Vector Search index "${VECTOR_INDEX}" (takes ~1 min to become queryable)`);
  } catch (err) {
    console.warn(
      `Could not create the vector index automatically (${err.message.slice(0, 120)}).\n` +
        "  -> Not on Atlas? The app falls back to in-app cosine similarity.\n" +
        "  -> On Atlas? Create it in the UI: see README 'Vector index'.",
    );
  }
}

async function run() {
  await connectDB();
  console.log(`Embedding provider: ${embeddingProvider()}`);

  await Promise.all([
    Content.deleteMany({}),
    Question.deleteMany({}),
    RecommendationCache.deleteMany({}),
  ]);

  // Content + embeddings (title + summary + body + tags is what gets embedded)
  const docs = [];
  for (const c of content) {
    const text = `${c.topic}. ${c.title}. ${c.summary} ${c.body || ""} ${(c.tags || []).join(", ")}`;
    try {
      docs.push({ ...c, embedding: await embed(text) });
    } catch (err) {
      console.error(`\nEmbedding failed: ${err.message.slice(0, 300)}`);
      console.error("Fix GEMINI_API_KEY / GEMINI_EMBED_MODEL in .env, or remove the key to use local embeddings.");
      process.exit(1);
    }
    process.stdout.write(".");
  }
  await Content.insertMany(docs);
  console.log(`\nInserted ${docs.length} content items`);

  const qs = await Question.insertMany(questions);
  console.log(`Inserted ${qs.length} questions`);

  // Students with quiz history (different strengths), plus a teacher account
  const hash = await bcrypt.hash(PASSWORD, 10);
  const upsertUser = async ({ name, email, role = "student", teacher = null }) => {
    const existing = await User.findOne({ email });
    if (existing) {
      Object.assign(existing, { name, role, teacher });
      return existing.save();
    }
    return User.create({ name, email, role, teacher, password: hash });
  };

  await upsertUser({ ...admin, role: "admin" });
  const teacherDocs = [];
  for (const t of teachers) teacherDocs.push(await upsertUser({ ...t, role: "teacher" }));
  let total = 0;
  for (const [i, st] of students.entries()) {
    const user = await upsertUser({ ...st, teacher: teacherDocs[st.teacher]._id });
    await QuizAttempt.deleteMany({ user: user._id });

    const attempts = [];
    for (let day = st.days; day >= 1; day--) {
      const topic = TOPICS[(day + i) % TOPICS.length];
      const pool = qs.filter((x) => x.topic === topic);
      const answers = pool.map((qq) => {
        const correct = rand() < st.skill[topic] + (st.days - day) * 0.01; // slight improvement over time
        const selectedIndex = correct ? qq.answerIndex : (qq.answerIndex + 1) % qq.options.length;
        return { question: qq._id, questionText: qq.question, topic, selectedIndex, correct };
      });
      const createdAt = new Date(Date.now() - (day + (i % 3)) * 86400000);
      attempts.push({
        user: user._id, mode: "topic", topic, answers,
        score: answers.filter((a) => a.correct).length, total: answers.length,
        createdAt, updatedAt: createdAt,
      });
    }
    await QuizAttempt.insertMany(attempts, { timestamps: false });
    total += attempts.length;
    console.log(`  ${st.email.padEnd(24)} ${String(attempts.length).padStart(2)} quizzes  → ${teachers[st.teacher].email}`);
  }
  console.log(
    `Seeded ${students.length} students (${total} quizzes), ${teachers.length} teachers, admin ${admin.email}. Password for all: ${PASSWORD}`,
  );

  await ensureVectorIndex();
  await mongoose.disconnect();
  console.log("Seed complete.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
