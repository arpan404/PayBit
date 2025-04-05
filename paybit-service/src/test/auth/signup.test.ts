import request from "supertest";
import mongoose from "mongoose";
import app from "../../app";
import User from "../../db/user";
import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";

const testUser = {
    fullname: "Test User",
    email: "test.user@example.com",
    password: "Test@123456",
};

beforeAll(async () => {
    await User.deleteOne({ email: testUser.email });
});

afterAll(async () => {
    await User.deleteOne({ email: testUser.email });
    await mongoose.connection.close();
});

describe("Auth - Signup Controller", () => {
    it("should register a new user successfully", async () => {
        const response = await request(app)
            .post("/api/auth/signup")
            .send(testUser)
            .expect(201);

        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("message", "User registered successfully");
        expect(response.body).toHaveProperty("data");

        expect(response.body.data.user).toHaveProperty("uid");
        expect(response.body.data.user).toHaveProperty("fullname", testUser.fullname);
        expect(response.body.data.user).toHaveProperty("email", testUser.email);
        expect(response.body.data.user).toHaveProperty("profileImage");

        expect(response.body.data).toHaveProperty("token");
        expect(typeof response.body.data.token).toBe("string");
        expect(response.body.data.token.length).toBeGreaterThan(0);

        expect(response.body.data.user).not.toHaveProperty("password");

        const user = await User.findOne({ email: testUser.email });
        expect(user).toBeTruthy();
        expect(user?.fullname).toBe(testUser.fullname);
        expect(user?.email).toBe(testUser.email);
    });

    it("should return error when required fields are missing", async () => {
        await request(app)
            .post("/api/auth/signup")
            .send({ email: testUser.email, password: testUser.password })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty("success", false);
                expect(res.body).toHaveProperty("code", "signup-e1");
                expect(res.body).toHaveProperty("message", "Missing required fields");
            });

        await request(app)
            .post("/api/auth/signup")
            .send({ fullname: testUser.fullname, password: testUser.password })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty("success", false);
                expect(res.body).toHaveProperty("code", "signup-e1");
            });

        await request(app)
            .post("/api/auth/signup")
            .send({ fullname: testUser.fullname, email: testUser.email })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty("success", false);
                expect(res.body).toHaveProperty("code", "signup-e1");
            });
    });

    it("should return error when email format is invalid", async () => {
        await request(app)
            .post("/api/auth/signup")
            .send({
                fullname: testUser.fullname,
                email: "invalid-email",
                password: testUser.password,
            })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty("success", false);
                expect(res.body).toHaveProperty("code", "signup-e2");
                expect(res.body).toHaveProperty("message", "Invalid email format");
            });
    });

    it("should return error when password is weak", async () => {
        await request(app)
            .post("/api/auth/signup")
            .send({
                fullname: testUser.fullname,
                email: testUser.email,
                password: "weak",
            })
            .expect(400)
            .expect((res) => {
                expect(res.body).toHaveProperty("success", false);
                expect(res.body).toHaveProperty("code", "signup-e3");
            });
    });

    it("should return error when email already exists", async () => {
        await User.create({
            fullname: testUser.fullname,
            email: "duplicate@example.com",
            password: "hashedpassword",
            uid: "test-uid",
        });

        await request(app)
            .post("/api/auth/signup")
            .send({
                fullname: "Another User",
                email: "duplicate@example.com",
                password: testUser.password,
            })
            .expect(409)
            .expect((res) => {
                expect(res.body).toHaveProperty("success", false);
                expect(res.body).toHaveProperty("code", "signup-e4");
                expect(res.body).toHaveProperty("message", "User with this email already exists");
            });

        await User.deleteOne({ email: "duplicate@example.com" });
    });

    it("should register user with a profile image if provided", async () => {
        const userWithImage = {
            fullname: "Image User",
            email: "user.with.image." + Date.now() + "@example.com",
            password: "TestProfile@123",
            profileImage: "https://example.com/profile.jpg",
        };

        const response = await request(app)
            .post("/api/auth/signup")
            .send(userWithImage)
            .expect(201);

        expect(response.body.data.user).toHaveProperty("profileImage", userWithImage.profileImage);

        await User.deleteOne({ email: userWithImage.email });
    });
});
