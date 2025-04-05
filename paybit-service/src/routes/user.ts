import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import sendRequest from '../controllers/user/sendRequest';
import changeProfile from '../controllers/user/changeProfile';

const router = Router();

router.post('/request', authMiddleware, sendRequest);
router.post("/change-profile", authMiddleware, changeProfile);

export default router;