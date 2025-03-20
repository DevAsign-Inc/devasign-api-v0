const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Route files
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const apiDocs = require('./routes/apiDocs');

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Set security headers
app.use(helmet());

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

// For debugging routes
app.get('/debug/routes', (req, res) => {
  const routes = [];

  // Extract routes from the Express app
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const path = handler.route.path;
          routes.push({
            path: middleware.regexp.toString().includes('/api/v1/auth') 
              ? `/api/v1/auth${path}` 
              : middleware.regexp.toString().includes('/api/docs')
              ? `/api/docs${path}`
              : path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });

  res.json({ routes });
});

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Memory Server and start the application
const startServer = async () => {
  try {
    // Create an in-memory MongoDB instance
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect Mongoose to the MongoDB Memory Server
    await mongoose.connect(mongoUri);
    console.log('Connected to in-memory MongoDB');

    // Start server
    const server = app.listen(
      PORT,
      console.log(`Test server running on port ${PORT}`)
    );

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      console.log(`Error: ${err.message}`);
      // Close server & exit process
      server.close(() => process.exit(1));
    });

    console.log('Server is ready for Postman testing');
  } catch (error) {
    console.error('Server error:', error);
  }
};

// Start the server
startServer();