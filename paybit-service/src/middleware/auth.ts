import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

/**
 * Authentication middleware
 * Verifies JWT token and adds user data to request
 */
export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    // Get token from header
    const token = req.header("x-auth-token");

    // Check if no token
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

        // Verify token
        const decoded = jwt.verify(token, jwtSecret);

        // Add user from payload to request
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
