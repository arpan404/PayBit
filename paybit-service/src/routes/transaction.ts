import { Router } from "express";
import {
  getTransactionHistory,
  getTransactionDetails,
} from "../controllers/transaction/history";
import authMiddleware from "../middleware/auth";
const router = Router();
router.get("/history", authMiddleware, getTransactionHistory);
router.get("/details/:transactionId", authMiddleware, getTransactionDetails);
export default router;
