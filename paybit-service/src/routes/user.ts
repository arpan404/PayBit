import { Router } from "express";
import authMiddleware from "../middleware/auth";
import upload from "../middleware/upload";
import changeProfile from "../controllers/user/changeProfile";
import sendRequest from "../controllers/user/sendRequest";
import fetchRequests from "../controllers/user/fetchRequest";
import { getContacts } from "../controllers/user/getContacts";

const router = Router();

router.put(
  "/profile",
  authMiddleware,
  upload.single("profileImage"),
  changeProfile,
);
router.get("/contacts", authMiddleware, getContacts);
router.post("/request", authMiddleware, sendRequest);
router.get("/requests", authMiddleware, fetchRequests);

export default router;
