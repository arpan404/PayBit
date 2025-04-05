import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import User from "../../db/user";
import { validateEmail, validatePassword } from "../../utils/validation";

// Signup controller
export const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullname, email, password, profileImage } = req.body;

        // Check required fields
        if (!fullname || !email || !password) {
            res.status(400).json({
                success: false,
                code: "signup-e1",
                message: "Missing required fields",
            });
            return;
        }

        // Validate email
        if (!validateEmail(email)) {
            res.status(400).json({
                success: false,
                code: "signup-e2",
                message: "Invalid email format",
            });
            return;
        }

        // Validate password
        if (!validatePassword(password)) {
            res.status(400).json({
                success: false,
                code: "signup-e3",
                message:
                    "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
            });
            return;
        }

        // Check for existing user
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

        // Create user
        const newUser = new User({
            fullname,
            email,
            password: hashedPassword,
            profileImage: profileImage || "",
            uid,
        });

        // Save user
        await newUser.save();

        // Prepare user data (no password)
        const userData = {
            uid: newUser.uid,
            fullname: newUser.fullname,
            email: newUser.email,
            profileImage: newUser.profileImage,
        };

        // Payload for JWT
        const payload = {
            user: { id: newUser._id, uid: newUser.uid, email: newUser.email },
        };

        // Get JWT secret
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error("JWT_SECRET undefined");
            res.status(500).json({
                success: false,
                code: "signup-e6",
                message: "Server config error",
            });
            return;
        }

        // Sign token
        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: "7d" },
            (err, token) => {
                if (err) {
                    console.error("Token error:", err);
                    res.status(500).json({
                        success: false,
                        code: "signup-e7",
                        message: "Token generation error",
                    });
                    return;
                }

                // Return user data and token
                res.status(201).json({
                    success: true,
                    message: "User registered successfully",
                    data: { user: userData, token },
                });
            }
        );
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
