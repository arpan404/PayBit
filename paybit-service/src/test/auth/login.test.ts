import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import app from "../../app";
import User from "../../db/user";
import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";

// Test user data
const testUser = {
  fullname: "Test Login User",
  email: "test.login@example.com",
  password: "TestLogin@123",
  uid: uuidv4(),
};

// Create a test user before running tests
beforeAll(async () => {
  // Clean up any existing test user
  await User.deleteOne({ email: testUser.email });

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(testUser.password, salt);

  // Create a test user
  await User.create({
    fullname: testUser.fullname,
    email: testUser.email,
    password: hashedPassword,
    uid: testUser.uid,
    profileImage: "",
  });
});

// Clean up after tests
afterAll(async () => {
  // Delete the test user
  await User.deleteOne({ email: testUser.email });

  // Close the database connection
  await mongoose.connection.close();
});

describe("Auth - Login Controller", () => {
  // Test successful login
  it("should login a user successfully and return token", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    // Check response structure
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("message", "Login successful");
    expect(response.body).toHaveProperty("data");

    // Check user data
    expect(response.body.data).toHaveProperty("user");
    expect(response.body.data.user).toHaveProperty("uid", testUser.uid);
    expect(response.body.data.user).toHaveProperty(
      "fullname",
      testUser.fullname,
    );
    expect(response.body.data.user).toHaveProperty("email", testUser.email);

    // Check token
    expect(response.body.data).toHaveProperty("token");
    expect(typeof response.body.data.token).toBe("string");
    expect(response.body.data.token.length).toBeGreaterThan(0);

    // Ensure password is not returned
    expect(response.body.data.user).not.toHaveProperty("password");
  });

  // Test missing fields
  it("should return error when email or password is missing", async () => {
    // Test missing email
    await request(app)
      .post("/api/auth/login")
      .send({ password: testUser.password })
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "login-e1");
        expect(res.body).toHaveProperty(
          "message",
          "Email and password are required",
        );
      });

    // Test missing password
    await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email })
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "login-e1");
      });
  });

  // Test non-existent user
  it("should return error when user does not exist", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({
        email: "nonexistent@example.com",
        password: testUser.password,
      })
      .expect(401)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "login-e2");
        expect(res.body).toHaveProperty("message", "Invalid credentials");
      });
  });

  // Test incorrect password
  it("should return error when password is incorrect", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: "WrongPassword@123",
      })
      .expect(401)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "login-e3");
        expect(res.body).toHaveProperty("message", "Invalid credentials");
      });
  });

  // Test malformed input
  it("should handle malformed input gracefully", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "short" })
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
      });
  });

  // Test empty request body
  it("should handle empty request body", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({})
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "login-e1");
      });
  });
});
