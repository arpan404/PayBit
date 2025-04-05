import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import app from "../../app";
import User from "../../db/user";
import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";

const testUser = {
  fullname: "Auto Login User",
  email: "auto.login@example.com",
  password: "AutoLogin@123",
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

  userId = (user._id as mongoose.Types.ObjectId).toString();

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

describe("Auth - Auto Login Controller", () => {
  it("should auto-login a user with valid token", async () => {
    const response = await request(app)
      .post("/api/auth/auto-login")
      .set("x-auth-token", authToken)
      .expect(200);

    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("message", "Auto login successful");
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("user");
    expect(response.body.data.user).toHaveProperty("uid", testUser.uid);
    expect(response.body.data.user).toHaveProperty(
      "fullname",
      testUser.fullname,
    );
    expect(response.body.data.user).toHaveProperty("email", testUser.email);
    expect(response.body.data).toHaveProperty("token");
    expect(typeof response.body.data.token).toBe("string");
    expect(response.body.data.token.length).toBeGreaterThan(0);
    expect(response.body.data.token).not.toBe(authToken);
  });

  it("should return error when no auth token is provided", async () => {
    await request(app)
      .post("/api/auth/auto-login")
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
      .post("/api/auth/auto-login")
      .set("x-auth-token", "invalid-token")
      .expect(401)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "auth-e3");
        expect(res.body).toHaveProperty(
          "message",
          "Invalid authentication token",
        );
      });
  });

  it("should return error when token is expired", async () => {
    const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret";
    const expiredToken = jwt.sign(
      {
        user: {
          id: userId,
          uid: testUser.uid,
          email: testUser.email,
        },
      },
      jwtSecret,
      { expiresIn: "0s" },
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await request(app)
      .post("/api/auth/auto-login")
      .set("x-auth-token", expiredToken)
      .expect(401)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "auth-e3");
        expect(res.body).toHaveProperty(
          "message",
          "Invalid authentication token",
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
      .post("/api/auth/auto-login")
      .set("x-auth-token", invalidToken)
      .expect(404)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "auto-login-e1");
        expect(res.body).toHaveProperty("message", "User not found");
      });
  });

  it("should generate a new token with extended expiration", async () => {
    const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret";
    const shortToken = jwt.sign(
      {
        user: {
          id: userId,
          uid: testUser.uid,
          email: testUser.email,
        },
      },
      jwtSecret,
      { expiresIn: "10m" },
    );

    const response = await request(app)
      .post("/api/auth/auto-login")
      .set("x-auth-token", shortToken)
      .expect(200);

    expect(response.body.data).toHaveProperty("token");
    expect(response.body.data.token).not.toBe(shortToken);

    const decodedShort = jwt.decode(shortToken) as { exp: number };
    const decodedNew = jwt.decode(response.body.data.token) as { exp: number };

    expect(decodedNew.exp).toBeGreaterThan(decodedShort.exp);
  });

  it("should handle server errors gracefully", async () => {
    const originalFindById = User.findById;
    User.findById = jest.fn().mockImplementationOnce(() => {
      throw new Error("Simulated database error");
    });

    await request(app)
      .post("/api/auth/auto-login")
      .set("x-auth-token", authToken)
      .expect(500)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "auto-login-e2");
        expect(res.body).toHaveProperty(
          "message",
          "Server error during auto login",
        );
      });

    User.findById = originalFindById;
  });
});
