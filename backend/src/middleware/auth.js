import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

const DEV_SECRET = "learnpath-dev-secret-change-me";
let warned = false;

const secret = () => {
  if (!process.env.JWT_SECRET && !warned) {
    console.warn("JWT_SECRET is not set in .env: using an insecure development secret.");
    warned = true;
  }
  return process.env.JWT_SECRET || DEV_SECRET;
};

// Token payload: just enough to authorise requests without a DB lookup.
export const signToken = (user) =>
  jwt.sign({ id: String(user._id), role: user.role, name: user.name }, secret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// Requires "Authorization: Bearer <token>". Sets req.user = { id, role, name }.
export const protect = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }
  try {
    req.user = jwt.verify(token, secret());
    return next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError" ? "Session expired, please log in again" : "Invalid token";
    return res.status(401).json({ success: false, message });
  }
};

// For /students/:userId/... routes:
//   student → only their own data, teacher → only students mapped to them, admin → anyone.
export const ownDataOnly = async (req, res, next) => {
  const { id, role } = req.user;
  const { userId } = req.params;
  if (role === "admin" || userId === id) return next();
  if (role === "teacher" && mongoose.Types.ObjectId.isValid(userId)) {
    const isMine = await User.exists({ _id: userId, role: "student", teacher: id });
    if (isMine) return next();
    return res.status(403).json({ success: false, message: "This student is not assigned to you" });
  }
  return res.status(403).json({ success: false, message: "You can only access your own data" });
};

// Teacher + admin routes.
export const staffOnly = (req, res, next) => {
  if (req.user.role === "teacher" || req.user.role === "admin") return next();
  return res.status(403).json({ success: false, message: "Teachers and admins only" });
};

export const adminOnly = (req, res, next) => {
  if (req.user.role === "admin") return next();
  return res.status(403).json({ success: false, message: "Admins only" });
};
