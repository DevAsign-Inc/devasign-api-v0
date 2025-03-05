import * as freighter from "@stellar/freighter-api";

/**
 * This is a test file to check the available methods in the Freighter API
 */

// List all available methods on the freighter object
export function checkFreighterMethods() {
  console.log("Available methods on freighter:");
  for (const key in freighter) {
    console.log(`- ${key}`);
  }

  // Check if disconnect method exists
  if ('disconnect' in freighter) {
    console.log("Disconnect method exists in freighter");
  } else {
    console.log("Disconnect method does NOT exist in freighter");
  }
}

// Check if we can disconnect using a different method
export async function testFreighterDisconnect() {
  try {
    // Method 1: Try to use disconnect method (might not exist)
    if ('disconnect' in freighter) {
      await (freighter as any).disconnect();
      console.log("Used freighter.disconnect()");
      return true;
    }
    
    // Method 2: Try to invalidate user access
    if ('isConnected' in freighter) {
      const isConnected = await freighter.isConnected();
      console.log(`Freighter connected: ${isConnected}`);
    }
    
    console.log("No disconnect method found");
    return false;
  } catch (error) {
    console.error("Error in testFreighterDisconnect:", error);
    return false;
  }
}

// Try to find a working disconnect method
export async function findWorkingDisconnectMethod() {
  console.log("Attempting to find working disconnect method");
  
  // Check if window object is accessible (client-side only)
  if (typeof window !== 'undefined') {
    console.log("Window object is available");
    
    // Check if freighter is available on window - using any type to avoid TS errors
    const win = window as any;
    if (win.freighter) {
      console.log("Freighter is available on window");
      for (const key in win.freighter) {
        console.log(`- window.freighter.${key}`);
      }
    }
  }
  
  return false;
}