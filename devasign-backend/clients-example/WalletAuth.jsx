import React, { useState, useEffect } from 'react';
import * as StellarSdk from 'stellar-sdk';
import { albedo } from '@albedo-link/intent';

const StellarWalletAuth = () => {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [signatureMessage, setSignatureMessage] = useState('');
  
  const API_URL = 'http://localhost:5000/api/v1';
  
  const connectWallet = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Use Albedo to connect to a Stellar wallet
      const result = await albedo.publicKey({
        title: 'DevAsign Authentication'
      });
      
      setAccount(result.pubkey);
    } catch (error) {
      console.error('Wallet connection error:', error);
      setError(error.message || 'Failed to connect Stellar wallet');
    } finally {
      setLoading(false);
    }
  };
  
  const authenticate = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!account) {
        throw new Error('Wallet not connected');
      }
      
      // Step 1: Initiate authentication and get nonce
      const initResponse = await fetch(`${API_URL}/auth/wallet/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stellarAddress: account })
      });
      
      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.error || 'Failed to initiate authentication');
      }
      
      const { data } = await initResponse.json();
      const { message, nonce } = data;
      setSignatureMessage(message);
      
      // Step 2: Sign the message with Albedo
      const signResult = await albedo.signMessage({
        message: message,
        pubkey: account
      });
      
      const signature = signResult.signature;
      
      // Step 3: Verify the signature
      const verifyResponse = await fetch(`${API_URL}/auth/wallet/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stellarAddress: account,
          signature
        })
      });
      
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Failed to verify signature');
      }
      
      const authData = await verifyResponse.json();
      
      // Store auth token for subsequent API calls
      setAuthToken(authData.token);
      
      alert('Successfully authenticated with Stellar wallet!');
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="wallet-auth-container">
      <h2>DevAsign Stellar Authentication</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {!account ? (
        <button 
          onClick={connectWallet} 
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Connect Stellar Wallet'}
        </button>
      ) : (
        <div className="wallet-info">
          <p>Connected Stellar Account: {account}</p>
          <button 
            onClick={authenticate} 
            disabled={loading || authToken}
          >
            {loading ? 'Authenticating...' : 'Authenticate with Stellar'}
          </button>
        </div>
      )}
      
      {authToken && (
        <div className="auth-success">
          <p>✅ Authenticated successfully!</p>
          <p className="token-info">
            JWT Token: {authToken.substring(0, 15)}...
          </p>
        </div>
      )}
      
      {signatureMessage && (
        <div className="signature-message">
          <h3>Message to Sign:</h3>
          <pre>{signatureMessage}</pre>
        </div>
      )}
      
      <div className="wallet-info-box">
        <h3>About Stellar Authentication</h3>
        <p>
          This example uses Albedo (albedo.link) to connect to your Stellar wallet. 
          Albedo is a browser-based interface for signing Stellar transactions.
        </p>
        <p>
          Other Stellar wallets like Lobstr, Solar, or Freighter can also be used
          with proper integration.
        </p>
      </div>
    </div>
  );
};

export default StellarWalletAuth;