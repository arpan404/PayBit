import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../../db/user";

// Auto Login: Refresh token
export const autoLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for user in request
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        code: "auto-login-e0",
        message: "User not authenticated",
      });
      return;
    }

    // Retrieve user details
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        code: "auto-login-e1",
        message: "User not found",
      });
      return;
    }

    // JWT payload
    const payload = {
      user: {
        id: user._id,
        uid: user.uid,
        email: user.email,
      },
    };

    // JWT secret
    const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret";

    // Create token
    jwt.sign(payload, jwtSecret, { expiresIn: "7d" }, (err, token) => {
      if (err) {
        console.error("Token error:", err);
        res.status(500).json({
          success: false,
          code: "auto-login-e4",
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
        tapRootAddress: user.tapRootAddress,
        walletAddress: user.walletAddress,
      };

      // Send response
      res.status(200).json({
        success: true,
        message: "Auto login successful",
        data: {
          user: userData,
          token,
        },
      });
    });
  } catch (error) {
    console.error("Auto login error:", error);
    res.status(500).json({
      success: false,
      code: "auto-login-e2",
      message: "Server error during auto login",
    });
  }
};

export default autoLogin;
