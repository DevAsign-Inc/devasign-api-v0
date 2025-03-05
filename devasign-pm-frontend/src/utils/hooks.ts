import { useEffect } from 'react';
import * as freighter from '@stellar/freighter-api';

/**
 * A hook to initialize wallet connection checks
 * and handle manual disconnection via localStorage flag
 */
export function useWalletInitialization() {
  useEffect(() => {
    // When the app first loads, check if we have a disconnection flag
    if (typeof window !== 'undefined') {
      const wasDisconnected = localStorage.getItem('freighter_disconnected') === 'true';
      
      // If we manually disconnected before, make sure the UI reflects that
      if (wasDisconnected) {
        console.log('Found disconnection flag, wallet will remain disconnected');
      }
    }
  }, []);
}