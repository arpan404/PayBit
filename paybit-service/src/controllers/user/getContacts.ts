import { Request, Response } from "express";
import mongoose from "mongoose";
import Contact from "../../db/contact";
import User from "../../db/user";

/**
 * Get all contacts for the authenticated user
 * @route GET /api/user/contacts
 * @access Private
 */
export const getContacts = async (req: Request, res: Response) => {
  try {
    // Get user ID from the auth middleware
    const userId = req.user.id;
    const userUid = req.user.uid;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        code: "contacts-e2",
        message: "Invalid user ID format",
      });
    }

    // Find all contacts for this user
    const contacts = await Contact.find({ userUid });

    // If no contacts found, return empty array
    if (contacts.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No contacts found",
        data: {
          contacts: [],
          count: 0,
        },
      });
    }

    // Extract contact UIDs
    const contactUids = contacts.map((contact) => contact.contactUid);

    // Get user details for all contacts in a single query
    const contactUsers = await User.find(
      { uid: { $in: contactUids } },
      { password: 0 } // Exclude password field
    );

    // Create a map of user info by UID for quick lookup
    const userMap = new Map();
    contactUsers.forEach((user) => {
      userMap.set(user.uid, {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        profileImage: user.profileImage,
      });
    });

    // Format the contact list with user details
    const formattedContacts = contacts.map((contact) => {
      // Get user info from map or use default "unknown" values
      const userInfo = userMap.get(contact.contactUid) || {
        id: null,
        fullname: "Unknown User",
        email: "unknown@example.com",
        profileImage: "",
      };

      return {
        id: String(contact._id),
        contactUid: contact.contactUid,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
        user: {
          id: userInfo.id,
          fullname: userInfo.fullname,
          email: userInfo.email,
          profileImage: userInfo.profileImage,
        },
      };
    });

    // Return success response with formatted contacts
    return res.status(200).json({
      success: true,
      message: "Contacts retrieved successfully",
      data: {
        contacts: formattedContacts,
        count: formattedContacts.length,
      },
    });
  } catch (error) {
    console.error("Error in getContacts:", error);
    return res.status(500).json({
      success: false,
      code: "contacts-e3",
      message: "Server error while retrieving contacts",
    });
  }
};

export default getContacts;