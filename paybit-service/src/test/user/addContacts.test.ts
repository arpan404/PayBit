import { Request, Response } from "express";
import mongoose from "mongoose";
import { addContact } from "../../controllers/user/addContacts";
import User from "../../db/user";
import Contact from "../../db/contact";

// Mock the database models
jest.mock("../../db/user");
jest.mock("../../db/contact");

describe("User Controller - Add Contact", () => {
  // Test variables
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup request and response objects
    req = {
      user: { id: "user123" },
      body: { contactUid: "contact456" },
    };

    res = {
      status: jest.fn(() => res as Response),
      json: jest.fn(),
    };
  });

  it("should return 401 when user is not authenticated", async () => {
    // Setup
    req.user = undefined;

    // Execute
    await addContact(req as Request, res as Response);

    // Verify
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      code: "add-contact-e1",
      message: "User not authenticated",
    });
  });

  it("should return 400 when contactUid is missing", async () => {
    // Setup
    req.body = {};

    // Execute
    await addContact(req as Request, res as Response);

    // Verify
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      code: "add-contact-e2",
      message: "Contact UID is required",
    });
  });

  it("should return 404 when contact user is not found", async () => {
    // Setup
    (User.findOne as jest.Mock).mockResolvedValue(null);

    // Execute
    await addContact(req as Request, res as Response);

    // Verify
    expect(User.findOne).toHaveBeenCalledWith({ uid: "contact456" });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      code: "add-contact-e3",
      message: "User with the provided UID not found",
    });
  });

  it("should return 400 when trying to add self as contact", async () => {
    // Setup
    const contactUser = { _id: "user123", uid: "contact456" };
    const currentUser = { _id: "user123", uid: "contact456" };

    (User.findOne as jest.Mock).mockResolvedValue(contactUser);
    (User.findById as jest.Mock).mockResolvedValue(currentUser);

    // Execute
    await addContact(req as Request, res as Response);

    
    // Verify
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      code: "add-contact-e4",
      message: "You cannot add yourself as a contact",
    });
  });

  it("should return 400 when contact already exists", async () => {
    // Setup
    const contactUser = { uid: "contact456" };
    const currentUser = { uid: "user123" };
    const existingContact = { _id: "existing123" };

    (User.findOne as jest.Mock).mockResolvedValue(contactUser);
    (User.findById as jest.Mock).mockResolvedValue(currentUser);
    (Contact.findOne as jest.Mock).mockResolvedValue(existingContact);

    // Execute
    await addContact(req as Request, res as Response);

    // Verify
    expect(Contact.findOne).toHaveBeenCalledWith({
      userUid: "user123",
      contactUid: "contact456",
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      code: "add-contact-e5",
      message: "This user is already in your contacts",
    });
  });

  it("should successfully add a new contact", async () => {
    // Setup
    const contactUser = {
      uid: "contact456",
      fullname: "Contact Name",
      email: "contact@example.com",
      profileImage: "profile-url",
    };
    const currentUser = { uid: "user123" };
    const newContact = {
      _id: "new123",
      save: jest.fn().mockResolvedValue(undefined),
    };

    (User.findOne as jest.Mock).mockResolvedValue(contactUser);
    (User.findById as jest.Mock).mockResolvedValue(currentUser);
    (Contact.findOne as jest.Mock).mockResolvedValue(null);
    (Contact as unknown as jest.Mock).mockImplementation(() => newContact);

    // Execute
    await addContact(req as Request, res as Response);

    // Verify
    expect(newContact.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Contact added successfully",
      data: {
        contactId: "new123",
        contactUid: "contact456",
        contactName: "Contact Name",
        contactEmail: "contact@example.com",
        contactAvatar: "profile-url",
      },
    });
  });

  it("should handle validation errors", async () => {
    // Setup
    const contactUser = { uid: "contact456" };
    const currentUser = { uid: "user123" };
    const validationError = new mongoose.Error.ValidationError();

    (User.findOne as jest.Mock).mockResolvedValue(contactUser);
    (User.findById as jest.Mock).mockResolvedValue(currentUser);
    (Contact.findOne as jest.Mock).mockResolvedValue(null);
    (Contact as unknown as jest.Mock).mockImplementation(() => {
      throw validationError;
    });

    // Execute
    await addContact(req as Request, res as Response);

    // Verify
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      code: "add-contact-e6",
      message: "Invalid contact data",
      errors: validationError.errors,
    });
  });

  it("should handle server errors", async () => {
    // Setup
    const contactUser = { uid: "contact456" };
    const currentUser = { uid: "user123" };
    const serverError = new Error("Server error");

    (User.findOne as jest.Mock).mockResolvedValue(contactUser);
    (User.findById as jest.Mock).mockResolvedValue(currentUser);
    (Contact.findOne as jest.Mock).mockResolvedValue(null);
    (Contact as unknown as jest.Mock).mockImplementation(() => {
      throw serverError;
    });

    // Mock console.error to prevent test output pollution
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Execute
    await addContact(req as Request, res as Response);

    // Verify
    expect(consoleSpy).toHaveBeenCalledWith("Add contact error:", serverError);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      code: "add-contact-e7",
      message: "Server error adding contact",
    });

    // Cleanup
    consoleSpy.mockRestore();
  });
});
