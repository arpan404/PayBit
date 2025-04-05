import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import app from "../../app";
import User from "../../db/user";
import Request from "../../db/requests";

// Test users
const requester = {
  fullname: "Request Sender",
  email: "request.sender@example.com",
  password: "Sender123!",
  uid: uuidv4(),
};

const recipient = {
  fullname: "Request Recipient",
  email: "request.recipient@example.com",
  password: "Recipient123!",
  uid: uuidv4(),
};

// Global variables
let requesterAuthToken: string;
let requesterId: string;
let recipientId: string;

describe("User - Send Money Request Controller", () => {
  // Setup before all tests
  beforeAll(async () => {
    // Clear existing test data
    await User.deleteMany({
      email: { $in: [requester.email, recipient.email] },
    });
    await Request.deleteMany({});

    // Create test users
    const salt = await bcrypt.genSalt(10);

    // Create requester user
    const hashedRequesterPassword = await bcrypt.hash(requester.password, salt);
    const requesterUser = await User.create({
      fullname: requester.fullname,
      email: requester.email,
      password: hashedRequesterPassword,
      uid: requester.uid,
      profileImage: "",
    });
    requesterId = String(requesterUser._id);

    // Create recipient user
    const hashedRecipientPassword = await bcrypt.hash(recipient.password, salt);
    const recipientUser = await User.create({
      fullname: recipient.fullname,
      email: recipient.email,
      password: hashedRecipientPassword,
      uid: recipient.uid,
      profileImage: "",
    });
    recipientId = String(recipientUser._id);

    // Generate JWT token for requester
    const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret";
    requesterAuthToken = jwt.sign(
      {
        user: {
          id: requesterId,
          uid: requester.uid,
          email: requester.email,
        },
      },
      jwtSecret,
      { expiresIn: "1h" },
    );
  });

  // Clean up after all tests
  afterAll(async () => {
    await User.deleteMany({
      email: { $in: [requester.email, recipient.email] },
    });
    await Request.deleteMany({});
  });

  // Success case
  it("should successfully send a money request", async () => {
    const requestAmount = 50;

    const response = await request(app)
      .post("/api/user/request")
      .set("x-auth-token", requesterAuthToken)
      .send({
        email: recipient.email,
        amount: requestAmount,
      })
      .expect(201);

    // Check response structure
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty(
      "message",
      "Money request sent successfully",
    );
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("request");

    // Check request data
    const { request: moneyRequest } = response.body.data;
    expect(moneyRequest).toHaveProperty("id");
    expect(moneyRequest).toHaveProperty("amount", requestAmount);
    expect(moneyRequest).toHaveProperty("createdAt");
    expect(moneyRequest).toHaveProperty("isResolved", false);

    // Check user details
    expect(moneyRequest).toHaveProperty("requester");
    expect(moneyRequest.requester).toHaveProperty(
      "fullname",
      requester.fullname,
    );
    expect(moneyRequest.requester).toHaveProperty("email", requester.email);

    expect(moneyRequest).toHaveProperty("sender");
    expect(moneyRequest.sender).toHaveProperty("fullname", recipient.fullname);
    expect(moneyRequest.sender).toHaveProperty("email", recipient.email);

    // Verify in database
    const savedRequest = await Request.findById(moneyRequest.id);
    expect(savedRequest).toBeTruthy();
    expect(savedRequest?.amount).toBe(requestAmount);
    expect(savedRequest?.isResolved).toBe(false);
    expect(savedRequest?.requesterId.toString()).toBe(requesterId);
    expect(savedRequest?.senderId.toString()).toBe(recipientId);

    // Clean up this specific request
    await Request.findByIdAndDelete(moneyRequest.id);
  });

  // Authentication error cases
  it("should require authentication", async () => {
    await request(app)
      .post("/api/user/request")
      .send({
        email: recipient.email,
        amount: 50,
      })
      .expect(401)
      .expect((res) => {
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBeDefined();
      });
  });

  // Validation error cases
  it("should validate recipient email is provided", async () => {
    await request(app)
      .post("/api/user/request")
      .set("x-auth-token", requesterAuthToken)
      .send({
        amount: 50,
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("request-e2");
        expect(res.body.message).toContain("email");
      });
  });

  it("should validate amount is provided and valid", async () => {
    // Missing amount
    await request(app)
      .post("/api/user/request")
      .set("x-auth-token", requesterAuthToken)
      .send({
        email: recipient.email,
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("request-e3");
        expect(res.body.message).toContain("amount");
      });

    // Zero amount
    await request(app)
      .post("/api/user/request")
      .set("x-auth-token", requesterAuthToken)
      .send({
        email: recipient.email,
        amount: 0,
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("request-e3");
      });

    // Negative amount
    await request(app)
      .post("/api/user/request")
      .set("x-auth-token", requesterAuthToken)
      .send({
        email: recipient.email,
        amount: -10,
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("request-e3");
      });

    // Non-numeric amount
    await request(app)
      .post("/api/user/request")
      .set("x-auth-token", requesterAuthToken)
      .send({
        email: recipient.email,
        amount: "abc",
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("request-e3");
      });
  });

  it("should validate recipient exists", async () => {
    await request(app)
      .post("/api/user/request")
      .set("x-auth-token", requesterAuthToken)
      .send({
        email: "nonexistent@example.com",
        amount: 50,
      })
      .expect(404)
      .expect((res) => {
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("request-e4");
        expect(res.body.message).toContain("not found");
      });
  });

  it("should prevent self-requests", async () => {
    await request(app)
      .post("/api/user/request")
      .set("x-auth-token", requesterAuthToken)
      .send({
        email: requester.email,
        amount: 50,
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("request-e5");
        expect(res.body.message).toContain("yourself");
      });
  });

  it("should prevent duplicate pending requests", async () => {
    // Create a pending request
    const request1 = await request(app)
      .post("/api/user/request")
      .set("x-auth-token", requesterAuthToken)
      .send({
        email: recipient.email,
        amount: 75,
      })
      .expect(201);

    // Try to create another pending request
    await request(app)
      .post("/api/user/request")
      .set("x-auth-token", requesterAuthToken)
      .send({
        email: recipient.email,
        amount: 100,
      })
      .expect(409)
      .expect((res) => {
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("request-e6");
        expect(res.body.message).toContain("already exists");
      });

    // Clean up the created request
    const requestId = request1.body.data.request.id;
    await Request.findByIdAndDelete(requestId);
  });

  it("should handle different amounts correctly", async () => {
    // Test with decimal amount
    const decimalAmount = 45.75;

    const response = await request(app)
      .post("/api/user/request")
      .set("x-auth-token", requesterAuthToken)
      .send({
        email: recipient.email,
        amount: decimalAmount,
      })
      .expect(201);

    // Verify amount is stored correctly
    expect(response.body.data.request.amount).toBe(decimalAmount);

    // Clean up
    await Request.findByIdAndDelete(response.body.data.request.id);

    // Test with string amount that's valid
    const stringAmount = "60.25";

    const response2 = await request(app)
      .post("/api/user/request")
      .set("x-auth-token", requesterAuthToken)
      .send({
        email: recipient.email,
        amount: stringAmount,
      })
      .expect(201);

    // Verify amount is converted and stored correctly
    expect(response2.body.data.request.amount).toBe(parseFloat(stringAmount));

    // Clean up
    await Request.findByIdAndDelete(response2.body.data.request.id);
  });

  it("should preserve fields during create and retrieve", async () => {
    const requestAmount = 85.5;
    const currentTime = new Date();

    // Create a request
    const response = await request(app)
      .post("/api/user/request")
      .set("x-auth-token", requesterAuthToken)
      .send({
        email: recipient.email,
        amount: requestAmount,
      })
      .expect(201);

    const requestId = response.body.data.request.id;

    
    // Retrieve the request from the database
    const savedRequest = await Request.findById(requestId)
      .populate("requesterId", "fullname email uid profileImage")
      .populate("senderId", "fullname email uid profileImage");

    // Verify all fields
    expect(savedRequest).toBeTruthy();
    expect(savedRequest?.amount).toBe(requestAmount);
    expect(savedRequest?.isResolved).toBe(false);
    expect(savedRequest?.requesterId._id.toString()).toBe(requesterId);
    expect(savedRequest?.senderId._id.toString()).toBe(recipientId);

    // Check timestamps
    expect(
      new Date(savedRequest?.createdAt as Date).getTime(),
    ).toBeGreaterThanOrEqual(currentTime.getTime() - 5000);
    expect(
      new Date(savedRequest?.createdAt as Date).getTime(),
    ).toBeLessThanOrEqual(new Date().getTime());

    // Check populated fields
    expect((savedRequest?.requesterId as any).fullname).toBe(
      requester.fullname,
    );
    expect((savedRequest?.requesterId as any).email).toBe(requester.email);
    expect((savedRequest?.senderId as any).fullname).toBe(recipient.fullname);
    expect((savedRequest?.senderId as any).email).toBe(recipient.email);

    // Clean up
    await Request.findByIdAndDelete(requestId);
  });
});
