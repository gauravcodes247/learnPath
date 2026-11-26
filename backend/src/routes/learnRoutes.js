import express from "express";
import {
  listContent,
  semanticSearch,
  listTopics,
  getQuizQuestions,
  submitAttempt,
  studentAnalytics,
  studentRecommendations,
  myStudentsOverview,
  assignTeacher,
  teachersOverview,
} from "../controllers/learnController.js";
import { protect, ownDataOnly, staffOnly, adminOnly } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/content:
 *   get:
 *     summary: List content library (optionally by topic)
 *     tags: [Content]
 *     parameters:
 *       - { in: query, name: topic, schema: { type: string } }
 *     responses: { 200: { description: OK } }
 * /api/content/search:
 *   get:
 *     summary: Semantic (vector) search over the content library
 *     tags: [Content]
 *     parameters:
 *       - { in: query, name: q, required: true, schema: { type: string }, example: "shortest path in a weighted graph" }
 *     responses: { 200: { description: OK } }
 * /api/quiz/topics:
 *   get:
 *     summary: Topics with question counts
 *     tags: [Quiz]
 *     responses: { 200: { description: OK } }
 * /api/quiz/questions:
 *   get:
 *     summary: Random questions for a topic
 *     tags: [Quiz]
 *     parameters:
 *       - { in: query, name: topic, schema: { type: string }, example: Graphs }
 *       - { in: query, name: limit, schema: { type: integer }, example: 5 }
 *     responses: { 200: { description: OK } }
 * /api/quiz/attempts:
 *   post:
 *     summary: Save a quiz attempt for the logged-in student (graded on the server, invalidates recommendation cache)
 *     tags: [Quiz]
 *     responses: { 201: { description: Created } }
 * /api/students/{userId}/analytics:
 *   get:
 *     summary: Topic-wise accuracy, overall stats and score trend (own data only, 403 otherwise)
 *     tags: [Students]
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: string } }
 *     responses: { 200: { description: OK } }
 * /api/students/{userId}/recommendations:
 *   get:
 *     summary: Personalised study plan + practice questions (cached with TTL)
 *     tags: [Students]
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: string } }
 *       - { in: query, name: refresh, schema: { type: boolean } }
 *     responses: { 200: { description: OK } }
 * /api/teacher/students:
 *   get:
 *     summary: "Teacher: own students. Admin: all students (or ?teacherId=). Quizzes, scores, this week, weak/strongest topics"
 *     tags: [Teacher]
 *     parameters:
 *       - { in: query, name: teacherId, schema: { type: string }, description: "admin only: filter by teacher" }
 *     responses:
 *       200: { description: OK }
 *       403: { description: Not a teacher/admin }
 * /api/admin/teachers:
 *   get:
 *     summary: "Admin only: every teacher with student count, active this week, class average, students below 60%, weakest topic"
 *     tags: [Admin]
 *     responses:
 *       200: { description: OK }
 *       403: { description: Not an admin }
 * /api/admin/students/{userId}/teacher:
 *   patch:
 *     summary: "Admin only: assign a student to a teacher (teacherId null = unassign)"
 *     tags: [Admin]
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { teacherId: { type: string, nullable: true } } }
 *     responses:
 *       200: { description: OK }
 *       400: { description: teacherId is not a teacher }
 */

// Every route below needs a valid JWT (Authorization: Bearer <token>).
router.get("/content", protect, listContent);
router.get("/content/search", protect, semanticSearch);
router.get("/quiz/topics", protect, listTopics);
router.get("/quiz/questions", protect, getQuizQuestions);
router.post("/quiz/attempts", protect, submitAttempt); // user comes from the token
router.get("/students/:userId/analytics", protect, ownDataOnly, studentAnalytics);
router.get("/students/:userId/recommendations", protect, ownDataOnly, studentRecommendations);
router.get("/teacher/students", protect, staffOnly, myStudentsOverview);
router.patch("/admin/students/:userId/teacher", protect, adminOnly, assignTeacher);
router.get("/admin/teachers", protect, adminOnly, teachersOverview);

export default router;
