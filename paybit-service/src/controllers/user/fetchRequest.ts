import { Request as ExpressRequest, Response } from "express";
import mongoose from "mongoose";
import Request from "../../db/requests";

/**
 * Fetch money requests controller
 * Gets all money requests either sent by or received by the authenticated user
 *
 * @route GET /api/user/requests
 * @query sender=me - To get requests sent by the user
 * @query type=sent/received - Alternative way to specify direction
 * @query resolved=true/false - To filter by resolution status
 * @query page=1 - Page number for pagination
 * @query limit=10 - Number of items per page
 * @access Private
 */
export const fetchRequests = async (
  req: ExpressRequest,
  res: Response,
): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        code: "fetch-request-e1",
        message: "User not authenticated",
      });
      return;
    }

    const userId = req.user.id;
    const { sender, type } = req.query;

    // Determine whether to show sent or received requests
    // Support both legacy 'type' parameter and new 'sender=me' parameter
    let isSenderMe = sender === "me";

    if (type && !sender) {
      if (type === "sent") {
        isSenderMe = true;
      } else if (type === "received") {
        isSenderMe = false;
      } else {
        res.status(400).json({
          success: false,
          code: "fetch-request-e3",
          message: "Invalid query param 'type'. Allowed: sent, received.",
        });
        return;
      }
    } else if (!type && !sender) {
      res.status(400).json({
        success: false,
        code: "fetch-request-e3",
        message:
          "Missing required query param. Use 'sender=me' or 'type=sent/received'.",
      });
      return;
    }

    // Build query based on whether user wants to see sent or received requests
    const query: any = isSenderMe
      ? // Requests where user is the sender
        { senderId: new mongoose.Types.ObjectId(userId) }
      : // Requests where user is the requester (receiver)
        { requesterId: new mongoose.Types.ObjectId(userId) };

    // Optional filter for resolved/unresolved requests
    const { resolved } = req.query;
    if (resolved !== undefined) {
      query.isResolved = resolved === "true";
    }

    // Find requests with pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const requests = await Request.find(query)
      .populate("requesterId", "fullname email uid profileImage")
      .populate("senderId", "fullname email uid profileImage")
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Request.countDocuments(query);

    // Format the response - ensure _id is mapped to id for consistent testing
    const formattedRequests = requests.map((request) => ({
      id: (request._id as mongoose.Types.ObjectId).toString(), // Ensure _id is converted to string for consistent comparison
      amount: request.amount,
      createdAt: (request as any).createdAt,
      updatedAt: (request as any).updatedAt,
      isResolved: request.isResolved,
      requester: request.requesterId,
      sender: request.senderId,
    }));

    res.status(200).json({
      success: true,
      message: isSenderMe
        ? "Sent requests retrieved"
        : "Received requests retrieved",
      data: {
        requests: formattedRequests,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Fetch requests error:", error);
    res.status(500).json({
      success: false,
      code: "fetch-request-e2",
      message: "Server error fetching requests",
    });
  }
};

export default fetchRequests;
