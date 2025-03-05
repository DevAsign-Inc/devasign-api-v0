/**
 * This is a utility script that clears cached Freighter wallet connections
 * and prevents automatic reconnection after a manual disconnect.
 * 
 * Add this script to your app's entry point (_app.js or similar).
 */

(function() {
  if (typeof window === 'undefined') return;

  console.log('Initializing Freighter wallet cleaner...');

  // Define disconnect handler
  window.disconnectFreighterWallet = function() {
    console.log('Disconnecting Freighter wallet and clearing cached data...');
    
    // Clear any stored wallet data
    localStorage.removeItem('walletConnected');
    sessionStorage.removeItem('freighterAddress');
    
    // Clear any other Freighter-specific storage items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('freighter') || key.includes('wallet'))) {
        localStorage.removeItem(key);
      }
    }
    
    // Mark as disconnected to prevent auto-reconnect
    localStorage.setItem('walletDisconnected', 'true');
    
    // Force reload the page to clear wallet state
    window.location.reload();
  };

  // Check for page load
  document.addEventListener('DOMContentLoaded', function() {
    // Clear cached wallet data on page load
    localStorage.removeItem('walletConnected');
    sessionStorage.removeItem('freighterAddress');
    
    // Clear any other wallet-related storage except our disconnect flag
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key !== 'walletDisconnected' && 
          (key.includes('freighter') || key.includes('wallet'))) {
        localStorage.removeItem(key);
      }
    }
  });

  // Patch the Disconnect button - run after DOM is loaded
  setTimeout(function() {
    const disconnectButtons = document.querySelectorAll('button:contains("Disconnect")');
    disconnectButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        // Run our disconnection handler
        if (window.disconnectFreighterWallet) {
          e.preventDefault();
          e.stopPropagation();
          window.disconnectFreighterWallet();
        }
      }, true);
    });
  }, 1000);
})();