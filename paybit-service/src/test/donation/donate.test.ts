import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import app from '../../app';
import User from '../../db/user';
import DonationCampaign from '../../db/donation';
import * as transferService from '../../services/transferFunds';
import { beforeAll, afterAll, afterEach, describe, it, expect, jest } from '@jest/globals';

// Mock the transfer service
jest.mock('../../services/transferFunds', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(async (senderId, receiverId, amount) => {
        // Simulate insufficient funds for large amounts
        if ((amount as number) > 1000) {
            throw new Error('Insufficient funds for transfer');
        }
        return true;
    })
}));

// Test users data
const donor = {
    fullname: 'Donation Test Donor',
    email: 'donation.donor@example.com',
    password: 'Donor@123',
    uid: uuidv4()
};

const creator = {
    fullname: 'Donation Test Creator',
    email: 'donation.creator@example.com',
    password: 'Creator@123',
    uid: uuidv4()
};

// Test campaign data
const testCampaign = {
    name: 'Test Donation Campaign',
    description: 'This campaign is created specifically for testing donations. The description is long enough to meet requirements.',
    goalAmount: 1000,
    collectedAmount: 200,
    image: 'https://example.com/test-donation-image.jpg'
};

// Global variables for tests
let donorId: string;
let donorAuthToken: string;
let creatorId: string;
let campaignId: string;

// Setup before all tests
beforeAll(async () => {
    // Clear existing test data
    await User.deleteMany({ email: { $in: [donor.email, creator.email] } });
    await DonationCampaign.deleteMany({ name: testCampaign.name });

    // Create test users
    const salt = await bcrypt.genSalt(10);

    // Create donor user
    const hashedDonorPassword = await bcrypt.hash(donor.password, salt);
    const donorUser = await User.create({
        fullname: donor.fullname,
        email: donor.email,
        password: hashedDonorPassword,
        uid: donor.uid,
        profileImage: ''
    });
    donorId = String(donorUser._id);

    // Create campaign creator user
    const hashedCreatorPassword = await bcrypt.hash(creator.password, salt);
    const creatorUser = await User.create({
        fullname: creator.fullname,
        email: creator.email,
        password: hashedCreatorPassword,
        uid: creator.uid,
        profileImage: ''
    });
    creatorId = String(creatorUser._id);

    // Generate JWT token for donor
    const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret';

    donorAuthToken = jwt.sign(
        {
            user: {
                id: donorId,
                uid: donor.uid,
                email: donor.email
            }
        },
        jwtSecret,
        { expiresIn: '1h' }
    );

    // Create test campaign
    const campaign = await DonationCampaign.create({
        ...testCampaign,
        creatorUid: creator.uid
    });

    campaignId = String(campaign._id);
});

// Reset mocks after each test
afterEach(() => {
    jest.clearAllMocks();
});

// Clean up after all tests
afterAll(async () => {
    await User.deleteMany({ email: { $in: [donor.email, creator.email] } });
    await DonationCampaign.deleteMany({ name: testCampaign.name });
});

describe('Donation - Donate Controller', () => {
    // Success case
    it('should successfully process a donation', async () => {
        const donationAmount = 50;

        const response = await request(app)
            .post(`/api/donation/donate/${campaignId}`)
            .set('x-auth-token', donorAuthToken)
            .send({ amount: donationAmount })
            .expect(200);

        // Check response structure
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Donation successful');
        expect(response.body).toHaveProperty('data');

        // Check data fields
        const { data } = response.body;
        expect(data).toHaveProperty('campaignId');
        expect(data).toHaveProperty('campaignName', testCampaign.name);
        expect(data).toHaveProperty('donationAmount', donationAmount);
        expect(data).toHaveProperty('donorName', donor.fullname);
        expect(data).toHaveProperty('newTotal', testCampaign.collectedAmount + donationAmount);
        expect(data).toHaveProperty('progress');
        expect(data).toHaveProperty('isComplete');

        // Verify transfer function was called with correct parameters
        expect(transferService.default).toHaveBeenCalledWith(
            donorId,
            creatorId,
            donationAmount,
            "Test Donation Campaign",
            "donation"
        );

        // Verify the campaign was actually updated in the database
        const updatedCampaign = await DonationCampaign.findById(campaignId);
        expect(updatedCampaign).toBeTruthy();
        expect(updatedCampaign?.collectedAmount).toBe(testCampaign.collectedAmount + donationAmount);
    });

    // Authentication errors
    it('should return error when user is not authenticated', async () => {
        await request(app)
            .post(`/api/donation/donate/${campaignId}`)
            .send({ amount: 50 })
            .expect(401)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body.message).toContain('access denied');
            });

        // Verify transfer function was not called
        expect(transferService.default).not.toHaveBeenCalled();
    });

    it('should return error when auth token is invalid', async () => {
        await request(app)
            .post(`/api/donation/donate/${campaignId}`)
            .set('x-auth-token', 'invalid-token')
            .send({ amount: 50 })
            .expect(401)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
            });

        // Verify transfer function was not called
        expect(transferService.default).not.toHaveBeenCalled();
    });

    // Validation errors - Campaign ID
    it('should return error with invalid campaign ID format', async () => {
        await request(app)
            .post('/api/donation/donate/invalid-id-format')
            .set('x-auth-token', donorAuthToken)
            .send({ amount: 50 })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donate-e2');
                expect(res.body.message).toContain('Invalid campaign ID format');
            });

        // Verify transfer function was not called
        expect(transferService.default).not.toHaveBeenCalled();
    });

    it('should return error when campaign does not exist', async () => {
        const nonExistentId = String(new mongoose.Types.ObjectId());

        await request(app)
            .post(`/api/donation/donate/${nonExistentId}`)
            .set('x-auth-token', donorAuthToken)
            .send({ amount: 50 })
            .expect(404)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donate-e6');
                expect(res.body.message).toContain('Campaign not found');
            });

        // Verify transfer function was not called
        expect(transferService.default).not.toHaveBeenCalled();
    });

    // Validation errors - Amount
    it('should return error when donation amount is missing', async () => {
        await request(app)
            .post(`/api/donation/donate/${campaignId}`)
            .set('x-auth-token', donorAuthToken)
            .send({})
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donate-e3');
            });

        // Verify transfer function was not called
        expect(transferService.default).not.toHaveBeenCalled();
    });

    it('should return error when donation amount is negative', async () => {
        await request(app)
            .post(`/api/donation/donate/${campaignId}`)
            .set('x-auth-token', donorAuthToken)
            .send({ amount: -50 })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donate-e3');
            });

        // Verify transfer function was not called
        expect(transferService.default).not.toHaveBeenCalled();
    });

    it('should return error when donation amount is zero', async () => {
        await request(app)
            .post(`/api/donation/donate/${campaignId}`)
            .set('x-auth-token', donorAuthToken)
            .send({ amount: 0 })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donate-e3');
            });

        // Verify transfer function was not called
        expect(transferService.default).not.toHaveBeenCalled();
    });

    it('should return error when donation amount is less than minimum', async () => {
        await request(app)
            .post(`/api/donation/donate/${campaignId}`)
            .set('x-auth-token', donorAuthToken)
            .send({ amount: 0.5 })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donate-e4');
                expect(res.body.message).toContain('Minimum donation amount is 1');
            });

        // Verify transfer function was not called
        expect(transferService.default).not.toHaveBeenCalled();
    });

    it('should return error when donation amount is not a number', async () => {
        await request(app)
            .post(`/api/donation/donate/${campaignId}`)
            .set('x-auth-token', donorAuthToken)
            .send({ amount: 'not-a-number' })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donate-e3');
            });

        // Verify transfer function was not called
        expect(transferService.default).not.toHaveBeenCalled();
    });

    // Self-donation check
    it('should return error when donating to own campaign', async () => {
        // Create a campaign for the donor
        const ownCampaign = await DonationCampaign.create({
            name: 'Own Campaign',
            description: 'This is a campaign created by the donor to test self-donation prevention.',
            creatorUid: donor.uid,
            goalAmount: 1000,
            collectedAmount: 0,
            image: ''
        });

        await request(app)
            .post(`/api/donation/donate/${ownCampaign._id}`)
            .set('x-auth-token', donorAuthToken)
            .send({ amount: 50 })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donate-e8');
                expect(res.body.message).toContain('You cannot donate to your own campaign');
            });

        // Verify transfer function was not called
        expect(transferService.default).not.toHaveBeenCalled();

        // Clean up
        await DonationCampaign.findByIdAndDelete(ownCampaign._id);
    });

    // Edge cases
    it('should handle non-existent donor', async () => {
        // Create token with non-existent user ID
        const fakeUserId = String(new mongoose.Types.ObjectId());
        const fakeToken = jwt.sign(
            {
                user: {
                    id: fakeUserId,
                    uid: uuidv4(),
                    email: 'fake@example.com'
                }
            },
            process.env.JWT_SECRET || 'test-jwt-secret',
            { expiresIn: '1h' }
        );

        await request(app)
            .post(`/api/donation/donate/${campaignId}`)
            .set('x-auth-token', fakeToken)
            .send({ amount: 50 })
            .expect(404)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donate-e5');
                expect(res.body.message).toContain('Donor user not found');
            });

        // Verify transfer function was not called
        expect(transferService.default).not.toHaveBeenCalled();
    });

    it('should handle non-existent campaign creator', async () => {
        // Create a campaign with a non-existent creator UID
        const nonExistentCreatorCampaign = await DonationCampaign.create({
            name: 'No Creator Campaign',
            description: 'This campaign has a non-existent creator UID to test error handling.',
            creatorUid: 'non-existent-creator-uid',
            goalAmount: 1000,
            collectedAmount: 0,
            image: ''
        });

        await request(app)
            .post(`/api/donation/donate/${nonExistentCreatorCampaign._id}`)
            .set('x-auth-token', donorAuthToken)
            .send({ amount: 50 })
            .expect(404)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donate-e7');
                expect(res.body.message).toContain('Campaign creator not found');
            });

        // Verify transfer function was not called
        expect(transferService.default).not.toHaveBeenCalled();

        // Clean up
        await DonationCampaign.findByIdAndDelete(nonExistentCreatorCampaign._id);
    });

    // Server errors
    it('should handle unexpected server errors', async () => {
        // Mock DonationCampaign.findById to throw an error
        const originalFindById = DonationCampaign.findById;
        DonationCampaign.findById = jest.fn().mockImplementationOnce(() => {
            throw new Error('Simulated database error');
        }) as jest.Mock as any;

        await request(app)
            .post(`/api/donation/donate/${campaignId}`)
            .set('x-auth-token', donorAuthToken)
            .send({ amount: 50 })
            .expect(500)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donate-e10');
                expect(res.body.message).toContain('Server error');
            });

        // Verify transfer function was not called
        expect(transferService.default).not.toHaveBeenCalled();

        // Restore the original function
        DonationCampaign.findById = originalFindById;
    });

    // Progress and completion
    it('should correctly calculate progress and completion status', async () => {
        // Create a campaign close to completion
        const almostCompleteCampaign = await DonationCampaign.create({
            name: 'Almost Complete Campaign',
            description: 'This campaign is already almost at its goal to test completion logic.',
            creatorUid: creator.uid,
            goalAmount: 100,
            collectedAmount: 90,
            image: ''
        });

        // Donation that will complete the campaign
        const response = await request(app)
            .post(`/api/donation/donate/${almostCompleteCampaign._id}`)
            .set('x-auth-token', donorAuthToken)
            .send({ amount: 20 })
            .expect(200);

        // Check progress and completion status
        expect(response.body.data).toHaveProperty('newTotal', 110);
        expect(response.body.data).toHaveProperty('progress', 100); // Should cap at 100%
        expect(response.body.data).toHaveProperty('isComplete', true);

        // Clean up
        await DonationCampaign.findByIdAndDelete(almostCompleteCampaign._id);
    });
});