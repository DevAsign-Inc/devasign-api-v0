import * as freighter from '@stellar/freighter-api';

/**
 * Utility functions for wallet interactions
 */

/**
 * Check if the Freighter wallet is connected
 */
export async function isWalletConnected(): Promise<boolean> {
  try {
    if (typeof freighter === 'undefined') {
      return false;
    }
    
    // Check if user has manually disconnected
    if (typeof window !== 'undefined' && localStorage.getItem('freighter_disconnected') === 'true') {
      return false;
    }
    
    // Use type assertion to bypass TypeScript checking
    const isConnectedResult = await freighter.isConnected();
    
    // Make sure we return a boolean - handle different API return types
    if (typeof isConnectedResult === 'boolean') {
      return isConnectedResult;
    } else if (typeof isConnectedResult === 'object' && 
               isConnectedResult !== null) {
      // For APIs that return an object with isConnected property
      return 'isConnected' in isConnectedResult && 
              Boolean(isConnectedResult.isConnected);
    }
    
    // Default to false for safety
    return false;
  } catch (error) {
    console.error('Error checking wallet connection:', error);
    return false;
  }
}

/**
 * Connect to the Freighter wallet
 */
export async function connectWallet(): Promise<string | null> {
  try {
    if (typeof freighter === 'undefined') {
      throw new Error('Freighter wallet is not installed');
    }
    
    // Clear any previous disconnection flag
    if (typeof window !== 'undefined') {
      localStorage.removeItem('freighter_disconnected');
    }
    
    // Request user permission
    await freighter.requestAccess();
    
    // Check if connection was successful
    const connected = await freighter.isConnected();
    if (!connected) {
      throw new Error('Failed to connect to wallet');
    }
    
    // Get user's public key - use any type for compatibility with different API versions
    try {
      // Try newer API version first (getAddress)
      const addressResult = await (freighter as any).getAddress();
      if (addressResult && typeof addressResult === 'object' && 'address' in addressResult) {
        return addressResult.address;
      }
      
      // Fall back to legacy API (getPublicKey)
      if ('getPublicKey' in (freighter as any)) {
        return await (freighter as any).getPublicKey();
      }
      
      throw new Error('Could not find a compatible method to get the public key');
    } catch (keyError) {
      console.error('Error getting public key:', keyError);
      return null;
    }
  } catch (error) {
    console.error('Error connecting wallet:', error);
    return null;
  }
}

/**
 * Disconnect from the Freighter wallet
 * 
 * Note: Freighter API v3.1.0 doesn't have a direct disconnect method,
 * so we use a workaround with localStorage and page reload
 */
export async function disconnectWallet(): Promise<boolean> {
  try {
    // Set disconnected flag in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('freighter_disconnected', 'true');
      
      // Force reload the page to clear any wallet state
      window.location.reload();
    }
    
    // Return success
    return true;
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    return false;
  }
}