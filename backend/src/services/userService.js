import mongoose from "mongoose";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const registerUserService = async (userData) => {
  const { name, email, password, teacherId } = userData;
  if (!name || !email || !password) throw new Error("Name, email and password are required");
  // Optional: the teacher the student picked at sign-up
  let teacher = null;
  if (teacherId) {
    const found = mongoose.Types.ObjectId.isValid(teacherId) && (await User.exists({ _id: teacherId, role: "teacher" }));
    if (!found) throw new Error("Selected teacher is not valid");
    teacher = teacherId;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new Error("Email already registered");
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    teacher,
  });
  return user;
};

export const loginUserService = async (userData) => {
  const { email, password } = userData;
  if (!email || !password) throw new Error("Invalid email or password");
  // find user by email
  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  });
  if (!user) {
    throw new Error("Invalid email or password");
  }
  //compare password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  return user;
};

export const listTeachersService = () =>
  User.find({ role: "teacher" }).select("name").sort({ name: 1 }).lean();
