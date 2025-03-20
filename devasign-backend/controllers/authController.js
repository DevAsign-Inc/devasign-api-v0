const User = require('../models/User');
const { validationResult } = require('express-validator');
const walletAuth = require('../utils/walletAuth');

// @desc    Initialize wallet authentication by returning a nonce
// @route   POST /api/v1/auth/init
// @access  Public
exports.initWalletAuth = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { stellarAddress } = req.body;

    if (!stellarAddress) {
      return res.status(400).json({
        success: false,
        error: 'Stellar address is required'
      });
    }

    // Validate Stellar address format
    if (!walletAuth.isValidStellarAddress(stellarAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Stellar address format'
      });
    }

    // Check if user exists with this wallet
    let user = await User.findOne({ stellarAddress });

    if (!user) {
      // Create new user with Stellar address
      user = await User.create({
        stellarAddress,
        name: `Wallet User ${stellarAddress.substring(0, 4)}...${stellarAddress.substring(stellarAddress.length - 4)}`,
        nonce: Math.floor(Math.random() * 1000000).toString()
      });
    } else {
      // Generate new nonce for existing user
      user.nonce = user.generateNonce();
      await user.save();
    }

    // Create the message to be signed
    const message = walletAuth.createSignatureMessage(stellarAddress, user.nonce);

    res.status(200).json({
      success: true,
      data: {
        message,
        nonce: user.nonce
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Authenticate with wallet signature
// @route   POST /api/v1/auth/verify
// @access  Public
exports.verifyWalletAuth = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { stellarAddress, signature } = req.body;

    if (!stellarAddress || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Stellar address and signature are required'
      });
    }

    // Find user by Stellar address
    const user = await User.findOne({ stellarAddress });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Stellar address'
      });
    }

    // Verify the signature
    const isValid = walletAuth.verifySignature(stellarAddress, user.nonce, signature);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Update last login timestamp
    user.updateLastLogin();
    
    // Generate a new nonce for next login
    user.generateNonce();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    // req.user is already set by the auth middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, profileImage } = req.body;
    
    // Only allow updating certain fields
    const updateData = {};
    if (name) updateData.name = name;
    if (profileImage) updateData.profileImage = profileImage;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Log user out / clear token on client
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // We don't need to do anything on the server for logout with JWT
    // The client just needs to remove the token
    
    res.status(200).json({
      success: true,
      message: 'Successfully logged out'
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  // Return user data and token
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      stellarAddress: user.stellarAddress,
      role: user.role
    }
  });
};