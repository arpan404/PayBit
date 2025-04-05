import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import app from "../../app";
import User from "../../db/user";
import Contact from "../../db/contact";

// Test users
const testUser = {
  fullname: "Contact Owner",
  email: "contact.owner@example.com",
  password: "SecurePass123!",
  uid: uuidv4(),
};

// Contact users
const contactUsers = [
  {
    fullname: "John Contact",
    email: "john.contact@example.com",
    password: "Contact123!",
    uid: uuidv4(),
    profileImage: "https://example.com/john.jpg",
  },
  {
    fullname: "Jane Friend",
    email: "jane.friend@example.com",
    password: "Friend123!",
    uid: uuidv4(),
    profileImage: "",
  },
  {
    fullname: "Bob Colleague",
    email: "bob.colleague@example.com",
    password: "Colleague123!",
    uid: uuidv4(),
    profileImage: "https://example.com/bob.jpg",
  },
];

// Global variables
let authToken: string;
let userId: string;
let userUid: string;
let contactUserIds: string[] = [];

describe("Get Contacts Controller", () => {
  // Setup before all tests
  beforeAll(async () => {
    // Clear existing test data
    await User.deleteMany({
      email: {
        $in: [testUser.email, ...contactUsers.map((user) => user.email)],
      },
    });
    await Contact.deleteMany({});

    // Create salt for password hashing
    const salt = await bcrypt.genSalt(10);

    // Create main test user
    const hashedPassword = await bcrypt.hash(testUser.password, salt);
    const createdUser = await User.create({
      fullname: testUser.fullname,
      email: testUser.email,
      password: hashedPassword,
      uid: testUser.uid,
      profileImage: "",
    });
    userId = String(createdUser._id);
    userUid = testUser.uid; // Store the user UID

    // Create contact users
    for (const contactUser of contactUsers) {
      const hashedContactPassword = await bcrypt.hash(
        contactUser.password,
        salt,
      );
      const createdContactUser = await User.create({
        fullname: contactUser.fullname,
        email: contactUser.email,
        password: hashedContactPassword,
        uid: contactUser.uid,
        profileImage: contactUser.profileImage,
      });
      contactUserIds.push(String(createdContactUser._id));
    }

    // Create contacts in the database
    await Contact.create({
      userId: userId,
      userUid: userUid, // Add the required userUid field
      contactUid: contactUsers[0].uid,
      nickname: "Johnny", // Add nickname if required
      notes: "Work colleague", // Add notes if required
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
    });

    await Contact.create({
      userId: userId,
      userUid: userUid, // Add the required userUid field
      contactUid: contactUsers[1].uid,
      nickname: "Janey", // Add nickname if required
      notes: "Old friend", // Add notes if required
      createdAt: new Date("2023-02-01"),
      updatedAt: new Date("2023-02-01"),
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret";
    authToken = jwt.sign(
      {
        user: {
          id: userId,
          uid: userUid,
          email: testUser.email,
        },
      },
      jwtSecret,
      { expiresIn: "1h" },
    );
  });

  // Clean up after all tests
  afterAll(async () => {
    await User.deleteMany({
      email: {
        $in: [testUser.email, ...contactUsers.map((user) => user.email)],
      },
    });
    await Contact.deleteMany({});
  });

  // Tests
  it("should return all contacts for authenticated user", async () => {
    const response = await request(app)
      .get("/api/user/contacts")
      .set("x-auth-token", authToken)
      .expect(200);

    // Check response structure
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty(
      "message",
      "Contacts retrieved successfully",
    );
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("contacts");
    expect(response.body.data).toHaveProperty("count", 2);

    // Check contacts data
    const { contacts } = response.body.data;
    expect(contacts).toHaveLength(2);

    // Check first contact
    expect(contacts[0]).toHaveProperty("id");
    expect(contacts[0]).toHaveProperty("contactUid");
    expect(contacts[0]).toHaveProperty("nickname");
    expect(contacts[0]).toHaveProperty("notes");
    expect(contacts[0]).toHaveProperty("createdAt");
    expect(contacts[0]).toHaveProperty("updatedAt");
    expect(contacts[0]).toHaveProperty("user");

    // Check user information in contact
    expect(contacts[0].user).toHaveProperty("id");
    expect(contacts[0].user).toHaveProperty("fullname");
    expect(contacts[0].user).toHaveProperty("email");
    expect(contacts[0].user).toHaveProperty("profileImage");

    // Verify user info is correct
    const johnContact = contacts.find(
      (contact: { contactUid: string }) =>
        contact.contactUid === contactUsers[0].uid,
    );
    expect(johnContact).toBeTruthy();
    expect(johnContact.user.fullname).toBe(contactUsers[0].fullname);
    expect(johnContact.user.email).toBe(contactUsers[0].email);
    expect(johnContact.user.profileImage).toBe(contactUsers[0].profileImage);
    expect(johnContact.nickname).toBe("Johnny");

    const janeContact = contacts.find(
      (contact: { contactUid: string }) =>
        contact.contactUid === contactUsers[1].uid,
    );
    expect(janeContact).toBeTruthy();
    expect(janeContact.user.fullname).toBe(contactUsers[1].fullname);
    expect(janeContact.user.email).toBe(contactUsers[1].email);
    expect(janeContact.user.profileImage).toBe("");
    expect(janeContact.nickname).toBe("Janey");
  });

  it("should return empty array when user has no contacts", async () => {
    // Create a new user with no contacts
    const newUser = {
      fullname: "No Contacts User",
      email: "no.contacts@example.com",
      password: "NoContacts123!",
      uid: uuidv4(),
    };

    // Create user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newUser.password, salt);
    const createdUser = await User.create({
      fullname: newUser.fullname,
      email: newUser.email,
      password: hashedPassword,
      uid: newUser.uid,
      profileImage: "",
    });

    // Generate token for new user
    const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret";
    const noContactsToken = jwt.sign(
      {
        user: {
          id: String(createdUser._id),
          uid: newUser.uid,
          email: newUser.email,
        },
      },
      jwtSecret,
      { expiresIn: "1h" },
    );

    // Test endpoint
    const response = await request(app)
      .get("/api/user/contacts")
      .set("x-auth-token", noContactsToken)
      .expect(200);

    // Check response
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("message", "No contacts found");
    expect(response.body.data).toHaveProperty("contacts");
    expect(response.body.data.contacts).toHaveLength(0);

    // Clean up
    await User.deleteOne({ email: newUser.email });
  });

  it("should handle missing contact user information gracefully", async () => {
    // Create a contact with a UID that doesn't exist in User collection
    const nonExistentUid = uuidv4();
    await Contact.create({
      userId: userId,
      userUid: userUid, // Add the required userUid field
      contactUid: nonExistentUid,
      nickname: "Missing User",
      notes: "This user does not exist",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app)
      .get("/api/user/contacts")
      .set("x-auth-token", authToken)
      .expect(200);

    // Should now have 3 contacts
    expect(response.body.data.contacts).toHaveLength(3);

    // Find the contact with non-existent user
    const nonExistentContact = response.body.data.contacts.find(
      (contact: any) => contact.contactUid === nonExistentUid,
    );

    // Verify fallback values are used
    expect(nonExistentContact).toBeTruthy();
    expect(nonExistentContact.nickname).toBe("Missing User");
    expect(nonExistentContact.notes).toBe("This user does not exist");
    expect(nonExistentContact.user.fullname).toBe("Unknown User");
    expect(nonExistentContact.user.email).toBe("unknown@example.com");
    expect(nonExistentContact.user.profileImage).toBe("");
    expect(nonExistentContact.user.id).toBeNull();

    // Clean up
    await Contact.deleteOne({ contactUid: nonExistentUid });
  });

  it("should reject unauthenticated requests", async () => {
    await request(app).get("/api/user/contacts").expect(401);
  });

  it("should reject requests with invalid auth token", async () => {
    await request(app)
      .get("/api/user/contacts")
      .set("x-auth-token", "invalid-token")
      .expect(401);
  });

  it("should reject requests with malformed user ID", async () => {
    // Generate token with invalid user ID
    const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret";
    const invalidIdToken = jwt.sign(
      {
        user: {
          id: "invalid-id",
          uid: uuidv4(),
          email: "invalid@example.com",
        },
      },
      jwtSecret,
      { expiresIn: "1h" },
    );

    const response = await request(app)
      .get("/api/user/contacts")
      .set("x-auth-token", invalidIdToken)
      .expect(400);

    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("code", "contacts-e2");
    expect(response.body.message).toContain("Invalid user ID format");
  });

  it("should handle server errors gracefully", async () => {
    // Mock a database error by temporarily breaking the find method
    const originalFind = Contact.find;
    Contact.find = jest.fn().mockImplementation(() => {
      throw new Error("Database connection error");
    });

    await request(app)
      .get("/api/user/contacts")
      .set("x-auth-token", authToken)
      .expect(500)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "contacts-e3");
        expect(res.body.message).toContain("Server error");
      });

    // Restore original function
    Contact.find = originalFind;
  });

  it("should return contacts with correct data types", async () => {
    const response = await request(app)
      .get("/api/user/contacts")
      .set("x-auth-token", authToken)
      .expect(200);

    const contact = response.body.data.contacts[0];

    // Check data types
    expect(typeof contact.id).toBe("string");
    expect(typeof contact.contactUid).toBe("string");
    expect(typeof contact.nickname).toBe("string");
    expect(new Date(contact.createdAt)).toBeInstanceOf(Date);
    expect(new Date(contact.updatedAt)).toBeInstanceOf(Date);
    expect(typeof contact.user.fullname).toBe("string");
    expect(typeof contact.user.email).toBe("string");
  });

  it("should maintain data consistency after multiple queries", async () => {
    // First query
    const firstResponse = await request(app)
      .get("/api/user/contacts")
      .set("x-auth-token", authToken)
      .expect(200);

    // Create a new contact
    const newContactUid = contactUsers[2].uid;
    await Contact.create({
      userId: userId,
      userUid: userUid, // Add the required userUid field
      contactUid: newContactUid,
      nickname: "Bobby",
      notes: "New colleague",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Second query
    const secondResponse = await request(app)
      .get("/api/user/contacts")
      .set("x-auth-token", authToken)
      .expect(200);

    // Check that first two contacts are the same
    expect(secondResponse.body.data.contacts).toHaveLength(
      firstResponse.body.data.contacts.length + 1,
    );

    // Verify the new contact was added correctly
    const newContact = secondResponse.body.data.contacts.find(
      (contact: any) => contact.contactUid === newContactUid,
    );

    expect(newContact).toBeTruthy();
    expect(newContact.nickname).toBe("Bobby");
    expect(newContact.notes).toBe("New colleague");
    expect(newContact.user.fullname).toBe(contactUsers[2].fullname);
    expect(newContact.user.email).toBe(contactUsers[2].email);

    // Clean up
    await Contact.deleteOne({ contactUid: newContactUid });
  });
});
