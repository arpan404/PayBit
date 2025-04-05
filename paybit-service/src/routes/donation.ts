import { Router } from "express";
import donate from "../controllers/donation/donate";
import authMiddleware from "../middleware/auth";
import deleteCampaign from "../controllers/donation/delete";
import createCampaign from "../controllers/donation/createCampaign";
import updateCampaign from "../controllers/donation/update";
import { fetchCampaign } from "../controllers/donation/fetchCampaign";

const router = Router();

router.post("/donate/:id", authMiddleware, donate);
router.delete("/campaign/:id", authMiddleware, deleteCampaign);
router.post("/campaign", authMiddleware, createCampaign);
router.put("/campaign/:id", authMiddleware, updateCampaign);
router.get("/campaign/:id", fetchCampaign);
router.get("/campaign", fetchCampaign);

export default router;
