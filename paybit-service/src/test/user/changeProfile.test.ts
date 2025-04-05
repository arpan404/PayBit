import request from "supertest";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import app from "../../app";
import User from "../../db/user";
import {
  beforeAll,
  afterAll,

  describe,
  it,

  expect,
} from "@jest/globals";

// Test user data
const testUser = {
  fullname: "Profile Test User",
  email: "profile.test@example.com",
  password: "Profile@123",
  uid: uuidv4(),
};

// Updated profile data
const updatedProfile = {
  fullname: "Updated Profile User",
};

let authToken: string;
let userId: string;
let testImagePath: string;

// Set up test user and generate auth token before tests
beforeAll(async () => {
  // Ensure test uploads directory exists
  const uploadsDir = path.join(__dirname, "../../../public/uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create a test image file
  testImagePath = path.join(uploadsDir, "test-profile.jpg");
  // If the test image doesn't exist, create a simple empty file
  if (!fs.existsSync(testImagePath)) {
    fs.writeFileSync(testImagePath, Buffer.from(""));
  }

  // Clean up any existing test user
  await User.deleteOne({ email: testUser.email });

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(testUser.password, salt);

  // Create a test user
  const user = await User.create({
    fullname: testUser.fullname,
    email: testUser.email,
    password: hashedPassword,
    uid: testUser.uid,
    profileImage: "",
  });

  userId = String(user._id);

  // Generate JWT token for authentication
  const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret";

  authToken = jwt.sign(
    {
      user: {
        id: userId,
        uid: user.uid,
        email: user.email,
      },
    },
    jwtSecret,
    { expiresIn: "1h" },
  );
});

// Clean up after all tests
afterAll(async () => {
  // Delete the test user
  await User.deleteOne({ email: testUser.email });

  // Delete test image if it was created for testing
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
  }

  // Clean up any uploaded test files
  const uploadsDir = path.join(__dirname, "../../../public/uploads");
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    files.forEach((file) => {
      if (file.startsWith("profile-test-")) {
        fs.unlinkSync(path.join(uploadsDir, file));
      }
    });
  }
});

describe("User - Change Profile Controller", () => {
  // Test successful profile update (fullname only)
  it("should successfully update user fullname", async () => {
    const response = await request(app)
      .put("/api/user/profile")
      .set("x-auth-token", authToken)
      .send({ fullname: updatedProfile.fullname })
      .expect(200);

    // Check response structure
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty(
      "message",
      "Profile updated successfully",
    );
    expect(response.body).toHaveProperty("data");

    // Check updated user data
    expect(response.body.data).toHaveProperty(
      "fullname",
      updatedProfile.fullname,
    );
    expect(response.body.data).toHaveProperty("email", testUser.email);
    expect(response.body.data).toHaveProperty("uid", testUser.uid);

    // Verify database was updated
    const user = await User.findById(userId);
    expect(user).toBeTruthy();
    expect(user?.fullname).toBe(updatedProfile.fullname);
  });

  // Test profile image upload
  it("should successfully upload and update profile image", async () => {
    const response = await request(app)
      .put("/api/user/profile")
      .set("x-auth-token", authToken)
      .attach("profileImage", testImagePath)
      .expect(200);

    // Check response has updated profile image
    expect(response.body.data).toHaveProperty("profileImage");
    expect(response.body.data.profileImage).toContain("/uploads/");

    // Verify database was updated
    const user = await User.findById(userId);
    expect(user).toBeTruthy();
    expect(user?.profileImage).toContain("/uploads/");

    // Store the image path for cleanup in the next test
    const imagePath = user?.profileImage;

    // Test replacing existing image
    if (imagePath) {
      const fullImagePath = path.join(__dirname, "../../../public", imagePath);
      // Verify file exists on disk
      expect(fs.existsSync(fullImagePath)).toBe(true);

      // Upload a new image (should replace the old one)
      await request(app)
        .put("/api/user/profile")
        .set("x-auth-token", authToken)
        .attach("profileImage", testImagePath)
        .expect(200);

      // The old file should be removed
      expect(fs.existsSync(fullImagePath)).toBe(false);
    }
  });

  // Test update both fullname and profile image
  it("should update both fullname and profile image", async () => {
    const newName = "Combined Update User";

    const response = await request(app)
      .put("/api/user/profile")
      .set("x-auth-token", authToken)
      .field("fullname", newName)
      .attach("profileImage", testImagePath)
      .expect(200);

    // Check both fields were updated
    expect(response.body.data).toHaveProperty("fullname", newName);
    expect(response.body.data.profileImage).toContain("/uploads/");

    // Verify database was updated
    const user = await User.findById(userId);
    expect(user).toBeTruthy();
    expect(user?.fullname).toBe(newName);
    expect(user?.profileImage).toContain("/uploads/");
  });

  // Test missing authentication
  it("should return error when not authenticated", async () => {
    await request(app)
      .put("/api/user/profile")
      .send({ fullname: "Unauthorized Update" })
      .expect(401)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "auth-e1");
        expect(res.body).toHaveProperty(
          "message",
          "No authentication token, access denied",
        );
      });
  });

  // Test invalid authentication
  it("should return error with invalid token", async () => {
    await request(app)
      .put("/api/user/profile")
      .set("x-auth-token", "invalid-token")
      .send({ fullname: "Invalid Token Update" })
      .expect(401)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "auth-e3");
      });
  });

  // Test with non-existent user ID in token
  it("should return error when user not found", async () => {
    // Generate JWT with non-existent user ID
    const nonExistentId = new mongoose.Types.ObjectId();
    const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret";

    const invalidToken = jwt.sign(
      {
        user: {
          id: nonExistentId,
          uid: "non-existent-uid",
          email: "non-existent@example.com",
        },
      },
      jwtSecret,
      { expiresIn: "1h" },
    );

    await request(app)
      .put("/api/user/profile")
      .set("x-auth-token", invalidToken)
      .send({ fullname: "Not Found Update" })
      .expect(404)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "profile-e2");
        expect(res.body).toHaveProperty("message", "User not found");
      });
  });

  // Test server error handling with mocked User.findById
  it("should handle server errors gracefully", async () => {
    // Mock User.findById to throw an error
    const originalFindById = User.findById;
    User.findById = jest.fn().mockImplementationOnce(() => {
      throw new Error("Simulated database error");
    });

    await request(app)
      .put("/api/user/profile")
      .set("x-auth-token", authToken)
      .send({ fullname: "Error Test" })
      .expect(500)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "profile-e3");
        expect(res.body).toHaveProperty(
          "message",
          "Server error updating profile",
        );
      });

    // Restore the original function
    User.findById = originalFindById;
  });
});
