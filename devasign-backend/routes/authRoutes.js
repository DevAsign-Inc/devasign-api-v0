const express = require('express');
const { check } = require('express-validator');
const validators = require('../middleware/customValidators');
const {
  getMe,
  logout,
  initWalletAuth,
  verifyWalletAuth,
  updateProfile
} = require('../controllers/authController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { checkValidation } = require('../utils/validators');

// Wallet authentication routes
router.post(
  '/init',
  [
    check('stellarAddress', 'Valid Stellar address is required').custom(validators.isStellarAddress)
  ],
  checkValidation,
  initWalletAuth
);

router.post(
  '/verify',
  [
    check('stellarAddress', 'Valid Stellar address is required').custom(validators.isStellarAddress),
    check('signature', 'Valid signature is required').custom(validators.isValidSignature)
  ],
  checkValidation,
  verifyWalletAuth
);

// User profile routes
router.put(
  '/profile',
  protect,
  [
    check('name', 'Name should be less than 50 characters').optional().isLength({ max: 50 }),
    check('profileImage', 'Profile image must be a valid URL').optional().isURL()
  ],
  checkValidation,
  updateProfile
);

// Smart contract integration routes
router.post(
  '/contract/auth',
  protect,
  [
    check('contractId', 'Valid contract ID is required').custom(validators.isContractId),
    check('functionName', 'Function name is required').not().isEmpty()
  ],
  checkValidation,
  (req, res) => {
    const { contractId, functionName } = req.body;
    const stellarAddress = req.user.stellarAddress; // Get from authenticated user
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

// User profile routes
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

module.exports = router;