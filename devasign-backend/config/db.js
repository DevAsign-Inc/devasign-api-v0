const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options help with connection stability
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // For testing purposes, we'll try a local MongoDB if the Atlas connection fails
    try {
      console.log('Attempting to connect to local MongoDB...');
      await mongoose.connect('mongodb://localhost:27017/devasign', {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('Connected to local MongoDB');
    } catch (localError) {
      console.error(`Error connecting to local MongoDB: ${localError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;