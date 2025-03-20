const { check } = require('express-validator');
const StellarSdk = require('stellar-sdk');
const walletAuth = require('../utils/walletAuth');

// Add custom validators to express-validator
check.prototype.isStellarAddress = function() {
  return this.custom(value => {
    if (!walletAuth.isValidStellarAddress(value)) {
      throw new Error('Invalid Stellar address format');
    }
    return true;
  });
};

// Add signature validator
check.prototype.isValidSignature = function() {
  return this.custom((value, { req }) => {
    if (!value || typeof value !== 'string') {
      throw new Error('Signature must be a non-empty string');
    }
    
    try {
      // Basic format check - signatures should be base64 encoded
      Buffer.from(value, 'base64');
      return true;
    } catch (error) {
      throw new Error('Invalid signature format');
    }
  });
};

// Add contract address validator for Soroban smart contracts
check.prototype.isContractId = function() {
  return this.custom(value => {
    try {
      // Contract IDs are 32-byte hex strings
      if (!/^[0-9a-fA-F]{64}$/.test(value)) {
        throw new Error('Invalid contract ID format');
      }
      return true;
    } catch (error) {
      throw new Error('Invalid contract ID');
    }
  });
};

module.exports = check;