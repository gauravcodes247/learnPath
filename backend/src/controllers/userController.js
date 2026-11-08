import { registerUserService } from "../services/userService.js";

export const registerUser = async (req, res) => {
  try {
    const user = await registerUserService(req.body);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    const statusCode = error.message === "Email already registered" ? 409 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};
