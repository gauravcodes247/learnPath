import User from "../models/User.js";
import { registerUserService, loginUserService, listTeachersService } from "../services/userService.js";
import { signToken } from "../middleware/auth.js";

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  teacher: user.teacher || null,
});

export const loginUser = async (req, res) => {
  try {
    const user = await loginUserService(req.body);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    const statusCode = error.message === "Invalid email or password" ? 401 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const registerUser = async (req, res) => {
  try {
    const user = await registerUserService(req.body);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    const statusCode =
      error.message === "Email already registered"
        ? 409
        : /required|not valid/.test(error.message)
          ? 400
          : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/users/me (protected): who does this token belong to?
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/teachers (public): for the "choose your teacher" dropdown at sign-up
export const listTeachers = async (req, res) => {
  try {
    const teachers = await listTeachersService();
    return res.status(200).json({ success: true, teachers: teachers.map((t) => ({ id: t._id, name: t.name })) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
