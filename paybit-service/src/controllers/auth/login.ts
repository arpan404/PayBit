import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../../db/user';

/**
 * User login controller
 * 
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        code: 'login-e1',
        message: 'Email and password are required',
      });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({
        success: false,
        code: 'login-e2',
        message: 'Invalid credentials',
      });
      return;
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        code: 'login-e3',
        message: 'Invalid credentials',
      });
      return;
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user._id,
        uid: user.uid,
        email: user.email
      }
    };

    // Get JWT secret from environment variable
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined');
      res.status(500).json({
        success: false,
        code: 'login-e4',
        message: 'Server configuration error',
      });
      return;
    }

    // Sign token
    jwt.sign(
      payload,
      jwtSecret,
      { 
        expiresIn: '7d' // Token expires in 7 days
      },
      (err, token) => {
        if (err) {
          console.error('Token generation error:', err);
          res.status(500).json({
            success: false,
            code: 'login-e5',
            message: 'Error generating authentication token',
          });
          return;
        }

        // Return user data and token
        const userData = {
          uid: user.uid,
          fullname: user.fullname,
          email: user.email,
          profileImage: user.profileImage,
        };

        res.status(200).json({
          success: true,
          message: 'Login successful',
          data: {
            user: userData,
            token
          }
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      code: 'login-e6',
      message: 'Server error during login',
    });
  }
};

export default login;