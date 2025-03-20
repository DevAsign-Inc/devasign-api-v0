const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'DevAsign API Documentation',
    description: 'This API provides wallet-based authentication and project management endpoints',
    authEndpoints: [
      {
        name: 'Initialize Wallet Authentication',
        method: 'POST',
        url: '/api/v1/auth/init',
        description: 'Start wallet authentication process and receive a nonce to sign',
        body: { stellarAddress: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H' }
      },
      {
        name: 'Verify Wallet Signature',
        method: 'POST',
        url: '/api/v1/auth/verify',
        description: 'Complete wallet authentication by verifying signature',
        body: { 
          stellarAddress: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
          signature: 'Base64EncodedSignature===' 
        }
      },
      {
        name: 'Get Current User',
        method: 'GET',
        url: '/api/v1/auth/me',
        description: 'Get current authenticated user profile',
        headers: { Authorization: 'Bearer JWT_TOKEN' }
      },
      {
        name: 'Update User Profile',
        method: 'PUT',
        url: '/api/v1/auth/profile',
        description: 'Update user profile information',
        headers: { Authorization: 'Bearer JWT_TOKEN' },
        body: { name: 'Updated Name', profileImage: 'https://example.com/profile.jpg' }
      },
      {
        name: 'Logout',
        method: 'GET',
        url: '/api/v1/auth/logout',
        description: 'Logout current user (client should remove token)',
        headers: { Authorization: 'Bearer JWT_TOKEN' }
      }
    ],
    contractEndpoints: [
      {
        name: 'Contract Authentication',
        method: 'POST',
        url: '/api/v1/auth/contract/auth',
        description: 'Get authentication data for smart contract interaction',
        headers: { Authorization: 'Bearer JWT_TOKEN' },
        body: { contractId: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', functionName: 'createProject' }
      }
    ],
    note: 'All authentication is now wallet-based. Email/password authentication has been removed.'
  });
});

module.exports = router;