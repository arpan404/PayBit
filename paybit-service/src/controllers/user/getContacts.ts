import { Request, Response } from "express";
import mongoose from "mongoose";
import Contact from "../../db/contact";
import User from "../../db/user";

/**
 * Get Contacts Controller
 * Fetches all contacts for the authenticated user with user details
 *
 * @route GET /api/user/contacts
 * @access Private (requires auth token)
 */
export const getContacts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        code: "contacts-e1",
        message: "User not authenticated",
      });
      return;
    }

    const userId = req.user.id;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        code: "contacts-e2",
        message: "Invalid user ID format",
      });
      return;
    }

    // Fetch contacts
    const contacts = await Contact.find({ userId })
      .sort({ nickname: 1 }) // Sort by nickname alphabetically
      .lean();

    if (!contacts || contacts.length === 0) {
      // No contacts found, return empty array
      res.status(200).json({
        success: true,
        message: "No contacts found",
        data: { contacts: [] },
      });
      return;
    }

    // Extract unique contactUids to fetch user information
    const contactUids = [
      ...new Set(contacts.map((contact) => contact.contactUid)),
    ];

    // Fetch user details for all contacts in a single query
    const contactUsers = await User.find(
      { uid: { $in: contactUids } },
      { _id: 1, uid: 1, fullname: 1, email: 1, profileImage: 1 },
    ).lean();

    // Create a map for efficient lookups
    const userMap = new Map();
    contactUsers.forEach((user) => {
      userMap.set(user.uid, user);
    });

    // Enrich contact data with user information
    const enrichedContacts = contacts.map((contact) => {
      const userInfo = userMap.get(contact.contactUid) || {};

      return {
        id: contact._id,
        contactUid: contact.contactUid,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
        user: {
          id: userInfo._id || null,
          fullname: userInfo.fullname || "Unknown User",
          email: userInfo.email || "unknown@example.com",
          profileImage: userInfo.profileImage || "",
        },
      };
    });

    // Return the enriched contacts
    res.status(200).json({
      success: true,
      message: "Contacts retrieved successfully",
      data: {
        contacts: enrichedContacts,
        count: enrichedContacts.length,
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({
      success: false,
      code: "contacts-e3",
      message: "Server error fetching contacts",
    });
  }
};
