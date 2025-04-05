import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import app from "../../app";
import User from "../../db/user";
import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";

const testUser = {
  fullname: "Password Reset User",
  email: "password.reset@example.com",
  password: "CurrentPass@123",
  newPassword: "NewPassword@456",
  uid: uuidv4(),
};

let authToken: string;
let userId: string;


beforeAll(async () => {
  await User.deleteOne({ email: testUser.email });
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(testUser.password, salt);
  const user = await User.create({
    fullname: testUser.fullname,
    email: testUser.email,
    password: hashedPassword,
    uid: testUser.uid,
    profileImage: "",
  });
  userId = (user as any)._id.toString();
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

afterAll(async () => {
  await User.deleteOne({ email: testUser.email });
});

describe("Auth - Change Password Controller", () => {
  it("should successfully change password with valid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/change-password")
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
    const user = await User.findById(userId);
    expect(user).toBeTruthy();
    const passwordMatches = await bcrypt.compare(
      testUser.newPassword,
      user!.password,
    );
    expect(passwordMatches).toBe(true);
    const salt = await bcrypt.genSalt(10);
    const hashedOriginalPassword = await bcrypt.hash(testUser.password, salt);
    user!.password = hashedOriginalPassword;
    await user!.save();
  });

  it("should return error when no auth token is provided", async () => {
    await request(app)
      .post("/api/auth/change-password")
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

  it("should return error when auth token is invalid", async () => {
    await request(app)
      .post("/api/auth/change-password")
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

  it("should return error when required fields are missing", async () => {
    await request(app)
      .post("/api/auth/change-password")
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
    await request(app)
      .post("/api/auth/change-password")
      .set("x-auth-token", authToken)
      .send({
        currentPassword: testUser.password,
      })
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("code", "error-e1");
      });
    await request(app)
      .post("/api/auth/change-password")
      .set("x-auth-token", authToken)
      .send({})
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("code", "error-e1");
      });
  });

  it("should return error when current password is incorrect", async () => {
    await request(app)
      .post("/api/auth/change-password")
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

  it("should return error when new password is the same as current password", async () => {
    await request(app)
      .post("/api/auth/change-password")
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

  it("should return error when new password is too weak", async () => {
    await request(app)
      .post("/api/auth/change-password")
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

  it("should return error when user ID in token does not exist", async () => {
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
      .post("/api/auth/change-password")
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

  it("should handle server errors gracefully", async () => {
    const originalFindById = User.findById;
    User.findById = jest.fn().mockImplementationOnce(() => {
      throw new Error("Simulated database error");
    });
    await request(app)
      .post("/api/auth/change-password")
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
    User.findById = originalFindById;
  });

  it("should securely hash the new password", async () => {
    await request(app)
      .post("/api/auth/change-password")
      .set("x-auth-token", authToken)
      .send({
        currentPassword: testUser.password,
        newPassword: "SecureNewPass@789",
      })
      .expect(200);
    const user = await User.findById(userId);
    expect(user).toBeTruthy();
    expect(user!.password).not.toBe("SecureNewPass@789");
    expect(user!.password).toMatch(/^\$2[aby]\$\d+\$/);
    const salt = await bcrypt.genSalt(10);
    const hashedOriginalPassword = await bcrypt.hash(testUser.password, salt);
    user!.password = hashedOriginalPassword;
    await user!.save();
  });
});
