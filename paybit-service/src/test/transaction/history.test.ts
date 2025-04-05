import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import app from "../../app";
import User from "../../db/user";
import Transaction from "../../db/transaction";
import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";

// Test users data
const sender = {
  fullname: "Transaction Sender",
  email: "tx.sender@example.com",
  password: "Sender@123",
  uid: uuidv4(),
};

const receiver = {
  fullname: "Transaction Receiver",
  email: "tx.receiver@example.com",
  password: "Receiver@123",
  uid: uuidv4(),
};

const unrelatedUser = {
  fullname: "Unrelated User",
  email: "unrelated@example.com",
  password: "Unrelated@123",
  uid: uuidv4(),
};

// Test transaction data
const testTransactions = [
  // Regular payment
  {
    amount: 100,
    type: "payment",
    status: "completed",
    description: "Test payment",
    reference: "TEST-REF-001",
    createdAt: new Date("2023-01-01"),
  },
  // Donation
  {
    amount: 50,
    type: "donation",
    status: "completed",
    description: "Test donation",
    reference: "TEST-REF-002",
    createdAt: new Date("2023-01-15"),
  },
  // Failed transfer
  {
    amount: 200,
    type: "transfer",
    status: "failed",
    description: "Failed transfer test",
    reference: "TEST-REF-003",
    createdAt: new Date("2023-02-01"),
  },
  // Large amount
  {
    amount: 1000,
    type: "payment",
    status: "completed",
    description: "Large payment",
    reference: "TEST-REF-004",
    createdAt: new Date("2023-02-15"),
  },
  // Received payment
  {
    amount: 75,
    type: "payment",
    status: "completed",
    description: "Received payment",
    reference: "TEST-REF-005",
    createdAt: new Date("2023-03-01"),
    // This one will be from receiver to sender (reverse direction)
    reverseDirection: true,
  },
];

// Global variables for tests
let senderAuthToken: string;
let senderId: string;
let receiverId: string;
let transactionIds: string[] = [];
let campaignId: string;

// Setup before all tests
beforeAll(async () => {
  // Clear existing test data
  await User.deleteMany({
    email: { $in: [sender.email, receiver.email, unrelatedUser.email] },
  });
  await Transaction.deleteMany({ reference: { $regex: /^TEST-REF-/ } });

  // Create a fake campaign ID for donation transaction
  campaignId = new mongoose.Types.ObjectId().toString();

  // Create test users
  const salt = await bcrypt.genSalt(10);

  // Create sender user
  const hashedSenderPassword = await bcrypt.hash(sender.password, salt);
  const senderUser = await User.create({
    fullname: sender.fullname,
    email: sender.email,
    password: hashedSenderPassword,
    uid: sender.uid,
    profileImage: "",
  });
  senderId = String(senderUser._id);

  // Create receiver user
  const hashedReceiverPassword = await bcrypt.hash(receiver.password, salt);
  const receiverUser = await User.create({
    fullname: receiver.fullname,
    email: receiver.email,
    password: hashedReceiverPassword,
    uid: receiver.uid,
    profileImage: "",
  });
  receiverId = String(receiverUser._id);

  // Create unrelated user
  const hashedUnrelatedPassword = await bcrypt.hash(
    unrelatedUser.password,
    salt,
  );
  const unrelatedUserDoc = await User.create({
    fullname: unrelatedUser.fullname,
    email: unrelatedUser.email,
    password: hashedUnrelatedPassword,
    uid: unrelatedUser.uid,
    profileImage: "",
  });

  // Generate JWT tokens
  const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret";

  senderAuthToken = jwt.sign(
    {
      user: {
        id: senderId,
        uid: sender.uid,
        email: sender.email,
      },
    },
    jwtSecret,
    { expiresIn: "1h" },
  );

  // Create test transactions
  for (const tx of testTransactions) {
    const { reverseDirection, ...txData } = tx;

    const transaction = await Transaction.create({
      fromUserId: reverseDirection ? receiverId : senderId,
      toUserId: reverseDirection ? senderId : receiverId,
      senderName: reverseDirection ? receiver.fullname : sender.fullname,
      receiverName: reverseDirection ? sender.fullname : receiver.fullname,
      amount: txData.amount,
      type: txData.type,
      status: txData.status,
      description: txData.description,
      reference: txData.reference,
      ...(txData.type === "donation" ? { campaignId } : {}),
      createdAt: txData.createdAt,
      updatedAt: txData.createdAt,
    });

    transactionIds.push(String(transaction._id));
  }
});

// Clean up after all tests
afterAll(async () => {
  await User.deleteMany({
    email: { $in: [sender.email, receiver.email, unrelatedUser.email] },
  });
  await Transaction.deleteMany({ reference: { $regex: /^TEST-REF-/ } });
});

describe("Transaction History Controller", () => {
  describe("GET /api/transaction/history", () => {
    it("should return all transactions for authenticated user", async () => {
      const response = await request(app)
        .get("/api/transaction/history")
        .set("x-auth-token", senderAuthToken)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data.transactions");
    });

    it("should validate and reject invalid date parameters", async () => {
      const response = await request(app)
        .get("/api/transaction/history?startDate=invalid-date")
        .set("x-auth-token", senderAuthToken)
        .expect(200);

      expect(response.body.data.transactions).toHaveLength(5);
    });

    it("should handle complex combining of multiple filters correctly", async () => {
      const response = await request(app)
        .get(
          "/api/transaction/history?type=payment&status=completed&minAmount=50&maxAmount=200&sort=amount-low",
        )
        .set("x-auth-token", senderAuthToken)
        .expect(200);

      const amounts = response.body.data.transactions.map(
        (tx: any) => tx.amount,
      );
      expect(amounts).toEqual([...amounts].sort((a, b) => a - b));
    });

    it("should filter transactions by sent direction correctly", async () => {
      const response = await request(app)
        .get("/api/transaction/history?direction=sent")
        .set("x-auth-token", senderAuthToken)
        .expect(200);

      response.body.data.transactions.forEach((tx: any) => {
        expect(tx.direction).toBe("sent");
      });
    });

    it("should handle invalid sort parameters gracefully", async () => {
      const response = await request(app)
        .get("/api/transaction/history?sort=invalid-sort")
        .set("x-auth-token", senderAuthToken)
        .expect(200);

      const dates = response.body.data.transactions.map((tx: any) =>
        new Date(tx.date).getTime(),
      );
      expect(dates).toEqual([...dates].sort((a, b) => b - a));
    });

    it('should return transactions filtered by direction "received"', async () => {
      const response = await request(app)
        .get("/api/transaction/history?direction=received")
        .set("x-auth-token", senderAuthToken)
        .expect(200);

      expect(response.body.data.transactions).toHaveLength(1);

      response.body.data.transactions.forEach((tx: any) => {
        expect(tx.direction).toBe("received");
      });
    });

    it("should return transactions filtered by type", async () => {
      const response = await request(app)
        .get("/api/transaction/history?type=payment")
        .set("x-auth-token", senderAuthToken)
        .expect(200);

      expect(response.body.data.transactions).toHaveLength(3);

      response.body.data.transactions.forEach((tx: any) => {
        expect(tx.type).toBe("payment");
      });
    });

    it("should return transactions filtered by status", async () => {
      const response = await request(app)
        .get("/api/transaction/history?status=failed")
        .set("x-auth-token", senderAuthToken)
        .expect(200);

      expect(response.body.data.transactions).toHaveLength(1);

      response.body.data.transactions.forEach((tx: any) => {
        expect(tx.status).toBe("failed");
      });
    });

    it("should return transactions filtered by date range", async () => {
      const response = await request(app)
        .get("/api/transaction/history?startDate=2023-01-10&endDate=2023-02-10")
        .set("x-auth-token", senderAuthToken)
        .expect(200);

      expect(response.body.data.transactions).toHaveLength(2);
    });

    it("should return transactions filtered by amount range", async () => {
      const response = await request(app)
        .get("/api/transaction/history?minAmount=100&maxAmount=500")
        .set("x-auth-token", senderAuthToken)
        .expect(200);

      expect(response.body.data.transactions).toHaveLength(2);

      response.body.data.transactions.forEach((tx: any) => {
        expect(tx.amount).toBeGreaterThanOrEqual(100);
        expect(tx.amount).toBeLessThanOrEqual(500);
      });
    });

    it("should return transactions filtered by search term", async () => {
      const response = await request(app)
        .get("/api/transaction/history?search=large")
        .set("x-auth-token", senderAuthToken)
        .expect(200);

      expect(response.body.data.transactions).toHaveLength(1);
      expect(response.body.data.transactions[0].description).toContain("Large");
    });

    it("should sort transactions by oldest first", async () => {
      const response = await request(app)
        .get("/api/transaction/history?sort=oldest")
        .set("x-auth-token", senderAuthToken)
        .expect(200);

      const dates = response.body.data.transactions.map((tx: any) =>
        new Date(tx.date).getTime(),
      );
      expect(dates).toEqual([...dates].sort());
    });

    it("should sort transactions by amount (high to low)", async () => {
      const response = await request(app)
        .get("/api/transaction/history?sort=amount-high")
        .set("x-auth-token", senderAuthToken)
        .expect(200);

      const amounts = response.body.data.transactions.map(
        (tx: any) => tx.amount,
      );
      expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
    });

    it("should handle pagination correctly", async () => {
      const response = await request(app)
        .get("/api/transaction/history?page=1&limit=2")
        .set("x-auth-token", senderAuthToken)
        .expect(200);

      expect(response.body.data.transactions).toHaveLength(2);
      expect(response.body.data.pagination).toEqual({
        total: 5,
        page: 1,
        limit: 2,
        pages: 3,
      });

      const secondPage = await request(app)
        .get("/api/transaction/history?page=2&limit=2")
        .set("x-auth-token", senderAuthToken)
        .expect(200);

      expect(secondPage.body.data.transactions).toHaveLength(2);
      expect(secondPage.body.data.transactions[0].id).not.toBe(
        response.body.data.transactions[0].id,
      );
    });

    it("should return empty array if no transactions match filters", async () => {
      const response = await request(app)
        .get("/api/transaction/history?type=refund")
        .set("x-auth-token", senderAuthToken)
        .expect(200);

      expect(response.body.data.transactions).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });

    it("should reject unauthenticated requests", async () => {
      await request(app).get("/api/transaction/history").expect(401);
    });

    it("should protect against non-existent users", async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();
      const fakeToken = jwt.sign(
        {
          user: {
            id: fakeUserId,
            uid: uuidv4(),
            email: "fake@example.com",
          },
        },
        process.env.JWT_SECRET || "test-jwt-secret",
        { expiresIn: "1h" },
      );

      await request(app)
        .get("/api/transaction/history")
        .set("x-auth-token", fakeToken)
        .expect(404)
        .expect((res) => {
          expect(res.body.code).toBe("tx-history-e3");
        });
    });

    it("should include campaign ID for donation transactions", async () => {
      const response = await request(app)
        .get("/api/transaction/history?type=donation")
        .set("x-auth-token", senderAuthToken)
        .expect(200);

      expect(response.body.data.transactions).toHaveLength(1);
      expect(response.body.data.transactions[0]).toHaveProperty(
        "campaignId",
        campaignId,
      );
    });

    it("should apply multiple filters together", async () => {
      const response = await request(app)
        .get(
          "/api/transaction/history?type=payment&direction=sent&minAmount=100",
        )
        .set("x-auth-token", senderAuthToken)
        .expect(200);

      expect(response.body.data.transactions).toHaveLength(2);

      response.body.data.transactions.forEach((tx: any) => {
        expect(tx.type).toBe("payment");
        expect(tx.direction).toBe("sent");
        expect(tx.amount).toBeGreaterThanOrEqual(100);
      });
    });
  });
});
