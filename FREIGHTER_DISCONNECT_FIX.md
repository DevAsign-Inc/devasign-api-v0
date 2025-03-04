# Freighter Wallet Disconnect Fix

## Issue Summary

When clicking the "Disconnect" button in the app, the Freighter wallet doesn't fully disconnect. The wallet still shows as connected when you return to the app.

## Problem Root Cause

The current implementation of the Freighter wallet (v3.1.0) in the app doesn't have a direct "disconnect" method. The disconnectWallet function in AppContext.tsx only updates the React state but doesn't actually disconnect the wallet at the API level. This causes the app to remember the previously connected wallet even after clicking "Disconnect".

## How to Fix It

Add the following script to your app's entry point (e.g., _app.tsx or index.tsx):

```jsx
useEffect(() => {
  // Create a global function to disconnect Freighter
  window.disconnectFreighter = function() {
    // Clear any stored wallet data
    localStorage.removeItem('walletConnected');
    sessionStorage.removeItem('freighterAddress');
    
    // Mark as disconnected to prevent auto-reconnect
    localStorage.setItem('walletDisconnected', 'true');
    
    // Force reload the page to clear wallet state
    window.location.reload();
  };

  // Clear all Freighter related storage on page load to prevent caching
  localStorage.removeItem('walletConnected');
  sessionStorage.removeItem('freighterAddress');
  
  // Also clear any Freighter-specific storage items
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('freighter') || key.includes('wallet'))) {
      localStorage.removeItem(key);
    }
  }
  
  // Check if previously disconnected
  const wasDisconnected = localStorage.getItem('walletDisconnected') === 'true';
  if (wasDisconnected) {
    console.log('Wallet was manually disconnected');
  }
}, []);
```

Then update the Disconnect button in Navbar.tsx:

```jsx
<Button
  onClick={() => {
    // Call our disconnect function
    if (window.disconnectFreighter) {
      window.disconnectFreighter();
    } else {
      // Fallback to the regular disconnect
      disconnectWallet();
      // Force reload as backup
      window.location.reload();
    }
  }}
  variant="outline"
  size="sm"
>
  Disconnect
</Button>
```

Finally, update the checkConnection function inside useEffect in AppContext.tsx to check for this flag:

```jsx
// Near the top of checkConnection
// Clear any cached wallet data first
if (typeof window !== 'undefined') {
  localStorage.removeItem('walletConnected');
  sessionStorage.removeItem('freighterAddress');
  
  // Also clear any other Freighter-specific storage except our disconnect flag
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key !== 'walletDisconnected' && 
        (key.includes('freighter') || key.includes('wallet'))) {
      localStorage.removeItem(key);
    }
  }
}

// Then check if we've manually disconnected
if (localStorage.getItem('walletDisconnected') === 'true') {
  return; // Skip connecting if manually disconnected
}
```

This solution:
1. Prevents caching of previous wallet connections by clearing all wallet-related storage
2. Forces a complete page reload when disconnecting to ensure a clean state
3. Ensures the app won't automatically reconnect to a previously connected wallet
4. Makes sure each connect attempt requires explicit user approval through the Freighter extension

To reconnect after disconnecting, you'll need to click "Connect Wallet" and approve the connection request in the Freighter extension popup, giving you a fresh connection each time.