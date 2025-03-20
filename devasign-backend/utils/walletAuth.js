const StellarSdk = require('stellar-sdk');

/**
 * Verify a signed message using Stellar's ed25519 signatures
 * @param {string} stellarAddress - Stellar public key address
 * @param {string} nonce - The nonce that was signed
 * @param {string} signature - The XDR signature to verify (base64 encoded)
 * @returns {boolean} - Whether the signature is valid
 */
exports.verifySignature = (stellarAddress, nonce, signature) => {
  try {
    // Create the message that was signed
    const message = exports.createSignatureMessage(stellarAddress, nonce);
    const messageBuffer = Buffer.from(message);
    
    // Decode the XDR signature
    let keypair;
    try {
      keypair = StellarSdk.Keypair.fromPublicKey(stellarAddress);
    } catch (err) {
      console.error('Invalid Stellar public key:', err);
      return false;
    }
    
    // Decode the base64 signature
    let signatureBuffer;
    try {
      signatureBuffer = Buffer.from(signature, 'base64');
    } catch (err) {
      console.error('Invalid signature format:', err);
      return false;
    }
    
    // Verify the signature
    return keypair.verify(messageBuffer, signatureBuffer);
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

/**
 * Create a message to be signed by the Stellar wallet
 * @param {string} stellarAddress - Stellar address
 * @param {string} nonce - The nonce to include in the message
 * @returns {string} - The message to sign
 */
exports.createSignatureMessage = (stellarAddress, nonce) => {
  return `Welcome to DevAsign!\n\nClick to sign in and accept the Terms of Service.\n\nThis request will not trigger a blockchain transaction.\n\nStellar address:\n${stellarAddress}\n\nNonce:\n${nonce}`;
};

/**
 * Validate a Stellar address
 * @param {string} address - The Stellar address to validate
 * @returns {boolean} - Whether the address is a valid Stellar address
 */
exports.isValidStellarAddress = (address) => {
  try {
    // Check if the address starts with a G and is 56 characters long
    if (!address || typeof address !== 'string') {
      return false;
    }
    
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

/**
 * Get the signature verification parameters for Soroban contract integration
 * @param {string} stellarAddress - Stellar address
 * @param {string} nonce - The nonce to include
 * @returns {Object} - Parameters for contract verification
 */
exports.getContractAuthParams = (stellarAddress, nonce) => {
  return {
    address: stellarAddress,
    nonce: nonce,
    network: process.env.STELLAR_NETWORK || 'TESTNET'
  };
};

/**
 * Create auth data for Soroban contract calls
 * @param {string} stellarAddress - Stellar address
 * @param {string} contractId - Soroban contract ID
 * @param {string} functionName - Contract function to call
 * @returns {Object} - Auth data for contract interaction
 */
exports.createContractAuthData = (stellarAddress, contractId, functionName) => {
  try {
    if (!exports.isValidStellarAddress(stellarAddress)) {
      throw new Error('Invalid Stellar address');
    }
    
    if (!/^[0-9a-fA-F]{64}$/.test(contractId)) {
      throw new Error('Invalid contract ID format');
    }
    
    // This would be replaced with actual Soroban SDK auth code in production
    return {
      source: stellarAddress,
      contractId: contractId,
      function: functionName,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error creating contract auth data:', error);
    return null;
  }
};

/**
 * Helper function to create a standardized error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Error object
 */
exports.createErrorResponse = (message, statusCode = 400) => {
  return {
    success: false,
    error: message,
    statusCode: statusCode
  };
};