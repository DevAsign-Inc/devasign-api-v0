import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { AppProvider } from '@/context/AppContext';
import React, { useEffect } from 'react';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  // Add Freighter disconnect fix
  useEffect(() => {
    // This function aggressively disconnects Freighter and prevents caching
    const forceFreighterDisconnect = () => {
      console.log('Completely resetting Freighter connection state...');
      
      // 1. Wipe ALL local and session storage related to wallets
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (
            key.toLowerCase().includes('freighter') || 
            key.toLowerCase().includes('wallet') ||
            key.toLowerCase().includes('stellar')
        )) {
          localStorage.removeItem(key);
        }
      }
      
      // Also clear session storage
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && (
            key.toLowerCase().includes('freighter') || 
            key.toLowerCase().includes('wallet') ||
            key.toLowerCase().includes('stellar')
        )) {
          sessionStorage.removeItem(key);
        }
      }
      
      // 2. Set disconnect flag
      localStorage.setItem('WALLET_FORCE_DISCONNECTED', 'true');
      
      // 3. Hard reload with cache busting
      window.location.href = window.location.origin + 
                           window.location.pathname + 
                           '?nocache=' + Date.now();
    };

    // Make the function globally available
    (window as any).forceFreighterDisconnect = forceFreighterDisconnect;
    
    // Find and patch the Disconnect button
    const patchDisconnectButton = () => {
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        if (button.textContent?.includes('Disconnect')) {
          // Override click handler
          button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            forceFreighterDisconnect();
            return false;
          }, true); // Use capture phase to ensure we're first
        }
      });
    };
    
    // Run patch after a delay to ensure DOM is loaded
    setTimeout(patchDisconnectButton, 1000);
    
    // Also run patch when DOM changes (for dynamically rendered buttons)
    const observer = new MutationObserver(() => {
      setTimeout(patchDisconnectButton, 100);
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Head>
        <title>DevAsign - Decentralized design & development platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AppProvider>
        <Component {...pageProps} />
      </AppProvider>
    </>
  );
}