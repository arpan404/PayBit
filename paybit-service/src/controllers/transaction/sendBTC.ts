import { Request, Response } from "express";
import User from "../../db/user";
import transferFunds from "../../services/transferFunds";
import Transaction from "../../db/transaction";

/**
 * Send BTC Controller
 * Allows a user to send BTC to another user
 *
 * @route POST /api/transaction/send-btc
 * @access Private (requires auth token)
 */
export const sendBTC = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        code: "send-e1",
        message: "User not authenticated",
      });
      return;
    }

    // Get recipient and amount from request body
    const { recipientMail, recipientUID, amount, note } = req.body;
    console.log("Recipient Mail:", recipientMail);
    console.log("Recipient UID:", recipientUID);
    console.log("Amount:", amount);
    console.log("Note:", note);
    // Validate required fields
    if (!recipientMail && !recipientUID) {
      res.status(400).json({
        success: false,
        code: "send-e2",
        message: "Recipient Mail or recipient UID is required",
      });
      return;
    }
    let recipientId: string | null = recipientUID || null;
    if (recipientMail) {
      const user = await User.findOne({ email: recipientMail });
      if (user) {
        recipientId = String(user._id);
      }
      else {
        res.status(400).json({
          success: false,
          code: "send-e2",
          message: "Recipient not found",
        });
        return;
      }
    }

    // Validate amount
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      res.status(400).json({
        success: false,
        code: "send-e3",
        message: "Valid amount greater than 0 is required",
      });
      return;
    }

    const transferAmount = Number(amount);

    // Add minimum amount validation
    if (transferAmount <= 0) { // Example minimum amount
      res.status(400).json({
        success: false,
        code: "send-e4",
        message: "Minimum transfer amount is 0.00001 BTC",
      });
      return;
    }

    // Get the sender
    const sender = await User.findById(req.user.id);
    if (!sender) {
      res.status(404).json({
        success: false,
        code: "send-e5",
        message: "Sender not found",
      });
      return;
    }

    // Find the recipient
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      res.status(404).json({
        success: false,
        code: "send-e6",
        message: "Recipient not found",
      });
      return;
    }

    // Prevent sending to self
    if (String(sender._id) === String(recipient._id)) {
      res.status(400).json({
        success: false,
        code: "send-e7",
        message: "You cannot send BTC to yourself",
      });
      return;
    }

    // Process the transfer
    try {
      await transferFunds(
        String(sender._id),
        String(recipient._id),
        transferAmount,
        recipient.fullname,
        "transfer",
      );
    } catch (transferError: any) {
      res.status(400).json({
        success: false,
        code: "send-e8",
        message: "Failed to process transfer",
        details: transferError.message,
      });
      return;
    }

    // Record the transaction
    await Transaction.create({
      toUserId: recipient._id,
      fromUserId: sender._id,
      senderName: sender.fullname,
      amount: transferAmount,
      receiverName: recipient.fullname,
      type: "transfer",
      status: "completed",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Return successful response
    res.status(200).json({
      success: true,
      message: "BTC sent successfully",
      data: {
        senderId: sender._id,
        senderName: sender.fullname,
        recipientId: recipient._id,
        recipientName: recipient.fullname,
        amount: transferAmount,
        note: note || "BTC Transfer",
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("BTC send error:", error);
    res.status(500).json({
      success: false,
      code: "send-e9",
      message: "Server error processing BTC transfer",
    });
  }
};

export default sendBTC;
