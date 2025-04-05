import { Request, Response } from 'express';
import mongoose from 'mongoose';
import DonationCampaign from '../../db/donation';
import User from '../../db/user';
import transferFunds from '../../services/transferFunds';

/**
 * Donate to Campaign Controller
 * Allows an authenticated user to donate to a campaign
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
                code: 'donate-e1',
                message: 'User not authenticated',
            });
            return;
        }

        // Get campaign ID from route params
        const { id } = req.params;

        // Validate campaign ID format
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                code: 'donate-e2',
                message: 'Invalid campaign ID format',
            });
            return;
        }

        // Get donation amount from request body
        const { amount } = req.body;

        // Validate donation amount
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            res.status(400).json({
                success: false,
                code: 'donate-e3',
                message: 'Valid donation amount greater than 0 is required',
            });
            return;
        }

        const donationAmount = Number(amount);

        // Add additional validation for donation amounts if needed
        if (donationAmount < 1) { // Minimum donation amount
            res.status(400).json({
                success: false,
                code: 'donate-e4',
                message: 'Minimum donation amount is 1',
            });
            return;
        }

        // Get the user making the donation
        const donorUser = await User.findById(req.user.id);
        if (!donorUser) {
            res.status(404).json({
                success: false,
                code: 'donate-e5',
                message: 'Donor user not found',
            });
            return;
        }

        // Find the campaign
        const campaign = await DonationCampaign.findById(id);

        // Check if campaign exists
        if (!campaign) {
            res.status(404).json({
                success: false,
                code: 'donate-e6',
                message: 'Campaign not found',
            });
            return;
        }

        // Find the campaign creator
        const campaignCreator = await User.findOne({ uid: campaign.creatorUid });
        if (!campaignCreator) {
            res.status(404).json({
                success: false,
                code: 'donate-e7',
                message: 'Campaign creator not found',
            });
            return;
        }

        // Prevent donating to your own campaign (optional, remove if self-donations are allowed)
        if (donorUser.uid === campaign.creatorUid) {
            res.status(400).json({
                success: false,
                code: 'donate-e8',
                message: 'You cannot donate to your own campaign',
            });
            return;
        }

        // Process the donation through dummy transfer function
        // This will be replaced with actual blockchain transaction later
        try {
            // Call dummy transfer function
            await transferFunds(
                String(donorUser._id),  // Sender ID
                String(campaignCreator._id), // Receiver ID
                donationAmount // Amount
            );
        } catch (transferError) {
            // Handle transfer errors
            res.status(400).json({
                success: false,
                code: 'donate-e9',
                message: 'Error processing donation transfer',
                details: (transferError as Error).message
            });
            return;
        }

        // Update campaign's collected amount
        campaign.collectedAmount += donationAmount;
        await campaign.save();

        // Calculate updated progress
        const progress = campaign.goalAmount > 0
            ? (campaign.collectedAmount / campaign.goalAmount) * 100
            : 0;

        // Return success response
        res.status(200).json({
            success: true,
            message: 'Donation successful',
            data: {
                campaignId: campaign._id,
                campaignName: campaign.name,
                donationAmount,
                donorName: donorUser.fullname,
                newTotal: campaign.collectedAmount,
                progress: Math.min(100, Math.round(progress * 100) / 100),
                isComplete: campaign.collectedAmount >= campaign.goalAmount
            }
        });
    } catch (error) {
        console.error('Donation error:', error);
        res.status(500).json({
            success: false,
            code: 'donate-e10',
            message: 'Server error processing donation',
        });
    }
};

export default donate;