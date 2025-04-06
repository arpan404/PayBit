import { Router } from "express";
import { getTransactionHistory } from "../controllers/transaction/history";
import authMiddleware from "../middleware/auth";
import sendBTC from "../controllers/transaction/sendBTC";
const router = Router();
router.get("/history", authMiddleware, getTransactionHistory);
router.post("/send", authMiddleware, sendBTC);
export default router;
