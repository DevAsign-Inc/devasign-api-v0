// Basic test file to verify our testing environment
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

describe('Backend Testing Environment', () => {
  test('Environment variables are loaded correctly', () => {
    expect(process.env.PORT).toBeDefined();
    expect(process.env.MONGO_URI).toBeDefined();
    expect(process.env.JWT_SECRET).toBeDefined();
  });

  test('PORT is set to the expected value', () => {
    expect(process.env.PORT).toBe('5000');
  });
});