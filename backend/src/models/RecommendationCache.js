import mongoose from "mongoose";

export const RECO_TTL_SECONDS = Number(process.env.RECO_TTL_SECONDS) || 60 * 60; // 1 hour

// LLM output is slow and costs quota, so each student's latest
// recommendation is cached. The TTL index on createdAt makes MongoDB
// delete stale caches automatically (the TTL monitor runs every ~60s).
const recommendationCacheSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  weakTopics: [{ topic: String, accuracy: Number, reason: String }],
  summary: String,
  studyPlan: [
    {
      step: Number,
      title: String,
      action: String,
      resource: {
        _id: mongoose.Schema.Types.ObjectId,
        title: String,
        type: { type: String },
        topic: String,
        url: String,
        score: Number,
      },
    },
  ],
  practiceQuestions: [
    {
      topic: String,
      question: String,
      options: [String],
      answerIndex: Number,
      explanation: String,
    },
  ],
  generatedBy: String, // "gemini" or "fallback"
  retrieval: String, // "atlas-vector-search" | "in-app-cosine" | "topic-filter"
  createdAt: { type: Date, default: Date.now, expires: RECO_TTL_SECONDS },
});

export default mongoose.model("RecommendationCache", recommendationCacheSchema);
