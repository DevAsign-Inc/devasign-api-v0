const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Create express app
const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Set security headers
app.use(helmet());

// Route files
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const apiDocs = require('./routes/apiDocs');

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/docs', apiDocs);

// Basic route for API info
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'DevAsign Project Manager API',
    version: '1.0.0',
    docs: '/api/docs'
  });
});

// Error handler middleware
app.use(errorHandler);

// Connect to database when not in test mode
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const PORT = process.env.PORT || 5000;

// Only listen directly when not in Vercel (development mode)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => 
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
  );
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  // In Vercel, we don't need to close the server
});

// Export app for Vercel serverless function
module.exports = app;