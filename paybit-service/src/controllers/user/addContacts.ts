import { Request, Response } from "express";
import User from "../../db/user";
import Contact from "../../db/contact";
import mongoose from "mongoose";

/**
 * Add Contact Controller
 * Adds a new contact to the authenticated user's contact list
 *
 * @route POST /api/user/contacts
 * @body contactUid - UID of the user to add as contact
 * @access Private (requires auth token)
 */
export const addContact = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        code: "add-contact-e1",
        message: "User not authenticated",
        
      });
      return;
    }

    const userId = req.user.id;
    const { contactUid } = req.body;

    // Validate input
    if (!contactUid) {
      res.status(400).json({
        success: false,
        code: "add-contact-e2",
        message: "Contact UID is required",
      });
      return;
    }

    // Verify that contact user exists
    const contactUser = await User.findOne({ uid: contactUid });
    if (!contactUser) {
      res.status(404).json({
        success: false,
        code: "add-contact-e3",
        message: "User with the provided UID not found",
      });
      return;
    }

    // Don't allow adding yourself as a contact
    const currentUser = await User.findById(userId);
    if (currentUser?.uid === contactUid) {
      res.status(400).json({
        success: false,
        code: "add-contact-e4",
        message: "You cannot add yourself as a contact",
      });
      return;
    }

    // Check if contact already exists
    const existingContact = await Contact.findOne({
      userUid: currentUser?.uid,
      contactUid,
    });

    if (existingContact) {
      res.status(400).json({
        success: false,
        code: "add-contact-e5",
        message: "This user is already in your contacts",
      });
      return;
    }

    // Create new contact
    const newContact = new Contact({
      userUid: currentUser?.uid,
      contactUid,
    });

    await newContact.save();

    // Return success with contact info
    res.status(201).json({
      success: true,
      message: "Contact added successfully",
      data: {
        contactId: newContact._id,
        contactUid: contactUser.uid,
        contactName: contactUser.fullname || contactUser.email,
        contactEmail: contactUser.email,
        contactAvatar: contactUser.profileImage || null,
      },
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        success: false,
        code: "add-contact-e6",
        message: "Invalid contact data",
        errors: error.errors,
      });
      return;
    }

    console.error("Add contact error:", error);
    res.status(500).json({
      success: false,
      code: "add-contact-e7",
      message: "Server error adding contact",
    });
  }
};
