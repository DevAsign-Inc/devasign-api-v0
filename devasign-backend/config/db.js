const mongoose = require('mongoose');

let cachedDb = null;

const connectDB = async () => {
  if (cachedDb) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    cachedDb = conn;
    return cachedDb;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // For production, we don't want to try connecting to local MongoDB
    // as that won't work in Vercel's environment
    if (process.env.NODE_ENV === 'production') {
      console.error('Cannot connect to MongoDB in production environment');
      process.exit(1);
    } else {
      // Only try local connection in development
      try {
        console.log('Attempting to connect to local MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/devasign', {
          serverSelectionTimeoutMS: 5000,
        });
        console.log('Connected to local MongoDB');
        cachedDb = mongoose.connection;
        return cachedDb;
      } catch (localError) {
        console.error(`Error connecting to local MongoDB: ${localError.message}`);
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;