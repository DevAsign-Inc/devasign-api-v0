const { check } = require('express-validator');
const StellarSdk = require('stellar-sdk');
const walletAuth = require('../utils/walletAuth');

// Create a custom validator function for Stellar addresses
const isStellarAddress = (value) => {
  if (!value || typeof value !== 'string') {
    throw new Error('Stellar address must be a string');
  }
  
  // Check if the address starts with a G and is 56 characters long
  if (!value.startsWith('G') || value.length !== 56) {
    throw new Error('Invalid Stellar address format');
  }
  
  try {
    // Try to create a keypair from the address
    StellarSdk.Keypair.fromPublicKey(value);
    return true;
  } catch (error) {
    throw new Error('Invalid Stellar address');
  }
};

// Create a custom validator function for signatures
const isValidSignature = (value) => {
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
};

// Create a custom validator function for contract IDs
const isContractId = (value) => {
  try {
    // Contract IDs are 32-byte hex strings
    if (!/^[0-9a-fA-F]{64}$/.test(value)) {
      throw new Error('Invalid contract ID format');
    }
    return true;
  } catch (error) {
    throw new Error('Invalid contract ID');
  }
};

// Export the validators
module.exports = {
  isStellarAddress,
  isValidSignature,
  isContractId
};