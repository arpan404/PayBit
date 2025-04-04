import { Router } from 'express';
import signup from '../controllers/auth/signup';
import login from '../controllers/auth/login';

const router = Router();

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

export default router;