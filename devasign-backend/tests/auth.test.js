const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const { connectTestDB, closeTestDB } = require('../config/testDb');
const authRoutes = require('../routes/authRoutes');
const User = require('../models/User');

// Create an Express app for testing
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

// Test suite for authentication endpoints
describe('Authentication Endpoints', () => {
  // Connect to the in-memory database before all tests
  beforeAll(async () => {
    await connectTestDB();
  });

  // Clear the database before each test
  beforeEach(async () => {
    await User.deleteMany({});
  });

  // Close the database after all tests
  afterAll(async () => {
    await closeTestDB();
  });

  // Test user registration
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });
  });

  // Test user login
  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
    });

    it('should login a user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // Test protected route
  describe('GET /api/v1/auth/me', () => {
    let token;

    beforeEach(async () => {
      // Register and login a user to get the token
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      token = res.body.token;
    });

    it('should access protected route with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('email', 'test@example.com');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });
});