import { Request, Response } from "express";
import mongoose from "mongoose";
import Transaction from "../../db/transaction";
import User from "../../db/user";

/**
 * Transaction History Controller
 * Retrieves transaction history for the authenticated user with filtering and pagination
 *
 * @route GET /api/transaction/history
 * @query type - Filter by transaction type (payment, donation, refund, etc.)
 * @query status - Filter by transaction status (pending, completed, failed, reversed)
 * @query direction - Filter by direction (sent, received, all)
 * @query startDate - Filter transactions after this date (ISO format)
 * @query endDate - Filter transactions before this date (ISO format)
 * @query minAmount - Filter by minimum amount
 * @query maxAmount - Filter by maximum amount
 * @query sort - Sort by: 'newest', 'oldest', 'amount-high', 'amount-low'
 * @query page - Page number for pagination (default: 1)
 * @query limit - Number of items per page (default: 10, max: 50)
 * @access Private (requires auth token)
 */
export const getTransactionHistory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        code: "tx-history-e1",
        message: "User not authenticated",
      });
      return;
    }

    const userId = req.user.id;

    // Validate user exists
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        code: "tx-history-e2",
        message: "Invalid user ID format",
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        code: "tx-history-e3",
        message: "User not found",
      });
      return;
    }

    // Build query filters
    const filter: any = {};
    const {
      type,
      status,
      direction,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
    } = req.query;

    // Security: Only allow users to see their own transactions
    if (direction === "sent") {
      filter.fromUserId = userId;
    } else if (direction === "received") {
      filter.toUserId = userId;
    } else {
      // Default: show all transactions user is involved in
      filter.$or = [{ fromUserId: userId }, { toUserId: userId }];
    }

    // Filter by transaction type if specified
    if (
      type &&
      typeof type === "string" &&
      [
        "payment",
        "donation",
        "refund",
        "transfer",
        "withdrawal",
        "deposit",
      ].includes(type)
    ) {
      filter.type = type;
    }

    // Filter by status if specified
    if (
      status &&
      typeof status === "string" &&
      ["pending", "completed", "failed", "reversed"].includes(status)
    ) {
      filter.status = status;
    }

    // Filter by date range
    if (startDate && isValidDate(startDate as string)) {
      const start = new Date(startDate as string);
      if (!filter.createdAt) filter.createdAt = {};
      filter.createdAt.$gte = start;
    }

    if (endDate && isValidDate(endDate as string)) {
      const end = new Date(endDate as string);
      // Set time to end of day
      end.setHours(23, 59, 59, 999);
      if (!filter.createdAt) filter.createdAt = {};
      filter.createdAt.$lte = end;
    }

    // Filter by amount range
    if (minAmount && !isNaN(Number(minAmount))) {
      filter.amount = { $gte: Number(minAmount) };
    }

    if (maxAmount && !isNaN(Number(maxAmount))) {
      if (filter.amount) {
        filter.amount.$lte = Number(maxAmount);
      } else {
        filter.amount = { $lte: Number(maxAmount) };
      }
    }

    // Search in names or description if search term is provided
    if (search && typeof search === "string") {
      const searchRegex = { $regex: search as string, $options: "i" };
      filter.$or = [
        { senderName: searchRegex },
        { receiverName: searchRegex },
        { description: searchRegex },
        { reference: searchRegex },
      ];

      // If we already have an $or filter for user IDs, we need to use $and to combine them
      if (filter.$or) {
        const directionFilter = filter.$or;
        delete filter.$or;
        filter.$and = [
          { $or: directionFilter },
          {
            $or: [
              { senderName: searchRegex },
              { receiverName: searchRegex },
              { description: searchRegex },
              { reference: searchRegex },
            ],
          },
        ];
      }
    }

    // Pagination parameters - with validation
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Sorting options
    let sortOption: any = { createdAt: -1 }; // Default: newest first
    const { sort } = req.query;

    if (sort) {
      switch (sort) {
        case "oldest":
          sortOption = { createdAt: 1 };
          break;
        case "amount-high":
          sortOption = { amount: -1 };
          break;
        case "amount-low":
          sortOption = { amount: 1 };
          break;
        default:
          sortOption = { createdAt: -1 }; // Default: newest first
      }
    }

    // Execute query with pagination
    const transactions = await Transaction.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Transaction.countDocuments(filter);

    // Process transactions to add user-friendly direction and to hide sensitive info
    const processedTransactions = transactions.map((tx) => {
      const isSender = tx.fromUserId.toString() === userId;

      return {
        id: tx._id,
        date: tx.createdAt,
        direction: isSender ? "sent" : "received",
        counterpartyName: isSender ? tx.receiverName : tx.senderName,
        counterpartyId: isSender ? tx.toUserId : tx.fromUserId,
        amount: tx.amount,
        status: tx.status,
        type: tx.type,
        description: tx.description,
        reference: tx.reference,
        // Only include campaign info if this is a donation
        ...(tx.type === "donation" && tx.campaignId
          ? { campaignId: tx.campaignId }
          : {}),
      };
    });

    // Return transactions with pagination info
    res.status(200).json({
      success: true,
      message: "Transaction history retrieved successfully",
      data: {
        transactions: processedTransactions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Transaction history error:", error);
    res.status(500).json({
      success: false,
      code: "tx-history-e4",
      message: "Server error retrieving transaction history",
    });
  }
};

/**
 * Get Transaction Details Controller
 * Retrieves detailed information about a specific transaction
 *
 * @route GET /api/transaction/history/:id
 * @access Private (requires auth token)
 */
export const getTransactionDetails = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        code: "tx-details-e1",
        message: "User not authenticated",
      });
      return;
    }

    const userId = req.user.id;
    const transactionId = req.params.id;

    // Validate transaction ID format
    if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
      res.status(400).json({
        success: false,
        code: "tx-details-e2",
        message: "Invalid transaction ID format",
      });
      return;
    }

    // Find the transaction
    const transaction = await Transaction.findById(transactionId);

    // Check if transaction exists
    if (!transaction) {
      res.status(404).json({
        success: false,
        code: "tx-details-e3",
        message: "Transaction not found",
      });
      return;
    }

    // Security: Check if the user is authorized to view this transaction
    const isAuthorized =
      transaction.fromUserId.toString() === userId ||
      transaction.toUserId.toString() === userId;

    if (!isAuthorized) {
      res.status(403).json({
        success: false,
        code: "tx-details-e4",
        message: "Not authorized to view this transaction",
      });
      return;
    }

    // Determine direction from user's perspective
    const isSender = transaction.fromUserId.toString() === userId;

    // Format transaction details for response
    const transactionDetails = {
      id: transaction._id,
      date: transaction.createdAt,
      lastUpdated: transaction.updatedAt,
      direction: isSender ? "sent" : "received",
      amount: transaction.amount,
      status: transaction.status,
      type: transaction.type,
      description: transaction.description,
      reference: transaction.reference,

      // Sender and receiver info
      sender: {
        id: transaction.fromUserId,
        name: transaction.senderName,
      },
      receiver: {
        id: transaction.toUserId,
        name: transaction.receiverName,
      },

      // Campaign info if applicable
      ...(transaction.campaignId ? { campaignId: transaction.campaignId } : {}),
    };

    res.status(200).json({
      success: true,
      message: "Transaction details retrieved successfully",
      data: transactionDetails,
    });
  } catch (error) {
    console.error("Transaction details error:", error);
    res.status(500).json({
      success: false,
      code: "tx-details-e5",
      message: "Server error retrieving transaction details",
    });
  }
};

// Helper function to validate date string
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export default {
  getTransactionHistory,
  getTransactionDetails,
};
