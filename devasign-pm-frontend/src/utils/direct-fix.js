/**
 * FREIGHTER WALLET COMPLETE RESET UTILITY
 * 
 * This script completely eliminates caching issues with the Freighter wallet.
 * Add this script to your _app.jsx or index.jsx file to ensure fresh connections.
 */

// Wrap in IIFE for scope containment
(function() {
  // Only run in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  console.log('Installing Freighter anti-caching fix...');

  // The ultimate disconnect function - wipes everything
  function forceFreighterDisconnect() {
    console.log('Completely resetting Freighter connection state...');
    
    // 1. Wipe ALL local and session storage (the nuclear option)
    localStorage.clear();
    sessionStorage.clear();
    
    // 2. Set a flag to indicate manual disconnection
    localStorage.setItem('FORCE_FREIGHTER_DISCONNECT', Date.now().toString());
    
    // 3. Override any Freighter API methods that might be cached
    if (window.freighter) {
      try {
        // Attempt to detach event listeners by replacing with empty functions
        window.freighter.isConnected = async function() { return false; };
        window.freighter.getNetwork = async function() { return null; };
        window.freighter.getPublicKey = async function() { throw new Error('Disconnected'); };
      } catch (e) {
        console.log('Could not override Freighter API methods:', e);
      }
    }

    // 4. Clear any cookies related to wallet
    document.cookie.split(';').forEach(function(c) {
      const cookieName = c.trim().split('=')[0];
      if (cookieName.toLowerCase().includes('wallet') || 
          cookieName.toLowerCase().includes('freighter')) {
        document.cookie = cookieName + '=; Max-Age=-1;';
      }
    });
    
    // 5. Hard reload the page to completely reset state
    window.location.href = window.location.origin + 
                          window.location.pathname + 
                          '?nocache=' + Date.now();
  }

  // Expose our disconnect function globally
  window.forceFreighterDisconnect = forceFreighterDisconnect;

  // Override the disconnect button by directly modifying DOM
  function patchDisconnectButton() {
    // Look for a button with "Disconnect" text
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      if (button.textContent.includes('Disconnect')) {
        console.log('Found disconnect button, overriding click handler');
        
        // Store original click handler
        const originalHandler = button.onclick;
        
        // Replace with our own handler
        button.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Disconnect button clicked, forcing disconnection');
          forceFreighterDisconnect();
          return false;
        };
      }
    });
  }

  // Try to patch the disconnect button as soon as possible
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(patchDisconnectButton, 100);
  } else {
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(patchDisconnectButton, 100);
    });
  }

  // Also patch it when the DOM changes (for SPAs that might render the button later)
  const observer = new MutationObserver(function(mutations) {
    setTimeout(patchDisconnectButton, 100);
  });
  
  // Start observing once DOM is ready
  window.addEventListener('DOMContentLoaded', function() {
    observer.observe(document.body, { childList: true, subtree: true });
  });

  // Check for previous disconnect signal on page load
  if (localStorage.getItem('FORCE_FREIGHTER_DISCONNECT')) {
    console.log('Previous disconnect detected, ensuring disconnected state');
    
    // Remove any potentially cached Freighter data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key !== 'FORCE_FREIGHTER_DISCONNECT' && 
          (key.toLowerCase().includes('freighter') || 
           key.toLowerCase().includes('wallet') ||
           key.toLowerCase().includes('stellar'))) {
        localStorage.removeItem(key);
      }
    }
  }
})();