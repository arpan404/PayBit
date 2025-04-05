import { Router } from "express";
import authMiddleware from "../middleware/auth";
import upload from "../middleware/upload";
import changeProfile from "../controllers/user/changeProfile";
import sendRequest from "../controllers/user/sendRequest";
import fetchRequests from "../controllers/user/fetchRequest";
import { getContacts } from "../controllers/user/getContacts";
import { addContact } from "../controllers/user/addContacts";

const router = Router();

// User profile routes
router.put(
  "/profile",
  authMiddleware,
  upload.single("profileImage"),
  changeProfile
);

// Contact management routes
router.get("/contacts", authMiddleware, async (req, res) => {
  await getContacts(req, res);
});
router.post("/contacts", authMiddleware, addContact);

// Request management routes
router.post("/request", authMiddleware, sendRequest);
router.get("/requests", authMiddleware, fetchRequests);

export default router;
