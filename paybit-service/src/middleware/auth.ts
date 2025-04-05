import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.header("x-auth-token");

  if (!token) {
    res.status(401).json({
      success: false,
      code: "auth-e1",
      message: "No authentication token, access denied",
    });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not defined");
      res.status(500).json({
        success: false,
        code: "auth-e2",
        message: "Server configuration error",
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret);

    req.user = (decoded as any).user;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({
      success: false,
      code: "auth-e3",
      message: "Invalid authentication token",
    });
  }
};

export default authMiddleware;
