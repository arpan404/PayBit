import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        uid: string;
        email: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies the JWT token and adds the user to the request object
 */
const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Get token from header
  const token = req.header("x-auth-token");

  // Check if no token
  if (!token) {
    return res.status(401).json({
      success: false,
      code: "auth-e1",
      message: "No authentication token, access denied",
    });
  }

  try {
    // Verify token
    const jwtSecret = process.env.JWT_SECRET || "dev-secret";
    const decoded = jwt.verify(token, jwtSecret) as any;

    // Add user from payload to request
    req.user = decoded.user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      code: "auth-e2", 
      message: "Token is not valid",
    });
  }
};

export default authMiddleware;
