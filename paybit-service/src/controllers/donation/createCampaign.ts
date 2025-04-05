import { Request, Response } from "express";
import DonationCampaign from "../../db/donation";
import User from "../../db/user";

// Create a donation campaign
export const createCampaign = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res
        .status(401)
        .json({
          success: false,
          code: "donation-e1",
          message: "User not authenticated",
        });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res
        .status(404)
        .json({
          success: false,
          code: "donation-e2",
          message: "User not found",
        });
      return;
    }

    const { name, description, goalAmount, image } = req.body;
    if (!name || !description) {
      res
        .status(400)
        .json({
          success: false,
          code: "donation-e3",
          message: "Campaign name and description are required",
        });
      return;
    }

    if (name.length < 5 || name.length > 100) {
      res
        .status(400)
        .json({
          success: false,
          code: "donation-e4",
          message: "Campaign name must be between 5 and 100 characters",
        });
      return;
    }

    if (description.length < 20 || description.length > 2000) {
      res
        .status(400)
        .json({
          success: false,
          code: "donation-e5",
          message:
            "Campaign description must be between 20 and 2000 characters",
        });
      return;
    }

    if (!goalAmount || isNaN(goalAmount) || goalAmount <= 0) {
      res
        .status(400)
        .json({
          success: false,
          code: "donation-e6",
          message: "Valid goal amount greater than 0 is required",
        });
      return;
    }

    if (image && typeof image === "string") {
      const validUrlPattern = /^(https?:\/\/)/i;
      if (!validUrlPattern.test(image)) {
        res
          .status(400)
          .json({
            success: false,
            code: "donation-e7",
            message: "Image must be a valid URL",
          });
        return;
      }
    }

    const campaign = new DonationCampaign({
      name,
      description,
      creatorUid: user.uid,
      goalAmount: Number(goalAmount),
      collectedAmount: 0,
      image: image || "",
    });

    await campaign.save();
    const campaignObj = campaign.toObject();

    res.status(201).json({
      success: true,
      message: "Donation campaign created successfully",
      data: {
        id: campaignObj._id,
        name: campaignObj.name,
        description: campaignObj.description,
        creatorUid: campaignObj.creatorUid,
        goalAmount: campaignObj.goalAmount,
        collectedAmount: campaignObj.collectedAmount,
        image: campaignObj.image,
      },
    });
  } catch (error) {
    console.error("Create donation campaign error:", error);
    res.status(500).json({
      success: false,
      code: "donation-e8",
      message: "Server error creating donation campaign",
    });
  }
};

export default createCampaign;
