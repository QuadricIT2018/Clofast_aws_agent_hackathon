import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/users.js";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// ✅ Signup Controller
export const signupUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { firstName, lastName, email, password, organizationName } = req.body;

    if (!firstName || !lastName || !email || !password || !organizationName) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      organizationName,
      profiles: [],
      numberOfReconciledProfiles: 0,
      numberOfUnReconciledProfiles: 0,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id, email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        _id: newUser._id,
        firstName,
        lastName,
        email,
        organizationName,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ Signin Controller
export const signinUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("hello");
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ id: user._id, email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organizationName: user.organizationName,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
