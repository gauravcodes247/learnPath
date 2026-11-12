/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
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
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: Email already registered
 */

import express from "express";
import { registerUser } from "../controllers/userController.js";

const router = express.Router();

// Register a new user
router.post("/register", registerUser);

export default router;
