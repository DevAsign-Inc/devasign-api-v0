const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectTestDB = async () => {
  try {
    // Create a MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
    
    console.log('Connected to the in-memory database');
  } catch (error) {
    console.error(`Error connecting to test database: ${error.message}`);
    process.exit(1);
  }
};

const closeTestDB = async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    
    console.log('Closed in-memory database');
  } catch (error) {
    console.error(`Error closing test database: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectTestDB, closeTestDB };