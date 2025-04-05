import { Router } from "express";
import signup from "../controllers/auth/signup";
import login from "../controllers/auth/login";
import authMiddleware from "../middleware/auth";
import changePassword from "../controllers/auth/changePassword";
import autoLogin from "../controllers/auth/autoLogin";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/auto-login", authMiddleware, autoLogin);
router.post("/change-password", authMiddleware, async (req, res) => {
  await changePassword(req, res);
});

export default router;

