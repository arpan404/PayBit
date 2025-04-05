import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import app from "../../app";
import User from "../../db/user";
import DonationCampaign from "../../db/donation";
import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";

// Test users data
const creator = {
  fullname: "Campaign Creator",
  email: "campaign.creator@example.com",
  password: "Creator@123",
  uid: uuidv4(),
};

const otherUser = {
  fullname: "Other User",
  email: "other.user@example.com",
  password: "Other@123",
  uid: uuidv4(),
};


// Test campaign data
const testCampaign = {
  name: "Test Campaign for Deletion",
  description:
    "This campaign is created specifically to test the deletion functionality. It needs to be at least 20 characters long.",
  goalAmount: 1000,
  image: "https://example.com/test-image.jpg",
};

const campaignWithDonations = {
  name: "Campaign With Donations",
  description:
    "This campaign already has some donations and will test the deletion behavior for campaigns with collected funds.",
  goalAmount: 2000,
  collectedAmount: 500,
  image: "https://example.com/test-image2.jpg",
};

// Global variables for tests
let creatorAuthToken: string;
let creatorId: string;
let otherUserAuthToken: string;
let campaignId: string;
let campaignWithDonationsId: string;

// Setup before all tests
beforeAll(async () => {
  // Clear existing test data
  await User.deleteMany({ email: { $in: [creator.email, otherUser.email] } });
  await DonationCampaign.deleteMany({
    name: { $in: [testCampaign.name, campaignWithDonations.name] },
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

  // Create test campaigns
  // Regular campaign
  const campaign = await DonationCampaign.create({
    name: testCampaign.name,
    description: testCampaign.description,
    creatorUid: creator.uid,
    goalAmount: testCampaign.goalAmount,
    collectedAmount: 0,
    image: testCampaign.image,
  });
  campaignId = String(campaign._id);

  // Campaign with donations
  const campaignWithDonationsDoc = await DonationCampaign.create({
    name: campaignWithDonations.name,
    description: campaignWithDonations.description,
    creatorUid: creator.uid,
    goalAmount: campaignWithDonations.goalAmount,
    collectedAmount: campaignWithDonations.collectedAmount,
    image: campaignWithDonations.image,
  });
  campaignWithDonationsId = String(campaignWithDonationsDoc._id);
});

// Clean up after all tests
afterAll(async () => {
  await User.deleteMany({ email: { $in: [creator.email, otherUser.email] } });
  await DonationCampaign.deleteMany({
    name: { $in: [testCampaign.name, campaignWithDonations.name] },
  });
});

describe("Donation - Delete Campaign Controller", () => {
  it("should successfully delete a campaign created by the user", async () => {
    // Verify campaign exists before deletion
    const campaignBefore = await DonationCampaign.findById(campaignId);
    expect(campaignBefore).toBeTruthy();

    const response = await request(app)
      .delete(`/api/donation/campaign/${campaignId}`)
      .set("x-auth-token", creatorAuthToken)
      .expect(200);

    // Check response structure
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty(
      "message",
      "Campaign deleted successfully",
    );
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("id");
    expect(response.body.data).toHaveProperty("name", testCampaign.name);

    // Verify the campaign was actually deleted from the database
    const campaignAfter = await DonationCampaign.findById(campaignId);
    expect(campaignAfter).toBeNull();
  });

  it("should successfully delete a campaign that has donations", async () => {
    // Verify campaign exists before deletion
    const campaignBefore = await DonationCampaign.findById(
      campaignWithDonationsId,
    );
    expect(campaignBefore).toBeTruthy();
    expect(campaignBefore?.collectedAmount).toBe(
      campaignWithDonations.collectedAmount,
    );

    const response = await request(app)
      .delete(`/api/donation/campaign/${campaignWithDonationsId}`)
      .set("x-auth-token", creatorAuthToken)
      .expect(200);

    // Check response
    expect(response.body).toHaveProperty("success", true);

    // Verify the campaign was deleted
    const campaignAfter = await DonationCampaign.findById(
      campaignWithDonationsId,
    );
    expect(campaignAfter).toBeNull();
  });

  it("should return error when user is not authenticated", async () => {
    // Create a new campaign for this test
    const newCampaign = await DonationCampaign.create({
      name: "Campaign for Auth Test",
      description:
        "This campaign is used to test deletion without authentication.",
      creatorUid: creator.uid,
      goalAmount: 1000,
      collectedAmount: 0,
      image: "",
    });

    await request(app)
      .delete(`/api/donation/campaign/${newCampaign._id}`)
      .expect(401)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body.message).toContain("access denied");
      });

    // Clean up
    await DonationCampaign.findByIdAndDelete(newCampaign._id);
  });

  it("should return error when auth token is invalid", async () => {
    const nonExistentId = String(new mongoose.Types.ObjectId());

    await request(app)
      .delete(`/api/donation/campaign/${nonExistentId}`)
      .set("x-auth-token", "invalid-token")
      .expect(401)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
      });
  });

  it("should return error with invalid campaign ID format", async () => {
    await request(app)
      .delete("/api/donation/campaign/invalid-id-format")
      .set("x-auth-token", creatorAuthToken)
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "delete-campaign-e2");
        expect(res.body.message).toContain("Invalid campaign ID format");
      });
  });

  it("should return error when campaign does not exist", async () => {
    const nonExistentId = String(new mongoose.Types.ObjectId());

    await request(app)
      .delete(`/api/donation/campaign/${nonExistentId}`)
      .set("x-auth-token", creatorAuthToken)
      .expect(404)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "delete-campaign-e3");
        expect(res.body.message).toContain("Campaign not found");
      });
  });

  it("should return error when user tries to delete another user's campaign", async () => {
    // Create a new campaign by the creator
    const newCampaign = await DonationCampaign.create({
      name: "Campaign for Auth Test",
      description: "This campaign is used to test deletion authorization.",
      creatorUid: creator.uid,
      goalAmount: 1000,
      collectedAmount: 0,
      image: "",
    });

    // Try to delete using other user's token
    await request(app)
      .delete(`/api/donation/campaign/${newCampaign._id}`)
      .set("x-auth-token", otherUserAuthToken)
      .expect(403)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "delete-campaign-e5");
        expect(res.body.message).toContain("not authorized");
      });

    // Verify campaign still exists
    const campaignAfter = await DonationCampaign.findById(newCampaign._id);
    expect(campaignAfter).toBeTruthy();

    // Clean up
    await DonationCampaign.findByIdAndDelete(newCampaign._id);
  });

  it("should handle server errors gracefully", async () => {
    // Create a new campaign for this test
    const errorTestCampaign = await DonationCampaign.create({
      name: "Error Test Campaign",
      description:
        "This campaign is used to test error handling during deletion.",
      creatorUid: creator.uid,
      goalAmount: 1000,
      collectedAmount: 0,
      image: "",
    });

    // Mock DonationCampaign.findByIdAndDelete to throw an error
    const originalFindByIdAndDelete = DonationCampaign.findByIdAndDelete;
    DonationCampaign.findByIdAndDelete = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("Simulated database error");
      });

    await request(app)
      .delete(`/api/donation/campaign/${errorTestCampaign._id}`)
      .set("x-auth-token", creatorAuthToken)
      .expect(500)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "delete-campaign-e6");
        expect(res.body.message).toContain("Server error");
      });

    // Restore the original function
    DonationCampaign.findByIdAndDelete = originalFindByIdAndDelete;

    // Clean up
    await DonationCampaign.findByIdAndDelete(errorTestCampaign._id);
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

    // Create a campaign that the fake user will try to delete
    const tempCampaign = await DonationCampaign.create({
      name: "Temp Test Campaign",
      description:
        "This is a temporary campaign for testing non-existent user deletion.",
      creatorUid: creator.uid, // Still owned by real creator
      goalAmount: 1000,
      collectedAmount: 0,
      image: "",
    });

    await request(app)
      .delete(`/api/donation/campaign/${tempCampaign._id}`)
      .set("x-auth-token", fakeToken)
      .expect(404)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "delete-campaign-e4");
        expect(res.body.message).toContain("User not found");
      });

    // Clean up
    await DonationCampaign.findByIdAndDelete(tempCampaign._id);
  });
});
