import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import app from "../../app";
import User from "../../db/user";
import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";

// Test user data
const testUser = {
  fullname: "Password Reset User",
  email: "password.reset@example.com",
  password: "CurrentPass@123",
  newPassword: "NewPassword@456",
  uid: uuidv4(),
};

let authToken: string;
let userId: string;

// Set up test user and generate auth token before tests
beforeAll(async () => {
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

  userId = (user as any)._id.toString();

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

// Clean up after tests
afterAll(async () => {
  // Delete the test user
  await User.deleteOne({ email: testUser.email });
});

describe("Auth - Forget Password Controller", () => {
  // Test successful password change
  it("should successfully change password with valid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/forget-password")
      .set("x-auth-token", authToken)
      .send({
        currentPassword: testUser.password,
        newPassword: testUser.newPassword,
      })
      .expect(200);

    expect(response.body).toHaveProperty(
      "message",
      "Password updated successfully.",
    );

    // Verify password was actually changed in the database
    const user = await User.findById(userId);
    expect(user).toBeTruthy();

    // Verify the new password works by comparing it with the stored hash
    const passwordMatches = await bcrypt.compare(
      testUser.newPassword,
      user!.password,
    );
    expect(passwordMatches).toBe(true);

    // Reset password back to original for subsequent tests
    const salt = await bcrypt.genSalt(10);
    const hashedOriginalPassword = await bcrypt.hash(testUser.password, salt);
    user!.password = hashedOriginalPassword;
    await user!.save();
  });

  // Test missing auth token
  it("should return error when no auth token is provided", async () => {
    await request(app)
      .post("/api/auth/forget-password")
      .send({
        currentPassword: testUser.password,
        newPassword: testUser.newPassword,
      })
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

  // Test invalid auth token
  it("should return error when auth token is invalid", async () => {
    await request(app)
      .post("/api/auth/forget-password")
      .set("x-auth-token", "invalid-token")
      .send({
        currentPassword: testUser.password,
        newPassword: testUser.newPassword,
      })
      .expect(401)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "auth-e3");
      });
  });

  // Test missing required fields
  it("should return error when required fields are missing", async () => {
    // Test missing currentPassword
    await request(app)
      .post("/api/auth/forget-password")
      .set("x-auth-token", authToken)
      .send({
        newPassword: testUser.newPassword,
      })
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("code", "error-e1");
        expect(res.body).toHaveProperty(
          "message",
          "Both current and new passwords are required.",
        );
      });

    // Test missing newPassword
    await request(app)
      .post("/api/auth/forget-password")
      .set("x-auth-token", authToken)
      .send({
        currentPassword: testUser.password,
      })
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("code", "error-e1");
      });

    // Test empty body
    await request(app)
      .post("/api/auth/forget-password")
      .set("x-auth-token", authToken)
      .send({})
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("code", "error-e1");
      });
  });

  // Test incorrect current password
  it("should return error when current password is incorrect", async () => {
    await request(app)
      .post("/api/auth/forget-password")
      .set("x-auth-token", authToken)
      .send({
        currentPassword: "WrongPassword123!",
        newPassword: testUser.newPassword,
      })
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("code", "error-e4");
        expect(res.body).toHaveProperty(
          "message",
          "Current password is incorrect.",
        );
      });
  });

  // Test same password
  it("should return error when new password is the same as current password", async () => {
    await request(app)
      .post("/api/auth/forget-password")
      .set("x-auth-token", authToken)
      .send({
        currentPassword: testUser.password,
        newPassword: testUser.password,
      })
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("code", "error-e5");
        expect(res.body).toHaveProperty(
          "message",
          "New password must be different from the current password.",
        );
      });
  });

  // Test weak new password
  it("should return error when new password is too weak", async () => {
    await request(app)
      .post("/api/auth/forget-password")
      .set("x-auth-token", authToken)
      .send({
        currentPassword: testUser.password,
        newPassword: "weak",
      })
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("code", "error-e6");
        expect(res.body).toHaveProperty(
          "message",
          "New password must be at least 8 characters long.",
        );
      });
  });

  // Test with non-existent user ID in token
  it("should return error when user ID in token does not exist", async () => {
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
      .post("/api/auth/forget-password")
      .set("x-auth-token", invalidToken)
      .send({
        currentPassword: testUser.password,
        newPassword: testUser.newPassword,
      })
      .expect(404)
      .expect((res) => {
        expect(res.body).toHaveProperty("code", "error-e3");
        expect(res.body).toHaveProperty("message", "User not found.");
      });
  });

  // Test server error handling (requires mocking)
  it("should handle server errors gracefully", async () => {
    // Mock User.findById to throw an error
    const originalFindById = User.findById;
    User.findById = jest.fn().mockImplementationOnce(() => {
      throw new Error("Simulated database error");
    });

    await request(app)
      .post("/api/auth/forget-password")
      .set("x-auth-token", authToken)
      .send({
        currentPassword: testUser.password,
        newPassword: testUser.newPassword,
      })
      .expect(500)
      .expect((res) => {
        expect(res.body).toHaveProperty("code", "error-e7");
        expect(res.body).toHaveProperty("message", "Server error.");
      });

    // Restore the original function
    User.findById = originalFindById;
  });

  // Test password security
  it("should securely hash the new password", async () => {
    // First change the password
    await request(app)
      .post("/api/auth/forget-password")
      .set("x-auth-token", authToken)
      .send({
        currentPassword: testUser.password,
        newPassword: "SecureNewPass@789",
      })
      .expect(200);

    // Retrieve the user from the database
    const user = await User.findById(userId);
    expect(user).toBeTruthy();

    // Verify the password is not stored in plain text
    expect(user!.password).not.toBe("SecureNewPass@789");

    // Verify it's a bcrypt hash (bcrypt hashes start with '$2a$', '$2b$', or '$2y$')
    expect(user!.password).toMatch(/^\$2[aby]\$\d+\$/);

    // Reset password back to original for subsequent tests
    const salt = await bcrypt.genSalt(10);
    const hashedOriginalPassword = await bcrypt.hash(testUser.password, salt);
    user!.password = hashedOriginalPassword;
    await user!.save();
  });
});
