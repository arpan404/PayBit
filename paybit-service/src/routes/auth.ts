import { Router } from "express";
import signup from "../controllers/auth/signup";
import login from "../controllers/auth/login";
import authMiddleware from "../middleware/auth";
import forgetPassword from "../controllers/auth/forgetPassword";
import autoLogin from "../controllers/auth/autoLogin";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/auto-login", authMiddleware, autoLogin);
router.post("/forget-password", authMiddleware, async (req, res) => {
    await forgetPassword(req, res);
});

export default router;
