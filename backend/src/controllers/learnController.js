import mongoose from "mongoose";
import Content from "../models/Content.js";
import User from "../models/User.js";
import Question from "../models/Question.js";
import QuizAttempt from "../models/QuizAttempt.js";
import { getStudentAnalytics, getAllStudentsOverview, getTeachersOverview } from "../services/analyticsService.js";
import {
  getRecommendations,
  invalidateRecommendations,
  searchContent,
} from "../services/recommendationService.js";

const fail = (res, error, code = 500) =>
  res.status(code).json({ success: false, message: error.message || error });

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/content?topic=Trees
export const listContent = async (req, res) => {
  try {
    const filter = req.query.topic ? { topic: req.query.topic } : {};
    const items = await Content.find(filter).sort({ topic: 1, type: 1 }).lean();
    res.json({ success: true, items });
  } catch (e) {
    fail(res, e);
  }
};

// GET /api/content/search?q=shortest path
export const semanticSearch = async (req, res) => {
  try {
    if (!req.query.q) return fail(res, "q is required", 400);
    const { results, method } = await searchContent(req.query.q, Number(req.query.limit) || 5);
    res.json({ success: true, method, results });
  } catch (e) {
    fail(res, e);
  }
};

// GET /api/quiz/topics
export const listTopics = async (req, res) => {
  try {
    const topics = await Question.aggregate([
      { $match: { source: "seed" } },
      { $group: { _id: "$topic", questions: { $sum: 1 } } },
      { $project: { _id: 0, topic: "$_id", questions: 1 } },
      { $sort: { topic: 1 } },
    ]);
    res.json({ success: true, topics });
  } catch (e) {
    fail(res, e);
  }
};

// GET /api/quiz/questions?topic=Graphs&limit=5
export const getQuizQuestions = async (req, res) => {
  try {
    const { topic, limit = 5 } = req.query;
    const match = { source: "seed", ...(topic ? { topic } : {}) };
    const questions = await Question.aggregate([
      { $match: match },
      { $sample: { size: Number(limit) } },
      { $project: { createdAt: 0, updatedAt: 0, __v: 0 } },
    ]);
    res.json({ success: true, questions });
  } catch (e) {
    fail(res, e);
  }
};

// POST /api/quiz/attempts
// body: { mode, topic, answers: [{ questionId?, questionText, topic, selectedIndex, correct? }] }
// The student is taken from the JWT, so nobody can save attempts for someone else.
export const submitAttempt = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mode = "topic", topic, answers = [] } = req.body;
    if (!answers.length) return fail(res, "answers are required", 400);

    // Grade bank questions on the server; AI practice questions carry their own result.
    const ids = answers.filter((a) => validId(a.questionId)).map((a) => a.questionId);
    const bank = new Map((await Question.find({ _id: { $in: ids } }).lean()).map((q) => [String(q._id), q]));

    const graded = answers.map((a) => {
      const q = bank.get(String(a.questionId));
      return {
        question: q?._id,
        questionText: q?.question || a.questionText,
        topic: q?.topic || a.topic,
        selectedIndex: a.selectedIndex,
        correct: q ? q.answerIndex === a.selectedIndex : Boolean(a.correct),
      };
    });

    const attempt = await QuizAttempt.create({
      user: userId,
      mode,
      topic: topic || "Mixed",
      answers: graded,
      score: graded.filter((a) => a.correct).length,
      total: graded.length,
    });

    // New performance data → old recommendations are stale.
    await invalidateRecommendations(userId);
    res.status(201).json({ success: true, attempt });
  } catch (e) {
    fail(res, e);
  }
};

// GET /api/students/:userId/analytics
export const studentAnalytics = async (req, res) => {
  try {
    if (!validId(req.params.userId)) return fail(res, "Invalid userId", 400);
    res.json({ success: true, ...(await getStudentAnalytics(req.params.userId)) });
  } catch (e) {
    fail(res, e);
  }
};

// GET /api/students/:userId/recommendations?refresh=true
export const studentRecommendations = async (req, res) => {
  try {
    if (!validId(req.params.userId)) return fail(res, "Invalid userId", 400);
    const data = await getRecommendations(req.params.userId, {
      refresh: req.query.refresh === "true",
    });
    res.json({ success: true, ...data });
  } catch (e) {
    fail(res, e);
  }
};

// GET /api/teacher/students: a teacher gets their own students, an admin gets everyone
export const myStudentsOverview = async (req, res) => {
  try {
    // teacher → always their own students; admin → all, or one teacher's with ?teacherId=
    const teacherId =
      req.user.role === "teacher" ? req.user.id : validId(req.query.teacherId) ? req.query.teacherId : null;
    const students = await getAllStudentsOverview(teacherId);
    res.json({ success: true, scope: teacherId ? "mine" : "all", count: students.length, students });
  } catch (e) {
    fail(res, e);
  }
};

// PATCH /api/admin/students/:userId/teacher  { teacherId | null } (admin only)
export const assignTeacher = async (req, res) => {
  try {
    const { userId } = req.params;
    const { teacherId = null } = req.body;
    if (!validId(userId)) return fail(res, "Invalid student id", 400);
    if (teacherId !== null) {
      if (!validId(teacherId) || !(await User.exists({ _id: teacherId, role: "teacher" })))
        return fail(res, "teacherId must be a teacher", 400);
    }
    const student = await User.findOneAndUpdate(
      { _id: userId, role: "student" },
      { teacher: teacherId },
      { new: true },
    );
    if (!student) return fail(res, "Student not found", 404);
    res.json({ success: true, studentId: student._id, teacherId: student.teacher });
  } catch (e) {
    fail(res, e);
  }
};

// GET /api/admin/teachers (admin only): one row per teacher with class stats
export const teachersOverview = async (req, res) => {
  try {
    res.json({ success: true, ...(await getTeachersOverview()) });
  } catch (e) {
    fail(res, e);
  }
};
