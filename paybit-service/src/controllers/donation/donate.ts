import { Request, Response } from "express";
import mongoose from "mongoose";
import DonationCampaign from "../../db/donation";
import User from "../../db/user";
import transferFunds from "../../services/transferFunds";

/**
 * Donate to Campaign Controller
 * Allows a user to donate to a campaign
 *
 * @route POST /api/donation/donate/:id
 * @access Private (requires auth token)
 */
export const donate = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        code: "donate-e1",
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
        code: "donate-e2",
        message: "Invalid campaign ID format",
      });
      return;
    }

    // Get donation amount from request body
    const { amount } = req.body;

    // Validate donation amount
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      res.status(400).json({
        success: false,
        code: "donate-e3",
        message: "Valid donation amount greater than 0 is required",
      });
      return;
    }

    const donationAmount = Number(amount);

    // Add additional validation for donation amounts if needed
    if (donationAmount < 1) {
      // Minimum donation amount
      res.status(400).json({
        success: false,
        code: "donate-e4",
        message: "Minimum donation amount is 1",
      });
      return;
    }

    // Get the user making the donation
    const donorUser = await User.findById(req.user.id);
    if (!donorUser) {
      res.status(404).json({
        success: false,
        code: "donate-e5",
        message: "Donor user not found",
      });
      return;
    }

    // Find the campaign
    const campaign = await DonationCampaign.findById(id);
    if (!campaign) {
      res.status(404).json({
        success: false,
        code: "donate-e6",
        message: "Campaign not found",
      });
      return;
    }

    // Find the campaign creator
    const creatorUser = await User.findOne({ uid: campaign.creatorUid });
    if (!creatorUser) {
      res.status(404).json({
        success: false,
        code: "donate-e7",
        message: "Campaign creator not found",
      });
      return;
    }

    // Prevent users from donating to their own campaigns
    if (donorUser.uid === campaign.creatorUid) {
      res.status(400).json({
        success: false,
        code: "donate-e8",
        message: "You cannot donate to your own campaign",
      });
      return;
    }

    // Process the donation by transferring funds
    try {
      await transferFunds(
        String(donorUser._id),
        String(creatorUser._id),
        donationAmount,
        campaign.name,
        "donation",
      );
    } catch (transferError: any) {
      res.status(400).json({
        success: false,
        code: "donate-e9",
        message: "Failed to process donation",
        details: transferError.message,
      });
      return;
    }

    // Update the campaign's collected amount
    const newCollectedAmount = campaign.collectedAmount + donationAmount;
    campaign.collectedAmount = newCollectedAmount;
    await campaign.save();

    // Calculate progress percentage
    const progress = Math.min(
      100,
      Math.round((newCollectedAmount / campaign.goalAmount) * 100),
    );

    // Determine if campaign is now complete
    const isComplete = newCollectedAmount >= campaign.goalAmount;

    // Return successful response
    res.status(200).json({
      success: true,
      message: "Donation successful",
      data: {
        campaignId: campaign._id,
        campaignName: campaign.name,
        donationAmount,
        donorName: donorUser.fullname,
        newTotal: newCollectedAmount,
        progress,
        isComplete,
      },
    });
  } catch (error) {
    console.error("Donation error:", error);
    res.status(500).json({
      success: false,
      code: "donate-e10",
      message: "Server error processing donation",
    });
  }
};

export default donate;
