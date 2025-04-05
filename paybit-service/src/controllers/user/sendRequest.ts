import { Request as ExpressRequest, Response } from 'express';
import mongoose from 'mongoose';
import User from '../../db/user';
import Request from '../../db/requests';

/**
 * Send money request
 * POST /api/user/request
 * Private
 */
export const sendRequest = async (req: ExpressRequest, res: Response): Promise<void> => {
    try {
        // Check auth
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

        // Validate input
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

        // Find recipient
        const recipient = await User.findOne({ email });
        if (!recipient) {
            res.status(404).json({
                success: false,
                code: 'request-e4',
                message: 'Recipient not found',
            });
            return;
        }

        // Prevent self request
        if ((recipient._id as mongoose.Types.ObjectId).toString() === requesterId) {
            res.status(400).json({
                success: false,
                code: 'request-e5',
                message: 'Cannot send request to yourself',
            });
            return;
        }

        // Check if pending request exists
        const existingRequest = await Request.findOne({
            requesterId: new mongoose.Types.ObjectId(requesterId),
            senderId: recipient._id,
            isResolved: false,
        });

        if (existingRequest) {
            res.status(409).json({
                success: false,
                code: 'request-e6',
                message: 'Pending request already exists',
            });
            return;
        }

        // Create request
        const newRequest = new Request({
            requesterId: new mongoose.Types.ObjectId(requesterId),
            amount: parseFloat(amount),
            senderId: recipient._id,
            isResolved: false,
        });

        await newRequest.save();

        // Populate details
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
