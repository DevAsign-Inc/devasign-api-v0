const express = require('express');
const check = require('../middleware/customValidators');
const {
  register,
  login,
  getMe,
  logout,
  initWalletAuth,
  verifyWalletAuth,
  connectWallet
} = require('../controllers/authController');

const router = express.Router();

const { protect } = require('../middleware/auth');
const { checkValidation } = require('../utils/validators');

// Email/password authentication routes (keeping for backward compatibility)
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  checkValidation,
  register
);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  checkValidation,
  login
);

// Crypto wallet authentication routes
router.post(
  '/wallet/init',
  [
    check('stellarAddress', 'Valid Stellar address is required').isStellarAddress()
  ],
  checkValidation,
  initWalletAuth
);

router.post(
  '/wallet/verify',
  [
    check('stellarAddress', 'Valid Stellar address is required').isStellarAddress(),
    check('signature', 'Valid signature is required').isValidSignature()
  ],
  checkValidation,
  verifyWalletAuth
);

// Connect wallet to existing account
router.post(
  '/wallet/connect',
  protect,
  [
    check('stellarAddress', 'Valid Stellar address is required').isStellarAddress()
  ],
  checkValidation,
  connectWallet
);

// Smart contract integration routes
router.post(
  '/wallet/contract/auth',
  [
    check('stellarAddress', 'Valid Stellar address is required').isStellarAddress(),
    check('contractId', 'Valid contract ID is required').isContractId(),
    check('functionName', 'Function name is required').not().isEmpty()
  ],
  checkValidation,
  (req, res) => {
    const { stellarAddress, contractId, functionName } = req.body;
    const walletAuth = require('../utils/walletAuth');
    
    const authData = walletAuth.createContractAuthData(
      stellarAddress, 
      contractId, 
      functionName
    );
    
    if (!authData) {
      return res.status(400).json(walletAuth.createErrorResponse('Failed to create contract auth data'));
    }
    
    res.status(200).json({
      success: true,
      data: authData
    });
  }
);

// Other auth routes
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

module.exports = router;