import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';

/**
 * This component provides a proper disconnection mechanism for the Freighter wallet.
 * Since the Freighter API (v3.1.0) doesn't have a direct disconnect method,
 * we use localStorage to track the disconnection state.
 */
export const WalletDisconnector: React.FC<ButtonProps> = (props) => {
  const { disconnectWallet } = useApp();

  const handleDisconnect = async () => {
    try {
      // Use our global disconnector function if available
      if (typeof window !== 'undefined' && (window as any).disconnectFreighter) {
        (window as any).disconnectFreighter();
      } else {
        // Set a disconnection flag in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('walletDisconnected', 'true');
        }
        
        // Call the app context's disconnect function to update state
        disconnectWallet();
        
        // Force reload the page to clear any wallet state
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      // Still try to update app state
      disconnectWallet();
    }
  };
  
  return (
    <Button
      onClick={handleDisconnect}
      {...props}
    >
      {props.children || 'Disconnect'}
    </Button>
  );
};