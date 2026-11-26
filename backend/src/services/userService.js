import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const registerUserService = async (userData) => {
  const { name, email, password } = userData;
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ normalizedEmail });
  if (existingUser) {
    throw new Error("Email already registered");
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    normalizedEmail,
    password: hashedPassword,
  });
  return user;
};

export const loginUserService = async (userData) => {
  const { email, password } = userData;
  // find user by email
  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  });
  if (!user) {
    throw new Error("Invalid email or Password");
  }
  //compare password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  return user;
};
