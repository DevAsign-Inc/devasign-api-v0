import React, { useEffect } from 'react';

/**
 * This component fixes the Freighter wallet disconnection issue
 * by adding a global disconnection handler that reloads the page
 * when the user attempts to disconnect.
 */
export const FreighterFix: React.FC = () => {
  useEffect(() => {
    // Create a function to handle disconnection
    (window as any).disconnectFreighter = function() {
      // Set a flag in localStorage that we've manually disconnected
      localStorage.setItem('walletDisconnected', 'true');
      console.log('Wallet disconnected');
      
      // Reload the page to clear the wallet state
      window.location.reload();
    };

    // Check on page load if we were previously disconnected
    const wasDisconnected = localStorage.getItem('walletDisconnected') === 'true';
    
    if (wasDisconnected) {
      console.log('Wallet was manually disconnected');
    }
  }, []);

  return null; // This component doesn't render anything
};