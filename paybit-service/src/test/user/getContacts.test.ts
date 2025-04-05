import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import app from "../../app";
import User from "../../db/user";
import Contact from "../../db/contact";

// Test data
const testUser = {
  fullname: "Test User",
  email: "test.user@example.com",
  password: "Password123!",
  uid: "test-user-uid",
};

const contactUsers = [
  {
    fullname: "Contact One",
    email: "contact.one@example.com",
    password: "Contact123!",
    uid: "contact-uid-1",
    profileImage: "https://example.com/profile1.jpg",
  },
  {
    fullname: "Contact Two",
    email: "contact.two@example.com",
    password: "Contact123!",
    uid: "contact-uid-2",
    profileImage: "",
  },
];

// Global variables for use in tests
let authToken: string;
let userId: string;

describe("getContacts Controller", () => {
  // Setup before all tests
  beforeAll(async () => {
    // Clear existing data
    await User.deleteMany({});
    await Contact.deleteMany({});

    // Create test user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testUser.password, salt);

    const createdUser = await User.create({
      fullname: testUser.fullname,
      email: testUser.email,
      password: hashedPassword,
      uid: testUser.uid,
      profileImage: "",
    });

    userId = String(createdUser._id);

    // Create contact users
    for (const contactUser of contactUsers) {
      const hashedContactPassword = await bcrypt.hash(
        contactUser.password,
        salt,
      );
      await User.create({
        fullname: contactUser.fullname,
        email: contactUser.email,
        password: hashedContactPassword,
        uid: contactUser.uid,
        profileImage: contactUser.profileImage,
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || "test-secret";
    authToken = jwt.sign(
      {
        user: {
          id: userId,
          uid: testUser.uid,
          email: testUser.email,
        },
      },
      jwtSecret,
      { expiresIn: "1h" },
    );
  });

  // Clean up after all tests
  afterAll(async () => {
    await User.deleteMany({});
    await Contact.deleteMany({});
    await mongoose.connection.close();
  });

  // Clear contacts between tests
  afterEach(async () => {
    await Contact.deleteMany({});
  });

  it("should return empty array when user has no contacts", async () => {
    const response = await request(app)
      .get("/api/user/contacts")
      .set("x-auth-token", authToken)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("No contacts found");
    expect(response.body.data.contacts).toEqual([]);
    expect(response.body.data.count).toBe(0);
  });

  it("should return all contacts for the authenticated user", async () => {
    // Create contacts
    await Contact.create([
      {
        userUid: testUser.uid,
        contactUid: contactUsers[0].uid,
      },
      {
        userUid: testUser.uid,
        contactUid: contactUsers[1].uid,
      },
    ]);

    const response = await request(app)
      .get("/api/user/contacts")
      .set("x-auth-token", authToken)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Contacts retrieved successfully");
    expect(response.body.data.contacts).toHaveLength(2);
    expect(response.body.data.count).toBe(2);

    // Verify contact data structure and content
    const contact = response.body.data.contacts[0];
    expect(contact).toHaveProperty("id");
    expect(contact).toHaveProperty("contactUid");
    expect(contact).toHaveProperty("createdAt");
    expect(contact).toHaveProperty("updatedAt");
    expect(contact).toHaveProperty("user");
    expect(contact.user).toHaveProperty("id");
    expect(contact.user).toHaveProperty("fullname");
    expect(contact.user).toHaveProperty("email");
    expect(contact.user).toHaveProperty("profileImage");

    // Verify that user data is correctly associated with contacts
    const contactOne = response.body.data.contacts.find(
      (c: any) => c.contactUid === contactUsers[0].uid,
    );
    expect(contactOne.user.fullname).toBe(contactUsers[0].fullname);
    expect(contactOne.user.email).toBe(contactUsers[0].email);
    expect(contactOne.user.profileImage).toBe(contactUsers[0].profileImage);

    const contactTwo = response.body.data.contacts.find(
      (c: any) => c.contactUid === contactUsers[1].uid,
    );
    expect(contactTwo.user.fullname).toBe(contactUsers[1].fullname);
    expect(contactTwo.user.email).toBe(contactUsers[1].email);
    expect(contactTwo.user.profileImage).toBe(contactUsers[1].profileImage);
  });

  it("should handle non-existent contact UIDs gracefully", async () => {
    // Create a contact with a non-existent user UID
    const nonExistentUid = "non-existent-uid";
    await Contact.create({
      userUid: testUser.uid,
      contactUid: nonExistentUid,
    });

    const response = await request(app)
      .get("/api/user/contacts")
      .set("x-auth-token", authToken)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.contacts).toHaveLength(1);

    // Verify default values for non-existent user
    const nonExistentContact = response.body.data.contacts[0];
    expect(nonExistentContact.contactUid).toBe(nonExistentUid);
    expect(nonExistentContact.user.id).toBeNull();
    expect(nonExistentContact.user.fullname).toBe("Unknown User");
    expect(nonExistentContact.user.email).toBe("unknown@example.com");
    expect(nonExistentContact.user.profileImage).toBe("");
  });

  it("should reject unauthorized requests", async () => {
    const response = await request(app).get("/api/user/contacts").expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("access denied");
  });

  it("should reject requests with invalid auth token", async () => {
    const response = await request(app)
      .get("/api/user/contacts")
      .set("x-auth-token", "invalid-token")
      .expect(401);
      

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid authentication token");
  });

  it("should handle requests with invalid user ID format", async () => {
    // Generate token with invalid user ID
    const jwtSecret = process.env.JWT_SECRET || "test-secret";
    const invalidIdToken = jwt.sign(
      {
        user: {
          id: "invalid-id-format",
          uid: "invalid-uid",
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

    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe("contacts-e2");
    expect(response.body.message).toBe("Invalid user ID format");
  });

  it("should maintain data consistency after adding a new contact", async () => {
    // Create initial contact
    await Contact.create({
      userUid: testUser.uid,
      contactUid: contactUsers[0].uid,
    });

    // Verify first contact
    const firstResponse = await request(app)
      .get("/api/user/contacts")
      .set("x-auth-token", authToken)
      .expect(200);

    expect(firstResponse.body.data.contacts).toHaveLength(1);

    // Add second contact
    await Contact.create({
      userUid: testUser.uid,
      contactUid: contactUsers[1].uid,
    });

    // Verify both contacts
    const secondResponse = await request(app)
      .get("/api/user/contacts")
      .set("x-auth-token", authToken)
      .expect(200);

    expect(secondResponse.body.data.contacts).toHaveLength(2);
    expect(secondResponse.body.data.count).toBe(2);
  });
});
