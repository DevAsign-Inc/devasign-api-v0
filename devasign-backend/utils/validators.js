const { validationResult } = require('express-validator');
const StellarSdk = require('stellar-sdk');

// Middleware to check validation results
exports.checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Date validation helper
exports.isValidDate = (dateString) => {
  const regEx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regEx)) return false;  // Invalid format
  const d = new Date(dateString);
  const dNum = d.getTime();
  if (!dNum && dNum !== 0) return false; // NaN value, Invalid date
  return d.toISOString().slice(0, 10) === dateString;
};

// Email validation helper
exports.isValidEmail = (email) => {
  const regEx = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return regEx.test(email);
};

// Stellar address validation
exports.isValidStellarAddress = (address) => {
  try {
    // Check if the address starts with a G and is 56 characters long
    if (!address.startsWith('G') || address.length !== 56) {
      return false;
    }
    
    // Try to create a keypair from the address
    StellarSdk.Keypair.fromPublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};