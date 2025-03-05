/**
 * Reset Freighter - Nuclear Option
 * 
 * This script completely demolishes any cached wallet connection
 * and ensures a clean slate when connecting/disconnecting the wallet.
 * 
 * HOW TO USE:
 * 1. Import this script in your browser console or add to your app
 * 2. Run window.nukeFreighterState() to force disconnect
 */

window.nukeFreighterState = function() {
  console.log('🧨 NUCLEAR OPTION: Completely wiping Freighter wallet state...');
  
  try {
    // 1. Delete ALL localStorage items (not just wallet-related ones)
    console.log('Clearing localStorage...');
    localStorage.clear();
    
    // 2. Delete ALL sessionStorage items
    console.log('Clearing sessionStorage...');
    sessionStorage.clear();
    
    // 3. Delete ALL cookies
    console.log('Clearing cookies...');
    document.cookie.split(';').forEach(function(c) {
      document.cookie = c.trim().split('=')[0] + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    });
    
    // 4. Try to override any freighter object in memory
    if (window.freighter) {
      console.log('Overriding Freighter API in memory...');
      try {
        // Replace methods with ones that return disconnected state
        window.freighter.isConnected = function() { return Promise.resolve(false); };
        window.freighter.getPublicKey = function() { return Promise.reject(new Error('Disconnected')); };
        window.freighter.getNetwork = function() { return Promise.reject(new Error('Disconnected')); };
      } catch (e) {
        console.warn('Could not override Freighter API:', e);
      }
    }
    
    // 5. Reload with cache-busting
    console.log('Reloading page with cache busting...');
    const cacheBuster = new Date().getTime();
    window.location.href = window.location.origin + 
                          window.location.pathname + 
                          '?reset=true&t=' + cacheBuster;
  } catch (error) {
    console.error('Error during wallet nuclear reset:', error);
    alert('Error resetting wallet: ' + error.message);
  }
};

// Execute immediately to add disconnect capability
console.log('Freighter Nuclear Reset utility loaded');
console.log('Run window.nukeFreighterState() to completely disconnect wallet');

// Add to any disconnect button on the page
setTimeout(function() {
  document.querySelectorAll('button').forEach(button => {
    if (button.textContent && button.textContent.includes('Disconnect')) {
      console.log('Found disconnect button, attaching nuclear reset handler');
      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.nukeFreighterState();
        return false;
      }, true);
    }
  });
}, 2000);