import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true, index: true },
    question: { type: String, required: true },
    options: {
      type: [String],
      validate: [(v) => v.length >= 2, "Need at least 2 options"],
    },
    answerIndex: { type: Number, required: true },
    explanation: { type: String, default: "" },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
    source: { type: String, enum: ["seed", "ai"], default: "seed" },
  },
  { timestamps: true },
);

export default mongoose.model("Question", questionSchema);
