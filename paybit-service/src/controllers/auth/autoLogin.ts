import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

const autoLogin = (req: Request, res: Response) => {

    const user = req.user as { id: string; fullname: string; email: string; profileImage: string };

    // Create a new JWT token
    const newToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '30d' }
    );

    res.json({
        uid: user.id,
        fullname: user.fullname,
        email: user.email,
        profileImage: user.profileImage,
        jstoken: newToken,
    });
};

export default autoLogin;