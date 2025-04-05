import { Request, Response } from 'express';
import mongoose from 'mongoose';
import DonationCampaign from '../../db/donation';

/**
 * Fetch Donation Campaign Controller
 * Retrieves donation campaigns with optional filtering and pagination
 * 
 * @route GET /api/donation/campaign
 * @route GET /api/donation/campaign/:id
 * @query creatorUid - Filter by campaign creator UID
 * @query search - Search campaigns by name or description
 * @query minGoal - Filter by minimum goal amount
 * @query maxGoal - Filter by maximum goal amount
 * @query sort - Sort by: 'newest', 'oldest', 'goal-high', 'goal-low', 'progress'
 * @query page - Page number for pagination
 * @query limit - Number of items per page
 * @access Public
 */
export const fetchCampaign = async (req: Request, res: Response): Promise<void> => {
    try {
        // Check if a specific campaign ID is requested
        const { id } = req.params;

        if (id) {
            // Fetch a single campaign by ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                res.status(400).json({
                    success: false,
                    code: 'fetch-campaign-e1',
                    message: 'Invalid campaign ID format',
                });
                return;
            }

            const campaign = await DonationCampaign.findById(id);
            
            if (!campaign) {
                res.status(404).json({
                    success: false,
                    code: 'fetch-campaign-e2',
                    message: 'Campaign not found',
                });
                return;
            }
            
            res.status(200).json({
                success: true,
                message: 'Campaign retrieved successfully',
                data: campaign
            });
            return;
        }
        
        // For multiple campaigns, build query filters
        const filter: any = {};
        const { creatorUid, search, minGoal, maxGoal } = req.query;
        
        // Filter by creator if specified
        if (creatorUid) {
            filter.creatorUid = creatorUid;
        }
        
        // Filter by goal amount range if specified
        if (minGoal && !isNaN(Number(minGoal))) {
            filter.goalAmount = { $gte: Number(minGoal) };
        }
        
        if (maxGoal && !isNaN(Number(maxGoal))) {
            if (filter.goalAmount) {
                filter.goalAmount.$lte = Number(maxGoal);
            } else {
                filter.goalAmount = { $lte: Number(maxGoal) };
            }
        }
        
        // Search in name or description if search term is provided
        if (search && typeof search === 'string') {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } }, // case-insensitive search
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Pagination parameters
        const page = Math.max(1, Number(req.query.page) || 1); // Default to page 1
        const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10)); // Default 10, max 50
        const skip = (page - 1) * limit;
        
        // Sorting options
        let sortOption: any = { createdAt: -1 }; // Default sort by newest
        const { sort } = req.query;
        
        if (sort) {
            switch (sort) {
                case 'newest':
                    sortOption = { createdAt: -1 };
                    break;
                case 'oldest':
                    sortOption = { createdAt: 1 };
                    break;
                case 'goal-high':
                    sortOption = { goalAmount: -1 };
                    break;
                case 'goal-low':
                    sortOption = { goalAmount: 1 };
                    break;
                case 'progress':
                    break;
            }
        }
        
        // Execute query with pagination
        let campaigns = await DonationCampaign.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);
        
        // Get total count for pagination
        const total = await DonationCampaign.countDocuments(filter);
        
        // Special case for progress sorting - need to sort in memory
        if (sort === 'progress') {
            campaigns = campaigns.sort((a, b) => {
                const progressA = a.goalAmount > 0 ? (a.collectedAmount / a.goalAmount) : 0;
                const progressB = b.goalAmount > 0 ? (b.collectedAmount / b.goalAmount) : 0;
                return progressB - progressA; // Descending order
            });
        }
        
        // Calculate progress percentage for each campaign
        const campaignsWithProgress = campaigns.map(campaign => {
            const {
                _id,
                name,
                description,
                creatorUid,
                goalAmount,
                collectedAmount,
                image,
                createdAt,
                updatedAt
            } = campaign;
            
            const progress = goalAmount > 0 ? (collectedAmount / goalAmount) * 100 : 0;
            
            return {
                id: String(_id),
                name,
                description,
                creatorUid,
                goalAmount,
                collectedAmount,
                progress: Math.min(100, Math.round(progress * 100) / 100), // Round to 2 decimal places, cap at 100%
                image,
                createdAt,
                updatedAt
            };
        });
        
        // Return campaigns with pagination info
        res.status(200).json({
            success: true,
            message: 'Campaigns retrieved successfully',
            data: {
                campaigns: campaignsWithProgress,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Fetch campaign error:', error);
        res.status(500).json({
            success: false,
            code: 'fetch-campaign-e3',
            message: 'Server error fetching campaigns',
        });
    }
};

export default fetchCampaign;