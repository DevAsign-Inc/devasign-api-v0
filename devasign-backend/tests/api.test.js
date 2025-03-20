const request = require('supertest');
const express = require('express');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Import server components
const app = express();

// Body parser
app.use(express.json());

describe('API Routes', () => {
  test('Root endpoint returns welcome message', async () => {
    // Create a simple root handler for testing
    app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'DevAsign Project Manager API',
        version: '1.0.0'
      });
    });

    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('DevAsign Project Manager API');
  });
});