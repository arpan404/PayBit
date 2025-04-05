import { Request as ExpressRequest, Response } from 'express';
import mongoose from 'mongoose';
import User from '../../db/user';
import Request from '../../db/requests';

/**
 * Send money request controller
 * Creates a new request for money from one user to another
 * 
 * @route POST /api/user/request
 * @access Private
 */
export const sendRequest = async (req: ExpressRequest, res: Response): Promise<void> => {
    try {
        // Ensure user is authenticated
        if (!req.user || !req.user.id) {
            res.status(401).json({
                success: false,
                code: 'request-e1',
                message: 'User not authenticated',
            });
            return;
        }

        const requesterId = req.user.id;
        const { email, amount } = req.body;

        // Validate required fields
        if (!email) {
            res.status(400).json({
                success: false,
                code: 'request-e2',
                message: 'Recipient email is required',
            });
            return;
        }

        if (!amount || isNaN(amount) || amount <= 0) {
            res.status(400).json({
                success: false,
                code: 'request-e3',
                message: 'Valid amount is required',
            });
            return;
        }

        // Find the recipient user by email
        const recipient = await User.findOne({ email });
        if (!recipient) {
            res.status(404).json({
                success: false,
                code: 'request-e4',
                message: 'Recipient not found',
            });
            return;
        }

        // Prevent sending request to self
        if ((recipient._id as mongoose.Types.ObjectId).toString() === requesterId) {
            res.status(400).json({
                success: false,
                code: 'request-e5',
                message: 'Cannot send request to yourself',
            });
            return;
        }

        // Check if there's already a pending request to this recipient
        const existingRequest = await Request.findOne({
            requesterId: new mongoose.Types.ObjectId(requesterId),
            senderId: recipient._id,
            isResolved: false,
        });

        if (existingRequest) {
            res.status(409).json({
                success: false,
                code: 'request-e6',
                message: 'You already have a pending request to this user',
            });
            return;
        }

        // Create the new request
        const newRequest = new Request({
            requesterId: new mongoose.Types.ObjectId(requesterId),
            amount: parseFloat(amount),
            senderId: recipient._id,
            isResolved: false,
        });

        await newRequest.save();

        // Populate requester and sender details for the response
        const populatedRequest = await Request.findById(newRequest._id)
            .populate('requesterId', 'fullname email uid profileImage')
            .populate('senderId', 'fullname email uid profileImage');

        res.status(201).json({
            success: true,
            message: 'Money request sent successfully',
            data: {
                request: {
                    id: populatedRequest?._id,
                    amount: populatedRequest?.amount,
                    createdAt: (populatedRequest as any)?.createdAt,
                    isResolved: populatedRequest?.isResolved,
                    requester: populatedRequest?.requesterId,
                    sender: populatedRequest?.senderId,
                }
            }
        });
    } catch (error) {
        console.error('Send request error:', error);
        res.status(500).json({
            success: false,
            code: 'request-e7',
            message: 'Server error sending request',
        });
    }
};

export default sendRequest;