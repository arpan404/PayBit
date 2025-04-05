
import { Router } from "express";
import { getTransactionHistory } from "../controllers/transaction/history";
import authMiddleware from "../middleware/auth";
const router = Router();
router.get("/history", authMiddleware, getTransactionHistory);
export default router;
