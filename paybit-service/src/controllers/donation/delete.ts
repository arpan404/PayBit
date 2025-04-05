import { Request, Response } from "express";
import mongoose from "mongoose";
import DonationCampaign from "../../db/donation";
import User from "../../db/user";

/**
 * Delete Donation Campaign Controller
 * Allows a user to delete their own donation campaign
 *
 * @route DELETE /api/donation/campaign/:id
 * @access Private (requires auth token)
 */
export const deleteCampaign = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        code: "delete-campaign-e1",
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
        code: "delete-campaign-e2",
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
        code: "delete-campaign-e3",
        message: "Campaign not found",
      });
      return;
    }

    // Get the user making the request
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        code: "delete-campaign-e4",
        message: "User not found",
      });
      return;
    }

    // Check if user is the creator of the campaign
    if (campaign.creatorUid !== user.uid) {
      res.status(403).json({
        success: false,
        code: "delete-campaign-e5",
        message: "You are not authorized to delete this campaign",
      });
      return;
    }

    // If campaign has received donations, provide additional warning
    if (campaign.collectedAmount > 0) {
      // Optional: Add additional validation or logging for campaigns with donations
      console.log(
        `Campaign ${id} with ${campaign.collectedAmount} in donations is being deleted by user ${user.uid}`,
      );
    }

    // Delete the campaign
    await DonationCampaign.findByIdAndDelete(id);

    // Return success response
    res.status(200).json({
      success: true,
      message: "Campaign deleted successfully",
      data: {
        id: campaign._id,
        name: campaign.name,
      },
    });
  } catch (error) {
    console.error("Delete campaign error:", error);
    res.status(500).json({
      success: false,
      code: "delete-campaign-e6",
      message: "Server error deleting campaign",
    });
  }
};

export default deleteCampaign;
