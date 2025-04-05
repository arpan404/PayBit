import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import app from "../../app";
import User from "../../db/user";
import Request from "../../db/requests";
import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";

// Test users
const requesterUser = {
  fullname: "Requester User",
  email: "requester.test@example.com",
  password: "Requester@123",
  uid: uuidv4(),
};

const senderUser = {
  fullname: "Sender User",
  email: "sender.test@example.com",
  password: "Sender@123",
  uid: uuidv4(),
};

// Test request data
const testRequest = {
  amount: 100.5,
};

// IDs and tokens for test users
let requesterUserId: string;
let requesterAuthToken: string;
let senderUserId: string;
let senderAuthToken: string;

// Request IDs
let requestId1: string;
let requestId2: string;

// Setup before all tests
beforeAll(async () => {
  // Clean up existing test data
  await User.deleteMany({
    email: { $in: [requesterUser.email, senderUser.email] },
  });
  await Request.deleteMany({}); // Clear all requests

  // Create test users
  const salt = await bcrypt.genSalt(10);

  // Create requester user
  const hashedRequesterPassword = await bcrypt.hash(
    requesterUser.password,
    salt,
  );
  const requesterUserDoc = await User.create({
    fullname: requesterUser.fullname,
    email: requesterUser.email,
    password: hashedRequesterPassword,
    uid: requesterUser.uid,
    profileImage: "",
  });
  requesterUserId = (requesterUserDoc as any)._id.toString();

  // Create sender user
  const hashedSenderPassword = await bcrypt.hash(senderUser.password, salt);
  const senderUserDoc = await User.create({
    fullname: senderUser.fullname,
    email: senderUser.email,
    password: hashedSenderPassword,
    uid: senderUser.uid,
    profileImage: "",
  });
  senderUserId = (senderUserDoc as any)._id.toString();

  // Generate JWT tokens
  const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret";

  requesterAuthToken = jwt.sign(
    {
      user: {
        id: requesterUserId,
        uid: requesterUser.uid,
        email: requesterUser.email,
      },
    },
    jwtSecret,
    { expiresIn: "1h" },
  );

  senderAuthToken = jwt.sign(
    {
      user: {
        id: senderUserId,
        uid: senderUser.uid,
        email: senderUser.email,
      },
    },
    jwtSecret,
    { expiresIn: "1h" },
  );

  // Create test requests
  // Request 1: Requester user requesting money from sender user
  const request1 = await Request.create({
    requesterId: new mongoose.Types.ObjectId(requesterUserId),
    amount: testRequest.amount,
    senderId: new mongoose.Types.ObjectId(senderUserId),
    isResolved: false,
  });
  requestId1 = (request1 as any)._id.toString();

  // Request 2: Sender user requesting money from requester user (for testing opposite direction)
  const request2 = await Request.create({
    requesterId: new mongoose.Types.ObjectId(senderUserId),
    amount: testRequest.amount * 2,
    senderId: new mongoose.Types.ObjectId(requesterUserId),
    isResolved: true,
  });
  requestId2 = (request2 as any)._id.toString();
});

// Clean up after all tests
afterAll(async () => {
  // Remove test users and requests
  await User.deleteMany({
    email: { $in: [requesterUser.email, senderUser.email] },
  });
  await Request.deleteMany({});
});

describe("User - Fetch Request Controller", () => {
  // Test fetching sent requests
  it("should fetch sent requests successfully", async () => {
    const response = await request(app)
      .get("/api/user/requests?sender=me")
      .set("x-auth-token", requesterAuthToken)
      .expect(200);

    // Check response structure
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("message", "Sent requests retrieved");
    expect(response.body.data).toHaveProperty("requests");

    // Find our test request
    const requests = response.body.data.requests;
    const foundRequest = requests.find((req: any) => req.id === requestId2);

    expect(foundRequest).toBeTruthy();
    expect(foundRequest).toHaveProperty("amount", testRequest.amount * 2);
    expect(foundRequest).toHaveProperty("isResolved", true);
  });

  // Test filtering by resolved status
  it("should filter requests by resolved status", async () => {
    // Get only resolved requests
    const response = await request(app)
      .get("/api/user/requests?sender=me&resolved=true")
      .set("x-auth-token", requesterAuthToken)
      .expect(200);

    // All returned requests should be resolved
    const requests = response.body.data.requests;
    requests.forEach((req: any) => {
      expect(req.isResolved).toBe(true);
    });

    // At least one request should be found (our test request)
    expect(requests.length).toBeGreaterThanOrEqual(1);

    // Now get only unresolved requests
    const response2 = await request(app)
      .get("/api/user/requests?sender=me&resolved=false")
      .set("x-auth-token", requesterAuthToken)
      .expect(200);

    // All returned requests should be unresolved
    const requests2 = response2.body.data.requests;
    requests2.forEach((req: any) => {
      expect(req.isResolved).toBe(false);
    });
  });

  // Test pagination
  it("should support pagination", async () => {
    // Test with page=1, limit=5
    const response = await request(app)
      .get("/api/user/requests?sender=me&page=1&limit=5")
      .set("x-auth-token", requesterAuthToken)
      .expect(200);

    // Check pagination info
    expect(response.body.data).toHaveProperty("pagination");
    expect(response.body.data.pagination).toHaveProperty("page", 1);
    expect(response.body.data.pagination).toHaveProperty("limit", 5);
    expect(response.body.data.pagination).toHaveProperty("total");
    expect(response.body.data.pagination).toHaveProperty("pages");

    // Requests should be limited to 5
    expect(response.body.data.requests.length).toBeLessThanOrEqual(5);
  });

  // Test missing authentication
  it("should return error when not authenticated", async () => {
    await request(app)
      .get("/api/user/requests?type=received")
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
      .get("/api/user/requests?type=received")
      .set("x-auth-token", "invalid-token")
      .expect(401)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "auth-e3");
      });
  });

  // Test missing query parameters
  it("should handle missing or invalid query parameters", async () => {
    // Test with no sender parameter
    await request(app)
      .get("/api/user/requests")
      .set("x-auth-token", requesterAuthToken)
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        // Update the expectation to match the actual error message
        expect(res.body.message).toContain("Missing required query param");
      });
  });

  // Test server error handling
  it("should handle server errors gracefully", async () => {
    // Mock Request.find to throw an error
    const originalFind = Request.find;
    Request.find = jest.fn().mockImplementationOnce(() => {
      throw new Error("Simulated database error");
    });

    await request(app)
      .get("/api/user/requests?sender=me")
      .set("x-auth-token", requesterAuthToken)
      .expect(500)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "fetch-request-e2");
        expect(res.body).toHaveProperty(
          "message",
          "Server error fetching requests",
        );
      });

    // Restore the original function
    Request.find = originalFind;
  });

  // Test with empty results
  it("should handle empty result sets properly", async () => {
    // Generate a unique email to avoid duplicate key errors
    const uniqueEmail = `empty.user.${Date.now()}@example.com`;

    // Create a new user with no requests
    const emptyUser = {
      fullname: "Empty User",
      email: uniqueEmail,
      password: "Empty@123",
      uid: uuidv4(),
    };

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(emptyUser.password, salt);

    const emptyUserDoc = await User.create({
      fullname: emptyUser.fullname,
      email: emptyUser.email,
      password: hashedPassword,
      uid: emptyUser.uid,
      profileImage: "",
    });

    // Generate token for empty user
    const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret";
    const emptyUserToken = jwt.sign(
      {
        user: {
          id: (emptyUserDoc as any)._id.toString(),
          uid: emptyUser.uid,
          email: emptyUser.email,
        },
      },
      jwtSecret,
      { expiresIn: "1h" },
    );

    // Get requests for user with no requests
    const response = await request(app)
      .get("/api/user/requests?sender=me")
      .set("x-auth-token", emptyUserToken)
      .expect(200);

    // Should have empty array but valid structure
    expect(response.body.data).toHaveProperty("requests");
    expect(Array.isArray(response.body.data.requests)).toBe(true);
    expect(response.body.data.requests.length).toBe(0);

    // Clean up
    await User.deleteOne({ email: emptyUser.email });
  });
});
