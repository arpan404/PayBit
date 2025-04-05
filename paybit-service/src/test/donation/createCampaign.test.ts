import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import app from '../../app';
import User from '../../db/user';
import DonationCampaign from '../../db/donation';
import { beforeAll, afterAll, beforeEach, describe, it, expect } from '@jest/globals';

const testUser = {
    fullname: 'Donation Test User',
    email: 'donation.test@example.com',
    password: 'Donation@123',
    uid: uuidv4()
};

const validCampaign = {
    name: 'Test Donation Campaign',
    description: 'This is a test donation campaign created for unit testing purposes. It includes a description that is long enough to meet the required minimum length.',
    goalAmount: 1000,
    image: 'https://example.com/test-image.jpg'
};

let authToken: string;
let userId: string;

beforeAll(async () => {
    await User.deleteMany({ email: testUser.email });
    await DonationCampaign.deleteMany({ name: validCampaign.name });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testUser.password, salt);

    const user = await User.create({
        fullname: testUser.fullname,
        email: testUser.email,
        password: hashedPassword,
        uid: testUser.uid,
        profileImage: ''
    });

    userId = String(user._id);

    const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret';
    authToken = jwt.sign(
        {
            user: {
                id: userId,
                uid: testUser.uid,
                email: testUser.email
            }
        },
        jwtSecret,
        { expiresIn: '1h' }
    );
});

afterAll(async () => {
    await User.deleteMany({ email: testUser.email });
    await DonationCampaign.deleteMany({ name: validCampaign.name });
});

beforeEach(async () => {
    await DonationCampaign.deleteMany({ creatorUid: testUser.uid });
});

describe('Donation - Create Campaign Controller', () => {
    it('should successfully create a donation campaign with valid data', async () => {
        const response = await request(app)
            .post('/api/donation/campaign')
            .set('x-auth-token', authToken)
            .send(validCampaign)
            .expect(201);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Donation campaign created successfully');
        expect(response.body).toHaveProperty('data');

        const { data } = response.body;
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('name', validCampaign.name);
        expect(data).toHaveProperty('description', validCampaign.description);
        expect(data).toHaveProperty('creatorUid', testUser.uid);
        expect(data).toHaveProperty('goalAmount', validCampaign.goalAmount);
        expect(data).toHaveProperty('collectedAmount', 0);
        expect(data).toHaveProperty('image', validCampaign.image);

        const savedCampaign = await DonationCampaign.findById(data.id);
        expect(savedCampaign).toBeTruthy();
        expect(savedCampaign?.name).toBe(validCampaign.name);
    });

    it('should successfully create a campaign without an image', async () => {
        const campaignWithoutImage = {
            name: 'Campaign Without Image',
            description: 'This is a test donation campaign without an image. The description is long enough to pass validation.',
            goalAmount: 500
        };

        const response = await request(app)
            .post('/api/donation/campaign')
            .set('x-auth-token', authToken)
            .send(campaignWithoutImage)
            .expect(201);

        expect(response.body.data).toHaveProperty('image', '');
    });

    it('should return error when user is not authenticated', async () => {
        await request(app)
            .post('/api/donation/campaign')
            .send(validCampaign)
            .expect(401)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'auth-e1');
            });
    });

    it('should return error when auth token is invalid', async () => {
        await request(app)
            .post('/api/donation/campaign')
            .set('x-auth-token', 'invalid-token')
            .send(validCampaign)
            .expect(401)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'auth-e3');
            });
    });

    it('should return error when required fields are missing', async () => {
        await request(app)
            .post('/api/donation/campaign')
            .set('x-auth-token', authToken)
            .send({
                description: validCampaign.description,
                goalAmount: validCampaign.goalAmount
            })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donation-e3');
            });

        await request(app)
            .post('/api/donation/campaign')
            .set('x-auth-token', authToken)
            .send({
                name: validCampaign.name,
                goalAmount: validCampaign.goalAmount
            })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donation-e3');
            });

        await request(app)
            .post('/api/donation/campaign')
            .set('x-auth-token', authToken)
            .send({
                name: validCampaign.name,
                description: validCampaign.description
            })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donation-e6');
            });
    });

    it('should return error when name is too short', async () => {
        await request(app)
            .post('/api/donation/campaign')
            .set('x-auth-token', authToken)
            .send({
                ...validCampaign,
                name: 'AB'
            })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donation-e4');
            });
    });

    it('should return error when name is too long', async () => {
        await request(app)
            .post('/api/donation/campaign')
            .set('x-auth-token', authToken)
            .send({
                ...validCampaign,
                name: 'A'.repeat(101)
            })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donation-e4');
            });
    });

    it('should return error when description is too short', async () => {
        await request(app)
            .post('/api/donation/campaign')
            .set('x-auth-token', authToken)
            .send({
                ...validCampaign,
                description: 'Too short'
            })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donation-e5');
            });
    });

    it('should return error when description is too long', async () => {
        await request(app)
            .post('/api/donation/campaign')
            .set('x-auth-token', authToken)
            .send({
                ...validCampaign,
                description: 'A'.repeat(2001)
            })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donation-e5');
            });
    });

    it('should return error when goal amount is invalid', async () => {
        await request(app)
            .post('/api/donation/campaign')
            .set('x-auth-token', authToken)
            .send({
                ...validCampaign,
                goalAmount: -100
            })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donation-e6');
            });

        await request(app)
            .post('/api/donation/campaign')
            .set('x-auth-token', authToken)
            .send({
                ...validCampaign,
                goalAmount: 0
            })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donation-e6');
            });

        await request(app)
            .post('/api/donation/campaign')
            .set('x-auth-token', authToken)
            .send({
                ...validCampaign,
                goalAmount: 'not-a-number'
            })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donation-e6');
            });
    });

    it('should return error when image URL is invalid', async () => {
        await request(app)
            .post('/api/donation/campaign')
            .set('x-auth-token', authToken)
            .send({
                ...validCampaign,
                image: 'invalid-url-without-protocol'
            })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donation-e7');
            });
    });

    it('should handle server errors gracefully', async () => {
        const originalSave = DonationCampaign.prototype.save;
        DonationCampaign.prototype.save = jest.fn().mockImplementationOnce(() => {
            throw new Error('Simulated database error');
        });

        await request(app)
            .post('/api/donation/campaign')
            .set('x-auth-token', authToken)
            .send(validCampaign)
            .expect(500)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donation-e8');
            });

        DonationCampaign.prototype.save = originalSave;
    });

    it('should not allow user with non-existent ID to create campaign', async () => {
        const fakeUserId = new mongoose.Types.ObjectId().toString();
        const fakeToken = jwt.sign(
            {
                user: {
                    id: fakeUserId,
                    uid: 'fake-uid',
                    email: 'fake@example.com'
                }
            },
            process.env.JWT_SECRET || 'test-jwt-secret',
            { expiresIn: '1h' }
        );

        await request(app)
            .post('/api/donation/campaign')
            .set('x-auth-token', fakeToken)
            .send(validCampaign)
            .expect(404)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('code', 'donation-e2');
            });
    });
});
