import express from "express";
import userRoutes from "./userRoutes.js";
import learnRoutes from "./learnRoutes.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/", learnRoutes);

export default router;
