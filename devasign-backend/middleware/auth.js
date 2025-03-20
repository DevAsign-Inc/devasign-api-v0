const jwt = require('jsonwebtoken');
const User = require('../models/User');
const walletAuth = require('../utils/walletAuth');

// Protect routes using JWT
exports.protect = async (req, res, next) => {
  let token;

  // Check if auth header exists and has the right format
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extract token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please connect your wallet.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check for wallet address in the token
    if (!decoded.stellarAddress) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format. Please reconnect your wallet.'
      });
    }

    // Add user to request object
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found with this wallet address'
      });
    }

    // Verify that the wallet address in the token matches the one in the database
    if (req.user.stellarAddress !== decoded.stellarAddress) {
      return res.status(401).json({
        success: false,
        error: 'Token wallet address mismatch. Please reconnect your wallet.'
      });
    }

    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed. Please reconnect your wallet.'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    next();
  };
};