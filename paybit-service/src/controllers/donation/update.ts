import { Request, Response } from "express";
import mongoose from "mongoose";
import DonationCampaign from "../../db/donation";
import User from "../../db/user";

/**
 * Update Donation Campaign Controller
 * Allows a user to update their own donation campaign
 *
 * @route PUT /api/donation/campaign/:id
 * @access Private (requires auth token)
 */
export const updateCampaign = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        code: "update-campaign-e1",
        message: "User not authenticated",
        
      });
      return;
    }

    // Get campaign ID from route params
    const { id } = req.params;

    // Validate campaign ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        code: "update-campaign-e2",
        message: "Invalid campaign ID format",
      });
      return;
    }

    // Find the campaign
    const campaign = await DonationCampaign.findById(id);

    // Check if campaign exists
    if (!campaign) {
      res.status(404).json({
        success: false,
        code: "update-campaign-e3",
        message: "Campaign not found",
      });
      return;
    }

    // Get the user making the request
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        code: "update-campaign-e4",
        message: "User not found",
      });
      return;
    }

    // Check if user is the creator of the campaign
    if (campaign.creatorUid !== user.uid) {
      res.status(403).json({
        success: false,
        code: "update-campaign-e5",
        message: "You are not authorized to update this campaign",
      });
      return;
    }

    // Extract update data from request body
    const { name, description, goalAmount, image } = req.body;
    const updateData: any = {};

    // Validate and add name if provided
    if (name !== undefined) {
      if (typeof name !== "string" || name.length < 5 || name.length > 100) {
        res.status(400).json({
          success: false,
          code: "update-campaign-e6",
          message: "Campaign name must be between 5 and 100 characters",
        });
        return;
      }
      updateData.name = name;
    }

    // Validate and add description if provided
    if (description !== undefined) {
      if (
        typeof description !== "string" ||
        description.length < 20 ||
        description.length > 2000
      ) {
        res.status(400).json({
          success: false,
          code: "update-campaign-e7",
          message:
            "Campaign description must be between 20 and 2000 characters",
        });
        return;
      }
      updateData.description = description;
    }

    // Validate and add goalAmount if provided
    if (goalAmount !== undefined) {
      const newGoalAmount = Number(goalAmount);
      if (isNaN(newGoalAmount) || newGoalAmount <= 0) {
        res.status(400).json({
          success: false,
          code: "update-campaign-e8",
          message: "Goal amount must be a positive number",
        });
        return;
      }

      // Additional validation: don't allow reducing goal below collected amount
      if (newGoalAmount < campaign.collectedAmount) {
        res.status(400).json({
          success: false,
          code: "update-campaign-e9",
          message:
            "Goal amount cannot be less than the already collected amount",
        });
        return;
      }

      updateData.goalAmount = newGoalAmount;
    }

    // Validate and add image if provided
    if (image !== undefined) {
      if (image && typeof image !== "string") {
        res.status(400).json({
          success: false,
          code: "update-campaign-e10",
          message: "Image must be a valid URL string",
        });
        return;
      }

      // Optional: validate image URL format
      if (image && !image.match(/^https?:\/\/.+/i)) {
        res.status(400).json({
          success: false,
          code: "update-campaign-e11",
          message: "Image must be a valid URL",
        });
        return;
      }

      updateData.image = image;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        code: "update-campaign-e12",
        message: "No valid fields to update",
      });
      return;
    }

    // Update the campaign
    const updatedCampaign = await DonationCampaign.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }, // Return the updated document
    );

    // Calculate the progress percentage
    const progress =
      updatedCampaign!.goalAmount > 0
        ? (updatedCampaign!.collectedAmount / updatedCampaign!.goalAmount) * 100
        : 0;

    // Return success response with updated campaign
    res.status(200).json({
      success: true,
      message: "Campaign updated successfully",
      data: {
        id: updatedCampaign!._id,
        name: updatedCampaign!.name,
        description: updatedCampaign!.description,
        creatorUid: updatedCampaign!.creatorUid,
        goalAmount: updatedCampaign!.goalAmount,
        collectedAmount: updatedCampaign!.collectedAmount,
        progress: Math.min(100, Math.round(progress * 100) / 100),
        image: updatedCampaign!.image,
        createdAt: updatedCampaign!.createdAt,
        updatedAt: updatedCampaign!.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update campaign error:", error);
    res.status(500).json({
      success: false,
      code: "update-campaign-e13",
      message: "Server error updating campaign",
    });
  }
};

export default updateCampaign;
