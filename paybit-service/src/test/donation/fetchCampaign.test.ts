import request from "supertest";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import app from "../../app";
import DonationCampaign from "../../db/donation";
import User from "../../db/user";
import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";

// Test user data
const testUser = {
  fullname: "Fetch Test User",
  email: "fetch.test@example.com",
  password: "Fetch@123",
  uid: uuidv4(),
};

// Test campaigns data
const testCampaigns = [
  {
    name: "High Goal Campaign",
    description:
      "This is a campaign with a high goal amount for testing sorting and filtering.",
    creatorUid: testUser.uid,
    goalAmount: 10000,
    collectedAmount: 2000,

    image: "https://example.com/high-goal.jpg",
  },
  {
    name: "Low Goal Campaign",
    description:
      "This is a campaign with a low goal amount for testing sorting and filtering.",
    creatorUid: testUser.uid,
    goalAmount: 500,
    collectedAmount: 250,
    image: "https://example.com/low-goal.jpg",
  },
  {
    name: "Newest Campaign",
    description:
      "This campaign is created with a more recent timestamp for sorting testing.",
    creatorUid: testUser.uid,
    goalAmount: 1500,
    collectedAmount: 300,
    image: "https://example.com/newest.jpg",
  },
  {
    name: "Oldest Campaign",
    description:
      "This campaign is created with an older timestamp for sorting testing.",
    creatorUid: testUser.uid,
    goalAmount: 1500,
    collectedAmount: 600,
    image: "https://example.com/oldest.jpg",
  },
  {
    name: "High Progress Campaign",
    description:
      "This campaign has a high progress percentage for testing progress sorting.",
    creatorUid: testUser.uid,
    goalAmount: 1000,
    collectedAmount: 900,
    image: "https://example.com/high-progress.jpg",
  },
  {
    name: "Special Search Term Campaign",
    description:
      "This campaign contains a unique term - UNIQUESEARCHTERM - for testing search.",
    creatorUid: testUser.uid,
    goalAmount: 2000,
    collectedAmount: 100,
    image: "https://example.com/search.jpg",
  },
];

// Global variables for tests
let campaignIds: string[] = [];
let otherUserUid: string;
let otherUserCampaignId: string;

// Setup before all tests
beforeAll(async () => {
  // Clear existing test data
  await DonationCampaign.deleteMany({
    $or: [
      { creatorUid: testUser.uid },
      { name: { $in: testCampaigns.map((c) => c.name) } },
    ],
  });

  // Create user in database if needed for related data
  const existingUser = await User.findOne({ email: testUser.email });
  if (!existingUser) {
    await User.create({
      fullname: testUser.fullname,
      email: testUser.email,
      password: "hashedpassword",
      uid: testUser.uid,
      profileImage: "",
    });
  }

  // Create other user for testing creator filtering
  otherUserUid = uuidv4();

  // Create test campaigns with specific timestamps
  // First, create the "oldest" campaign with an older date
  const oldDate = new Date();
  oldDate.setMonth(oldDate.getMonth() - 2);
  const oldestCampaign = await DonationCampaign.create({
    ...testCampaigns[3], // Oldest Campaign
    createdAt: oldDate,
  });
  campaignIds.push(String(oldestCampaign._id));

  // Create campaigns 0, 1, 4, 5 with default current timestamps
  for (const campaign of [
    testCampaigns[0],
    testCampaigns[1],
    testCampaigns[4],
    testCampaigns[5],
  ]) {
    const createdCampaign = await DonationCampaign.create(campaign);
    campaignIds.push(String(createdCampaign._id));
  }

  // Create the "newest" campaign
  const newestCampaign = await DonationCampaign.create(testCampaigns[2]); // Newest Campaign
  campaignIds.push(String(newestCampaign._id));

  // Create a campaign by another user for testing creator filtering
  const otherUserCampaign = await DonationCampaign.create({
    name: "Other User Campaign",
    description:
      "This campaign is created by another user for testing creator filtering.",
    creatorUid: otherUserUid,
    goalAmount: 3000,
    collectedAmount: 150,
    image: "https://example.com/other.jpg",
  });
  otherUserCampaignId = String(otherUserCampaign._id);
});

// Clean up after all tests
afterAll(async () => {
  // Clean up test campaigns
  await DonationCampaign.deleteMany({
    $or: [
      { creatorUid: testUser.uid },
      { creatorUid: otherUserUid },
      { name: { $in: testCampaigns.map((c) => c.name) } },
    ],
  });
});

describe("Donation - Fetch Campaign Controller", () => {
  // Test fetching a single campaign by ID
  it("should fetch a single campaign by ID", async () => {
    const response = await request(app)
      .get(`/api/donation/campaign/${campaignIds[0]}`)
      .expect(200);

    // Check response structure
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty(
      "message",
      "Campaign retrieved successfully",
    );
    expect(response.body).toHaveProperty("data");

    // Verify campaign data
    const { data } = response.body;
    expect(data).toHaveProperty("_id", campaignIds[0]);
    expect(data).toHaveProperty("name");
    expect(data).toHaveProperty("description");
    expect(data).toHaveProperty("creatorUid");
    expect(data).toHaveProperty("goalAmount");
    expect(data).toHaveProperty("collectedAmount");
  });

  it("should return error for invalid campaign ID format", async () => {
    await request(app)
      .get("/api/donation/campaign/invalid-id-format")
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "fetch-campaign-e1");
      });
  });

  it("should return error when campaign does not exist", async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();

    await request(app)
      .get(`/api/donation/campaign/${nonExistentId}`)
      .expect(404)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "fetch-campaign-e2");
      });
  });

  // Test fetching multiple campaigns
  it("should fetch all campaigns with default pagination", async () => {
    const response = await request(app)
      .get("/api/donation/campaign")
      .expect(200);

    // Check response structure
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty(
      "message",
      "Campaigns retrieved successfully",
    );
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("campaigns");
    expect(response.body.data).toHaveProperty("pagination");

    // Check pagination info
    expect(response.body.data.pagination).toHaveProperty("total");
    expect(response.body.data.pagination).toHaveProperty("page", 1);
    expect(response.body.data.pagination).toHaveProperty("limit", 10);
    expect(response.body.data.pagination).toHaveProperty("pages");

    // Check campaigns array
    const { campaigns } = response.body.data;
    expect(Array.isArray(campaigns)).toBe(true);

    // Should include all our test campaigns plus the other user's campaign
    expect(campaigns.length).toBeGreaterThanOrEqual(testCampaigns.length);

    // Check campaign data structure
    const campaign = campaigns[0];
    expect(campaign).toHaveProperty("id");
    expect(campaign).toHaveProperty("name");
    expect(campaign).toHaveProperty("description");
    expect(campaign).toHaveProperty("creatorUid");
    expect(campaign).toHaveProperty("goalAmount");
    expect(campaign).toHaveProperty("collectedAmount");
    expect(campaign).toHaveProperty("progress");
    expect(campaign).toHaveProperty("image");
    expect(campaign).toHaveProperty("createdAt");
    expect(campaign).toHaveProperty("updatedAt");
  });

  // Test filtering by creator
  it("should filter campaigns by creator UID", async () => {
    const response = await request(app)
      .get(`/api/donation/campaign?creatorUid=${testUser.uid}`)
      .expect(200);

    const { campaigns } = response.body.data;

    // Should include only our test user's campaigns
    expect(campaigns.length).toBe(testCampaigns.length);

    // All campaigns should have the test user's UID
    campaigns.forEach((campaign: { creatorUid: any }) => {
      expect(campaign.creatorUid).toBe(testUser.uid);
    });

    // Should not include the other user's campaign
    const otherUserCampaignIncluded = campaigns.some(
      (c: { id: string }) => c.id === otherUserCampaignId,
    );
    expect(otherUserCampaignIncluded).toBe(false);
  });

  // Test search functionality
  it("should search campaigns by name or description", async () => {
    const response = await request(app)
      .get("/api/donation/campaign?search=UNIQUESEARCHTERM")
      .expect(200);

    const { campaigns } = response.body.data;

    // Should find only the campaign with the unique search term
    expect(campaigns.length).toBe(1);
    expect(campaigns[0].name).toBe("Special Search Term Campaign");
  });

  // Test goal amount filtering
  it("should filter campaigns by goal amount range", async () => {
    const response = await request(app)
      .get("/api/donation/campaign?minGoal=1000&maxGoal=5000")
      .expect(200);

    const { campaigns } = response.body.data;

    // Should include only campaigns with goal between 1000 and 5000
    campaigns.forEach((campaign: { goalAmount: any }) => {
      expect(campaign.goalAmount).toBeGreaterThanOrEqual(1000);
      expect(campaign.goalAmount).toBeLessThanOrEqual(5000);
    });

    // Should not include the low goal campaign (500)
    const lowGoalCampaignIncluded = campaigns.some(
      (c: { name: string }) => c.name === "Low Goal Campaign",
    );
    expect(lowGoalCampaignIncluded).toBe(false);

    // Should not include the high goal campaign (10000)
    const highGoalCampaignIncluded = campaigns.some(
      (c: { name: string }) => c.name === "High Goal Campaign",
    );
    expect(highGoalCampaignIncluded).toBe(false);
  });

  // Test sorting options
  it("should sort campaigns by newest first (default)", async () => {
    const response = await request(app)
      .get("/api/donation/campaign")
      .expect(200);

    const { campaigns } = response.body.data;

    // Check if campaigns are sorted by createdAt in descending order
    for (let i = 0; i < campaigns.length - 1; i++) {
      const current = new Date(campaigns[i].createdAt).getTime();
      const next = new Date(campaigns[i + 1].createdAt).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }

    // The newest campaign should be first or among the first
    const newestCampaignIndex = campaigns.findIndex(
      (c: { name: string }) => c.name === "Newest Campaign",
    );
    expect(newestCampaignIndex).toBeLessThanOrEqual(1);
  });

  it("should sort campaigns by oldest first", async () => {
    const response = await request(app)
      .get("/api/donation/campaign?sort=oldest")
      .expect(200);

    const { campaigns } = response.body.data;

    // Check if campaigns are sorted by createdAt in ascending order
    for (let i = 0; i < campaigns.length - 1; i++) {
      const current = new Date(campaigns[i].createdAt).getTime();
      const next = new Date(campaigns[i + 1].createdAt).getTime();
      expect(current).toBeLessThanOrEqual(next);
    }

    // The oldest campaign should be first
    const oldestCampaignIndex = campaigns.findIndex(
      (c: { name: string }) => c.name === "Oldest Campaign",
    );
    expect(oldestCampaignIndex).toBeLessThanOrEqual(1);
  });

  it("should sort campaigns by goal amount (high to low)", async () => {
    const response = await request(app)
      .get("/api/donation/campaign?sort=goal-high")
      .expect(200);

    const { campaigns } = response.body.data;

    // Check if campaigns are sorted by goalAmount in descending order
    for (let i = 0; i < campaigns.length - 1; i++) {
      expect(campaigns[i].goalAmount).toBeGreaterThanOrEqual(
        campaigns[i + 1].goalAmount,
      );
    }

    // The high goal campaign should be first
    expect(campaigns[0].name).toBe("High Goal Campaign");
  });

  it("should sort campaigns by progress percentage", async () => {
    const response = await request(app)
      .get("/api/donation/campaign?sort=progress")
      .expect(200);

    const { campaigns } = response.body.data;

    // Calculate and check progress sorting
    for (let i = 0; i < campaigns.length - 1; i++) {
      const currentProgress =
        campaigns[i].collectedAmount / campaigns[i].goalAmount;
      const nextProgress =
        campaigns[i + 1].collectedAmount / campaigns[i + 1].goalAmount;
      expect(currentProgress).toBeGreaterThanOrEqual(nextProgress);
    }

    // The high progress campaign should be first or among the first
    const highProgressIndex = campaigns.findIndex(
      (c: { name: string }) => c.name === "High Progress Campaign",
    );
    expect(highProgressIndex).toBeLessThanOrEqual(2);
  });

  // Test pagination
  it("should paginate results correctly", async () => {
    // Request first page with 2 items
    const firstPageResponse = await request(app)
      .get("/api/donation/campaign?page=1&limit=2")
      .expect(200);

    // Check pagination info
    expect(firstPageResponse.body.data.pagination).toHaveProperty("page", 1);
    expect(firstPageResponse.body.data.pagination).toHaveProperty("limit", 2);

    // Should have exactly 2 campaigns
    expect(firstPageResponse.body.data.campaigns.length).toBe(2);

    // Remember the IDs from first page
    const firstPageIds = firstPageResponse.body.data.campaigns.map(
      (c: { id: any }) => c.id,
    );

    // Request second page with 2 items
    const secondPageResponse = await request(app)
      .get("/api/donation/campaign?page=2&limit=2")
      .expect(200);

    // Check pagination info
    expect(secondPageResponse.body.data.pagination).toHaveProperty("page", 2);
    expect(secondPageResponse.body.data.pagination).toHaveProperty("limit", 2);

    // Should have exactly 2 campaigns
    expect(secondPageResponse.body.data.campaigns.length).toBe(2);

    // Second page IDs should be different from first page
    const secondPageIds = secondPageResponse.body.data.campaigns.map(
      (c: { id: any }) => c.id,
    );

    // No campaign should appear on both pages
    const overlap = firstPageIds.filter((id: any) =>
      secondPageIds.includes(id),
    );
    expect(overlap.length).toBe(0);
  });

  // Test combination of filters
  it("should apply multiple filters together", async () => {
    const response = await request(app)
      .get(
        `/api/donation/campaign?creatorUid=${testUser.uid}&minGoal=1000&sort=goal-low`,
      )
      .expect(200);

    const { campaigns } = response.body.data;

    // Should only include the test user's campaigns
    campaigns.forEach((campaign: { creatorUid: any }) => {
      expect(campaign.creatorUid).toBe(testUser.uid);
    });

    // Should only include campaigns with goalAmount >= 1000
    campaigns.forEach((campaign: { goalAmount: any }) => {
      expect(campaign.goalAmount).toBeGreaterThanOrEqual(1000);
    });

    // Should be sorted by goal amount (low to high)
    for (let i = 0; i < campaigns.length - 1; i++) {
      expect(campaigns[i].goalAmount).toBeLessThanOrEqual(
        campaigns[i + 1].goalAmount,
      );
    }
  });

  // Test error handling
  it("should handle server errors gracefully", async () => {
    // Mock DonationCampaign.find to throw an error
    const originalFind = DonationCampaign.find;
    DonationCampaign.find = jest.fn().mockImplementationOnce(() => {
      throw new Error("Simulated database error");
    });

    await request(app)
      .get("/api/donation/campaign")
      .expect(500)
      .expect((res) => {
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("code", "fetch-campaign-e3");
      });

    // Restore the original function
    DonationCampaign.find = originalFind;
  });
});
