import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../db/user";

// Login handler
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,

        code: "login-e1",
        message: "Email and password are required",
      });
      return;
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({
        success: false,
        code: "login-e2",
        message: "Invalid credentials",
      });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        code: "login-e3",
        message: "Invalid credentials",
      });
      return;
    }

    // Payload for JWT
    const payload = {
      user: { id: user._id, uid: user.uid, email: user.email },
    };

    // Get JWT secret
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET undefined");
      res.status(500).json({
        success: false,
        code: "login-e4",
        message: "Server config error",
      });
      return;
    }

    // Sign token
    jwt.sign(payload, jwtSecret, { expiresIn: "7d" }, (err, token) => {
      if (err) {
        console.error("Token error:", err);
        res.status(500).json({
          success: false,
          code: "login-e5",
          message: "Token generation error",
        });
        return;
      }

      // Prepare user data
      const userData = {
        uid: user.uid,
        fullname: user.fullname,
        email: user.email,
        profileImage: user.profileImage,
      };

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: { user: userData, token },
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      code: "login-e6",
      message: "Server error",
    });
  }
};

export default login;
