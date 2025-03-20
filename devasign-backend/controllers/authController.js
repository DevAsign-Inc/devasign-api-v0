const User = require('../models/User');
const { validationResult } = require('express-validator');
const walletAuth = require('../utils/walletAuth');

// @desc    Register user with email/password
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user with email/password
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Initialize wallet authentication by returning a nonce
// @route   POST /api/v1/auth/wallet/init
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
      // Create new user with only Stellar address
      user = await User.create({
        stellarAddress,
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
// @route   POST /api/v1/auth/wallet/verify
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

    // Generate a new nonce for next login
    user.generateNonce();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Connect wallet to existing account
// @route   POST /api/v1/auth/wallet/connect
// @access  Private
exports.connectWallet = async (req, res, next) => {
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

    // Check if wallet is already connected to another account
    const existingWallet = await User.findOne({ stellarAddress });
    if (existingWallet) {
      return res.status(400).json({
        success: false,
        error: 'Stellar address is already connected to another account'
      });
    }

    // Update user with Stellar address
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { stellarAddress },
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

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {}
  });
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token
  });
};