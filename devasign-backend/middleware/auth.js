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
      error: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user to request object
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found with this id'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// Protect routes with wallet authentication
exports.protectWallet = async (req, res, next) => {
  const { stellarAddress, signature, nonce } = req.body;

  if (!stellarAddress || !signature) {
    return res.status(401).json({
      success: false,
      error: 'Wallet authentication required'
    });
  }

  try {
    // Find user by Stellar address
    const user = await User.findOne({ stellarAddress });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Stellar address'
      });
    }

    // Verify the signature
    const message = nonce || user.nonce;
    const isValid = walletAuth.verifySignature(stellarAddress, message, signature);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Wallet auth error:', error);
    return res.status(401).json({
      success: false,
      error: 'Wallet authentication failed'
    });
  }
};

// Protect routes that require contract verification
exports.protectContract = async (req, res, next) => {
  const { stellarAddress, contractId, signature } = req.body;

  if (!stellarAddress || !contractId || !signature) {
    return res.status(401).json({
      success: false,
      error: 'Contract authentication required'
    });
  }

  try {
    // Find user by Stellar address
    const user = await User.findOne({ stellarAddress });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Stellar address'
      });
    }

    // In a real implementation, here we would verify the contract signature
    // using Soroban SDK. For now, we'll just check that the user exists.
    
    // Add user and contract to request object
    req.user = user;
    req.contract = {
      id: contractId,
      verified: true
    };
    
    next();
  } catch (error) {
    console.error('Contract auth error:', error);
    return res.status(401).json({
      success: false,
      error: 'Contract authentication failed'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};