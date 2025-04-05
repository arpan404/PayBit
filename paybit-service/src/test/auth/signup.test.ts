import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import User from '../../db/user';
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';

// Test user data
const testUser = {
  fullname: 'Test User',
  email: 'test.user@example.com',
  password: 'Test@123456'
};

// Reset database before all tests
beforeAll(async () => {
  // Delete the test user if it exists
  await User.deleteOne({ email: testUser.email });
});

// Clean up after all tests
afterAll(async () => {
  // Delete the test user
  await User.deleteOne({ email: testUser.email });
  
  // Close the database connection
  await mongoose.connection.close();
});

describe('Auth - Signup Controller', () => {
  // Test successful signup
  it('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send(testUser)
      .expect(201);
    
    // Check response structure
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'User registered successfully');
    expect(response.body).toHaveProperty('data');
    
    // Verify user data in response
    expect(response.body.data).toHaveProperty('uid');
    expect(response.body.data).toHaveProperty('fullname', testUser.fullname);
    expect(response.body.data).toHaveProperty('email', testUser.email);
    expect(response.body.data).toHaveProperty('profileImage');
    expect(response.body.data).toHaveProperty('createdAt');
    
    // Ensure password is not returned
    expect(response.body.data).not.toHaveProperty('password');
    
    // Verify user was actually created in database
    const user = await User.findOne({ email: testUser.email });
    expect(user).toBeTruthy();
    expect(user?.fullname).toBe(testUser.fullname);
    expect(user?.email).toBe(testUser.email);
  });
  
  // Test missing required fields
  it('should return error when required fields are missing', async () => {
    // Test missing fullname
    await request(app)
      .post('/api/auth/signup')
      .send({ email: testUser.email, password: testUser.password })
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('code', 'signup-e1');
        expect(res.body).toHaveProperty('message', 'Missing required fields');
      });
    
    // Test missing email
    await request(app)
      .post('/api/auth/signup')
      .send({ fullname: testUser.fullname, password: testUser.password })
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('code', 'signup-e1');
      });
    
    // Test missing password
    await request(app)
      .post('/api/auth/signup')
      .send({ fullname: testUser.fullname, email: testUser.email })
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('code', 'signup-e1');
      });
  });
  
  // Test invalid email format
  it('should return error when email format is invalid', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({
        fullname: testUser.fullname,
        email: 'invalid-email',
        password: testUser.password
      })
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('code', 'signup-e2');
        expect(res.body).toHaveProperty('message', 'Invalid email format');
      });
  });
  
  // Test weak password
  it('should return error when password is weak', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({
        fullname: testUser.fullname,
        email: testUser.email,
        password: 'weak'
      })
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('code', 'signup-e3');
      });
  });
  
  // Test duplicate email
  it('should return error when email already exists', async () => {
    // First create a user
    await User.create({
      fullname: testUser.fullname,
      email: 'duplicate@example.com',
      password: 'hashedpassword', // In real test this would be hashed
      uid: 'test-uid'
    });
    
    // Try to create another user with the same email
    await request(app)
      .post('/api/auth/signup')
      .send({
        fullname: 'Another User',
        email: 'duplicate@example.com',
        password: testUser.password
      })
      .expect(409)
      .expect((res) => {
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('code', 'signup-e4');
        expect(res.body).toHaveProperty('message', 'User with this email already exists');
      });
    
    // Clean up the duplicate test user
    await User.deleteOne({ email: 'duplicate@example.com' });
  });
  
  // Test with optional profileImage
  it('should register user with a profile image if provided', async () => {
    const userWithImage = {
      ...testUser,
      email: 'user.with.image@example.com',
      profileImage: 'https://example.com/profile.jpg'
    };
    
    const response = await request(app)
      .post('/api/auth/signup')
      .send(userWithImage)
      .expect(201);
    
    expect(response.body.data).toHaveProperty('profileImage', userWithImage.profileImage);
    
    // Clean up
    await User.deleteOne({ email: userWithImage.email });
  });
});