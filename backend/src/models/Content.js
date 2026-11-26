import mongoose from "mongoose";

// One document per study resource in the content library.
// `embedding` holds the vector used by Atlas Vector Search.
const contentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["note", "video", "practice"], required: true },
    topic: { type: String, required: true, index: true },
    subject: { type: String, default: "Data Structures & Algorithms" },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
    summary: { type: String, required: true },
    body: { type: String, default: "" },
    url: { type: String, default: "" },
    tags: [String],
    embedding: { type: [Number], select: false },
  },
  { timestamps: true },
);

export default mongoose.model("Content", contentSchema);
