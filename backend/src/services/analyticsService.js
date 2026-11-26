import mongoose from "mongoose";
import QuizAttempt from "../models/QuizAttempt.js";
import User from "../models/User.js";

export const WEAK_THRESHOLD = 60; // % accuracy below which a topic is "weak"

// One aggregation with $facet: per-topic accuracy, overall totals and
// the score trend of recent attempts, all from the attempts collection.
export async function getStudentAnalytics(userId) {
  const user = new mongoose.Types.ObjectId(userId);

  const [result] = await QuizAttempt.aggregate([
    { $match: { user } },
    {
      $facet: {
        byTopic: [
          { $unwind: "$answers" },
          {
            $group: {
              _id: "$answers.topic",
              attempted: { $sum: 1 },
              correct: { $sum: { $cond: ["$answers.correct", 1, 0] } },
              lastAttempt: { $max: "$createdAt" },
            },
          },
          {
            $project: {
              _id: 0,
              topic: "$_id",
              attempted: 1,
              correct: 1,
              lastAttempt: 1,
              accuracy: {
                $round: [{ $multiply: [{ $divide: ["$correct", "$attempted"] }, 100] }, 1],
              },
            },
          },
          { $sort: { accuracy: 1 } },
        ],
        overall: [
          {
            $group: {
              _id: null,
              attempts: { $sum: 1 },
              questions: { $sum: "$total" },
              correct: { $sum: "$score" },
            },
          },
          {
            $project: {
              _id: 0,
              attempts: 1,
              questions: 1,
              correct: 1,
              accuracy: {
                $round: [{ $multiply: [{ $divide: ["$correct", { $max: ["$questions", 1] }] }, 100] }, 1],
              },
            },
          },
        ],
        trend: [
          { $sort: { createdAt: -1 } },
          { $limit: 10 },
          { $sort: { createdAt: 1 } },
          {
            $project: {
              _id: 0,
              topic: 1,
              createdAt: 1,
              percent: {
                $round: [{ $multiply: [{ $divide: ["$score", { $max: ["$total", 1] }] }, 100] }, 0],
              },
            },
          },
        ],
      },
    },
  ]);

  return {
    byTopic: result.byTopic,
    overall: result.overall[0] || { attempts: 0, questions: 0, correct: 0, accuracy: 0 },
    trend: result.trend,
  };
}

// Recently missed questions for the given topics (used to ground the LLM).
export async function getRecentMistakes(userId, topics, perTopic = 3) {
  return QuizAttempt.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $sort: { createdAt: -1 } },
    { $unwind: "$answers" },
    { $match: { "answers.correct": false, "answers.topic": { $in: topics } } },
    { $group: { _id: "$answers.topic", questions: { $addToSet: "$answers.questionText" } } },
    { $project: { _id: 0, topic: "$_id", questions: { $slice: ["$questions", perTopic] } } },
  ]);
}

export function pickWeakTopics(byTopic, max = 3) {
  const weak = byTopic.filter((t) => t.accuracy < WEAK_THRESHOLD);
  // Nothing below the threshold: still suggest the lowest topic to improve.
  return (weak.length ? weak : byTopic.slice(0, 1)).slice(0, max);
}

// ---------- Teacher / admin view ----------

// One row per student: quizzes, this week's activity, overall accuracy,
// per-topic accuracy, weak + strongest topic. Starts from `users` so
// students with no attempts still appear; attempts come in via $lookup.
// teacherId given → only that teacher's students; omitted → every student (admin).
export async function getAllStudentsOverview(teacherId) {
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const pct = (num, den) => ({
    $cond: [{ $gt: [den, 0] }, { $round: [{ $multiply: [{ $divide: [num, den] }, 100] }, 1] }, null],
  });

  const match = { role: "student" };
  if (teacherId) match.teacher = new mongoose.Types.ObjectId(teacherId);

  return User.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "quizattempts",
        localField: "_id",
        foreignField: "user",
        as: "attempts",
      },
    },
    {
      $set: {
        thisWeekAttempts: { $filter: { input: "$attempts", cond: { $gte: ["$$this.createdAt", weekAgo] } } },
        allAnswers: {
          $reduce: { input: "$attempts.answers", initialValue: [], in: { $concatArrays: ["$$value", "$$this"] } },
        },
      },
    },
    {
      $set: {
        quizzes: { $size: "$attempts" },
        questions: { $sum: "$attempts.total" },
        correct: { $sum: "$attempts.score" },
        lastActive: { $max: "$attempts.createdAt" },
        quizzesThisWeek: { $size: "$thisWeekAttempts" },
        questionsThisWeek: { $sum: "$thisWeekAttempts.total" },
        correctThisWeek: { $sum: "$thisWeekAttempts.score" },
      },
    },
    // per-topic accuracy: unwind answers, group by (student, topic) ...
    { $unwind: { path: "$allAnswers", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { user: "$_id", topic: "$allAnswers.topic" },
        student: { $first: "$$ROOT" },
        attempted: { $sum: { $cond: [{ $ifNull: ["$allAnswers.topic", false] }, 1, 0] } },
        right: { $sum: { $cond: ["$allAnswers.correct", 1, 0] } },
      },
    },
    // ... then fold the topics back into one document per student
    {
      $group: {
        _id: "$_id.user",
        student: { $first: "$student" },
        topics: {
          $push: { topic: "$_id.topic", attempted: "$attempted", accuracy: pct("$right", "$attempted") },
        },
      },
    },
    {
      $set: {
        topics: {
          $sortArray: {
            // drop the empty row produced for students with no answers
            input: { $filter: { input: "$topics", cond: { $gt: ["$$this.attempted", 0] } } },
            sortBy: { accuracy: 1 },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        id: "$_id",
        name: "$student.name",
        email: "$student.email",
        joined: "$student.createdAt",
        quizzes: "$student.quizzes",
        questions: "$student.questions",
        correct: "$student.correct",
        accuracy: pct("$student.correct", "$student.questions"),
        lastActive: "$student.lastActive",
        thisWeek: {
          quizzes: "$student.quizzesThisWeek",
          questions: "$student.questionsThisWeek",
          accuracy: pct("$student.correctThisWeek", "$student.questionsThisWeek"),
        },
        topics: 1,
        weakTopics: {
          $map: {
            input: { $filter: { input: "$topics", cond: { $lt: ["$$this.accuracy", WEAK_THRESHOLD] } } },
            in: "$$this.topic",
          },
        },
        strongestTopic: { $arrayElemAt: ["$topics.topic", -1] },
        teacherId: "$student.teacher",
      },
    },
    // teacher's name for the admin view (self-join on users)
    { $lookup: { from: "users", localField: "teacherId", foreignField: "_id", as: "teacherDoc" } },
    { $set: { teacherName: { $ifNull: [{ $arrayElemAt: ["$teacherDoc.name", 0] }, null] } } },
    { $unset: "teacherDoc" },
    { $sort: { accuracy: 1, name: 1 } }, // students who need the most help first
  ]);
}

// ---------- Admin: one row per teacher ----------

// teacher → $lookup their students (users.teacher) → $lookup all those
// students' attempts (localField is an array of student ids) → class stats.
export async function getTeachersOverview() {
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const pct = (num, den) => ({
    $cond: [{ $gt: [den, 0] }, { $round: [{ $multiply: [{ $divide: [num, den] }, 100] }, 1] }, null],
  });

  const teachers = await User.aggregate([
    { $match: { role: "teacher" } },
    { $lookup: { from: "users", localField: "_id", foreignField: "teacher", as: "students" } },
    { $lookup: { from: "quizattempts", localField: "students._id", foreignField: "user", as: "attempts" } },
    {
      $set: {
        weekAttempts: { $filter: { input: "$attempts", cond: { $gte: ["$$this.createdAt", weekAgo] } } },
        allAnswers: {
          $reduce: { input: "$attempts.answers", initialValue: [], in: { $concatArrays: ["$$value", "$$this"] } },
        },
        // per-student score inside this teacher's class
        studentStats: {
          $map: {
            input: "$students",
            as: "s",
            in: {
              $let: {
                vars: { mine: { $filter: { input: "$attempts", cond: { $eq: ["$$this.user", "$$s._id"] } } } },
                in: { name: "$$s.name", questions: { $sum: "$$mine.total" }, correct: { $sum: "$$mine.score" } },
              },
            },
          },
        },
      },
    },
    {
      $set: {
        studentCount: { $size: "$students" },
        quizzes: { $size: "$attempts" },
        questions: { $sum: "$attempts.total" },
        correct: { $sum: "$attempts.score" },
        lastActive: { $max: "$attempts.createdAt" },
        quizzesThisWeek: { $size: "$weekAttempts" },
        activeThisWeek: { $size: { $setUnion: ["$weekAttempts.user", []] } },
        studentsBelowThreshold: {
          $size: {
            $filter: {
              input: "$studentStats",
              cond: {
                $and: [
                  { $gt: ["$$this.questions", 0] },
                  { $lt: [{ $divide: ["$$this.correct", "$$this.questions"] }, WEAK_THRESHOLD / 100] },
                ],
              },
            },
          },
        },
      },
    },
    // class-wide accuracy per topic → weakest topic of each teacher's class
    { $unwind: { path: "$allAnswers", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { teacher: "$_id", topic: "$allAnswers.topic" },
        t: { $first: "$$ROOT" },
        attempted: { $sum: { $cond: [{ $ifNull: ["$allAnswers.topic", false] }, 1, 0] } },
        right: { $sum: { $cond: ["$allAnswers.correct", 1, 0] } },
      },
    },
    {
      $group: {
        _id: "$_id.teacher",
        t: { $first: "$t" },
        topics: { $push: { topic: "$_id.topic", attempted: "$attempted", accuracy: pct("$right", "$attempted") } },
      },
    },
    {
      $set: {
        topics: {
          $sortArray: {
            input: { $filter: { input: "$topics", cond: { $gt: ["$$this.attempted", 0] } } },
            sortBy: { accuracy: 1 },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        id: "$_id",
        name: "$t.name",
        email: "$t.email",
        studentCount: "$t.studentCount",
        students: "$t.students.name",
        quizzes: "$t.quizzes",
        questions: "$t.questions",
        accuracy: pct("$t.correct", "$t.questions"),
        lastActive: "$t.lastActive",
        thisWeek: { quizzes: "$t.quizzesThisWeek", activeStudents: "$t.activeThisWeek" },
        studentsBelowThreshold: "$t.studentsBelowThreshold",
        weakestTopic: { $arrayElemAt: ["$topics", 0] },
        topics: 1,
      },
    },
    { $sort: { name: 1 } },
  ]);

  const unassigned = await User.countDocuments({ role: "student", teacher: null });
  return { teachers, unassigned };
}
