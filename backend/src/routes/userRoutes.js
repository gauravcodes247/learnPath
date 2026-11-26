/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user (returns a JWT)
 *     security: []
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Gaurav
 *               email:
 *                 type: string
 *                 example: gaurav@test.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *               teacherId:
 *                 type: string
 *                 description: optional, id from /api/users/teachers
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: Email already registered
 * /api/users/login:
 *   post:
 *     summary: Log in (returns a JWT)
 *     security: []
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, example: demo@learnpath.com }
 *               password: { type: string, example: "123456" }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid email or password }
 * /api/users/teachers:
 *   get:
 *     summary: List teachers (public, for the sign-up dropdown)
 *     tags: [Users]
 *     security: []
 *     responses:
 *       200: { description: OK }
 * /api/users/me:
 *   get:
 *     summary: Current user from the JWT
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Missing / invalid / expired token }
 */

import express from "express";
import { registerUser, loginUser, getMe, listTeachers } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Register a new user
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.get("/teachers", listTeachers);


export default router;
