import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import app from "../../app";
import User from "../../db/user";
import DonationCampaign from "../../db/donation";
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  it,
  expect,
} from "@jest/globals";

// Test users data
const creator = {
  fullname: "Update Test Creator",
  email: "update.creator@example.com",
  password: "Creator@123",

  uid: uuidv4(),
};

const otherUser = {
  fullname: "Update Test Other",
  email: "update.other@example.com",
  password: "Other@123",
  uid: uuidv4(),
};

// Test campaign data
const testCampaign = {
  name: "Original Campaign Name",
  description:
    "This is the original description that is long enough to meet the minimum requirements.",
  goalAmount: 1000,
  collectedAmount: 200,
  image: "https://example.com/original-image.jpg",
};

// Valid update data
const validUpdates = {
  name: "Updated Campaign Name",
  description:
    "This is the updated description which is still long enough to meet the minimum requirements and includes some additional details.",
  goalAmount: 1500,
  image: "https://example.com/updated-image.jpg",
};

// Global variables for tests
let creatorAuthToken: string;
let creatorId: string;
let otherUserAuthToken: string;
let campaignId: string;

// Setup before all tests
beforeAll(async () => {
  // Clear existing test data
  await User.deleteMany({ email: { $in: [creator.email, otherUser.email] } });
  await DonationCampaign.deleteMany({
    name: { $in: [testCampaign.name, validUpdates.name] },
  });

  // Create test users
  const salt = await bcrypt.genSalt(10);

  // Create campaign creator user
  const hashedCreatorPassword = await bcrypt.hash(creator.password, salt);
  const creatorUser = await User.create({
    fullname: creator.fullname,
    email: creator.email,
    password: hashedCreatorPassword,
    uid: creator.uid,
    profileImage: "",
  });
  creatorId = String(creatorUser._id);

  // Create other user
  const hashedOtherPassword = await bcrypt.hash(otherUser.password, salt);
  const otherUserDoc = await User.create({
    fullname: otherUser.fullname,
    email: otherUser.email,
    password: hashedOtherPassword,
    uid: otherUser.uid,
    profileImage: "",
  });

  // Generate JWT tokens
  const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret";

  creatorAuthToken = jwt.sign(
    {
      user: {
        id: creatorId,
        uid: creator.uid,
        email: creator.email,
      },
    },
    jwtSecret,
    { expiresIn: "1h" },
  );

  otherUserAuthToken = jwt.sign(
    {
      user: {
        id: String(otherUserDoc._id),
        uid: otherUser.uid,
        email: otherUser.email,
      },
    },
    jwtSecret,
    { expiresIn: "1h" },
  );
});

// Setup before each test
beforeEach(async () => {
  // Clean up existing campaigns
  await DonationCampaign.deleteMany({ creatorUid: creator.uid });

  // Create fresh test campaign before each test
  const campaign = await DonationCampaign.create({
    ...testCampaign,
    creatorUid: creator.uid,
  });

  campaignId = String(campaign._id);
});

// Clean up after all tests
afterAll(async () => {
  await User.deleteMany({ email: { $in: [creator.email, otherUser.email] } });
  await DonationCampaign.deleteMany({
    creatorUid: { $in: [creator.uid, otherUser.uid] },
  });
});

describe("Donation - Update Campaign Controller", () => {
  // Success cases
  it("should successfully update all fields of a campaign", async () => {
    const response = await request(app)
      .put(`/api/donation/campaign/${campaignId}`)
      .set("x-auth-token", creatorAuthToken)
      .send(validUpdates)
      .expect(200);

    // Check response structure
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty(
      "message",
      "Campaign updated successfully",
    );
    expect(response.body).toHaveProperty("data");

    // Check data fields
    const { data } = response.body;
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("name", validUpdates.name);
    expect(data).toHaveProperty("description", validUpdates.description);
    expect(data).toHaveProperty("goalAmount", validUpdates.goalAmount);
    expect(data).toHaveProperty("image", validUpdates.image);
    expect(data).toHaveProperty("progress");

    // Verify the campaign was actually updated in the database
    const updatedCampaign = await DonationCampaign.findById(campaignId);
    expect(updatedCampaign).toBeTruthy();
    expect(updatedCampaign?.name).toBe(validUpdates.name);
    expect(updatedCampaign?.description).toBe(validUpdates.description);
    expect(updatedCampaign?.goalAmount).toBe(validUpdates.goalAmount);
    expect(updatedCampaign?.image).toBe(validUpdates.image);
  });

  it("should successfully update a single field", async () => {
    const nameUpdate = { name: "Only Name Updated" };

    const response = await request(app)
      .put(`/api/donation/campaign/${campaignId}`)
      .set("x-auth-token", creatorAuthToken)
      .send(nameUpdate)
      .expect(200);

    // Check updated name in response
    expect(response.body.data).toHaveProperty("name", nameUpdate.name);

    // Check other fields remain unchanged
    expect(response.body.data).toHaveProperty(
      "description",
      testCampaign.description,
    );
    expect(response.body.data).toHaveProperty(
      "goalAmount",
      testCampaign.goalAmount,
    );

    // Verify in database
    const updatedCampaign = await DonationCampaign.findById(campaignId);
    expect(updatedCampaign?.name).toBe(nameUpdate.name);
    expect(updatedCampaign?.description).toBe(testCampaign.description);
  });

  it("should successfully update the goal amount above the collected amount", async () => {
    const goalUpdate = { goalAmount: testCampaign.collectedAmount + 500 };

    const response = await request(app)
      .put(`/api/donation/campaign/${campaignId}`)
      .set("x-auth-token", creatorAuthToken)
      .send(goalUpdate)
      .expect(200);

    expect(response.body.data).toHaveProperty(
      "goalAmount",
      goalUpdate.goalAmount,
    );

    // Verify progress is calculated correctly
    const expectedProgress =
      (testCampaign.collectedAmount / goalUpdate.goalAmount) * 100;
    expect(response.body.data.progress).toBeCloseTo(expectedProgress, 1);
  });

  it("should successfully update a campaign with an empty image URL", async () => {
    const emptyImageUpdate = { image: "" };

    const response = await request(app)
      .put(`/api/donation/campaign/${campaignId}`)
      .set("x-auth-token", creatorAuthToken)
      .send(emptyImageUpdate)
      .expect(200);

    expect(response.body.data).toHaveProperty("image", "");

    // Verify in database
    const updatedCampaign = await DonationCampaign.findById(campaignId);
    expect(updatedCampaign?.image).toBe("");
  });

  // Authentication errors
  it("should return error when user is not authenticated", async () => {
    await request(app)
      .put(`/api/donation/campaign/${campaignId}`)
      .send(validUpdates)
      .expect(401)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body.message).toContain("access denied");
      });
  });

  it("should return error when auth token is invalid", async () => {
    await request(app)
      .put(`/api/donation/campaign/${campaignId}`)
      .set("x-auth-token", "invalid-token")
      .send(validUpdates)
      .expect(401)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
      });
  });

  // Validation errors - Campaign ID
  it("should return error with invalid campaign ID format", async () => {
    await request(app)
      .put("/api/donation/campaign/invalid-id-format")
      .set("x-auth-token", creatorAuthToken)
      .send(validUpdates)
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "update-campaign-e2");
        expect(res.body.message).toContain("Invalid campaign ID format");
      });
  });

  it("should return error when campaign does not exist", async () => {
    const nonExistentId = String(new mongoose.Types.ObjectId());

    await request(app)
      .put(`/api/donation/campaign/${nonExistentId}`)
      .set("x-auth-token", creatorAuthToken)
      .send(validUpdates)
      .expect(404)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "update-campaign-e3");
        expect(res.body.message).toContain("Campaign not found");
      });
  });

  // Authorization errors
  it("should return error when user tries to update another user's campaign", async () => {
    await request(app)
      .put(`/api/donation/campaign/${campaignId}`)
      .set("x-auth-token", otherUserAuthToken)
      .send(validUpdates)
      .expect(403)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "update-campaign-e5");
        expect(res.body.message).toContain("not authorized");
      });

    // Verify campaign remains unchanged
    const unchangedCampaign = await DonationCampaign.findById(campaignId);
    expect(unchangedCampaign?.name).toBe(testCampaign.name);
  });

  // Validation errors - Input fields
  it("should return error when name is too short", async () => {
    const invalidNameUpdate = { name: "Hi" }; // Less than 5 chars

    await request(app)
      .put(`/api/donation/campaign/${campaignId}`)
      .set("x-auth-token", creatorAuthToken)
      .send(invalidNameUpdate)
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "update-campaign-e6");
      });
  });

  it("should return error when name is too long", async () => {
    const invalidNameUpdate = { name: "A".repeat(101) }; // More than 100 chars

    await request(app)
      .put(`/api/donation/campaign/${campaignId}`)
      .set("x-auth-token", creatorAuthToken)
      .send(invalidNameUpdate)
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "update-campaign-e6");
      });
  });

  it("should return error when description is too short", async () => {
    const invalidDescUpdate = { description: "Too short" }; // Less than 20 chars

    await request(app)
      .put(`/api/donation/campaign/${campaignId}`)
      .set("x-auth-token", creatorAuthToken)
      .send(invalidDescUpdate)
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "update-campaign-e7");
      });
  });

  it("should return error when description is too long", async () => {
    const invalidDescUpdate = { description: "A".repeat(2001) }; // More than 2000 chars

    await request(app)
      .put(`/api/donation/campaign/${campaignId}`)
      .set("x-auth-token", creatorAuthToken)
      .send(invalidDescUpdate)
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "update-campaign-e7");
      });
  });

  it("should return error when goal amount is invalid", async () => {
    // Test negative goal
    await request(app)
      .put(`/api/donation/campaign/${campaignId}`)
      .set("x-auth-token", creatorAuthToken)
      .send({ goalAmount: -100 })
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "update-campaign-e8");
      });

    // Test non-numeric goal
    await request(app)
      .put(`/api/donation/campaign/${campaignId}`)
      .set("x-auth-token", creatorAuthToken)
      .send({ goalAmount: "not-a-number" })
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "update-campaign-e8");
      });
  });

  it("should return error when goal amount is less than collected amount", async () => {
    const lowGoalUpdate = { goalAmount: testCampaign.collectedAmount - 10 };

    await request(app)
      .put(`/api/donation/campaign/${campaignId}`)
      .set("x-auth-token", creatorAuthToken)
      .send(lowGoalUpdate)
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "update-campaign-e9");
        expect(res.body.message).toContain(
          "Goal amount cannot be less than the already collected amount",
        );
      });
  });

  it("should return error when image URL is invalid", async () => {
    const invalidImageUpdate = { image: "invalid-url-format" };

    await request(app)
      .put(`/api/donation/campaign/${campaignId}`)
      .set("x-auth-token", creatorAuthToken)
      .send(invalidImageUpdate)
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "update-campaign-e11");
      });
  });

  it("should return error when no valid fields are provided", async () => {
    // Send empty update
    await request(app)
      .put(`/api/donation/campaign/${campaignId}`)
      .set("x-auth-token", creatorAuthToken)
      .send({})
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "update-campaign-e12");
        expect(res.body.message).toContain("No valid fields to update");
      });
  });

  // Error handling
  it("should handle server errors gracefully", async () => {
    // Mock findByIdAndUpdate to throw an error
    const originalFindByIdAndUpdate = DonationCampaign.findByIdAndUpdate;
    DonationCampaign.findByIdAndUpdate = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("Simulated database error");
      });

    await request(app)
      .put(`/api/donation/campaign/${campaignId}`)
      .set("x-auth-token", creatorAuthToken)
      .send(validUpdates)
      .expect(500)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "update-campaign-e13");
        expect(res.body.message).toContain("Server error");
      });

    // Restore the original function
    DonationCampaign.findByIdAndUpdate = originalFindByIdAndUpdate;
  });

  it("should handle non-existent user gracefully", async () => {
    // Create token with non-existent user ID
    const fakeUserId = String(new mongoose.Types.ObjectId());
    const fakeUserUid = uuidv4();
    const fakeToken = jwt.sign(
      {
        user: {
          id: fakeUserId,
          uid: fakeUserUid,
          email: "fake@example.com",
        },
      },
      process.env.JWT_SECRET || "test-jwt-secret",
      { expiresIn: "1h" },
    );

    await request(app)
      .put(`/api/donation/campaign/${campaignId}`)
      .set("x-auth-token", fakeToken)
      .send(validUpdates)
      .expect(404)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "update-campaign-e4");
        expect(res.body.message).toContain("User not found");
      });
  });
});
