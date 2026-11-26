import mongoose from "mongoose";

// Answers are embedded in the attempt (they are always read together).
// topic + questionText are copied in on purpose, so the analytics
// aggregation never needs a $lookup.
const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    questionText: String,
    topic: { type: String, required: true },
    selectedIndex: Number,
    correct: { type: Boolean, required: true },
  },
  { _id: false },
);

const quizAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mode: { type: String, enum: ["topic", "practice"], default: "topic" },
    topic: String, // topic the quiz was started for ("Mixed" for practice sets)
    answers: [answerSchema],
    score: Number,
    total: Number,
  },
  { timestamps: true },
);

quizAttemptSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("QuizAttempt", quizAttemptSchema);
