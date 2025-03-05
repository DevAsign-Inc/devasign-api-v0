/**
 * Fix for the Freighter wallet disconnection issue
 * 
 * This script adds a global disconnection handler that
 * will reload the page when the user attempts to disconnect.
 */

(function() {
  // Only run in the browser
  if (typeof window === 'undefined') return;

  // Add a global function to disconnect the wallet
  window.disconnectFreighter = function() {
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
})();