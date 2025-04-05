import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import User from "../../db/user";
import { validateEmail, validatePassword } from "../../utils/validation";

/**
 * User signup controller
 *
 * @route POST /api/auth/signup
 * @access Public
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullname, email, password, profileImage } = req.body;

    // Validation checks
    if (!fullname || !email || !password) {
      res.status(400).json({
        success: false,
        code: "signup-e1",
        message: "Missing required fields",
      });
      return;
    }

    // Email validation
    if (!validateEmail(email)) {
      res.status(400).json({
        success: false,
        code: "signup-e2",
        message: "Invalid email format",
      });
      return;
    }

    // Password strength validation
    if (!validatePassword(password)) {
      res.status(400).json({
        success: false,
        code: "signup-e3",
        message:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        code: "signup-e4",
        message: "User with this email already exists",
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate unique ID
    const uid = uuidv4();

    // Create new user
    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
      profileImage: profileImage || "",
      uid,
    });

    // Save user to database
    await newUser.save();

    // Return success response with user data (excluding password)
    const userData = {
      uid: newUser.uid,
      fullname: newUser.fullname,
      email: newUser.email,
      profileImage: newUser.profileImage,
      createdAt: newUser.get("createdAt"),
    };

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userData,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      code: "signup-e5",
      message: "Server error during registration",
    });
  }
};

export default signup;
