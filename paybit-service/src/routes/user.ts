import express from "express";
import getContacts from "../../controllers/user/getContacts";
import authMiddleware from "../../middleware/auth";

const router = express.Router();

// GET /api/user/contacts - Get all contacts for authenticated user
router.get("/contacts", authMiddleware, getContacts);

export default router;
