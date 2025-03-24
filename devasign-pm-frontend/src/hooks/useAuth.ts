import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '../context/AppContext';

// Hook to protect routes that require authentication
export function useAuthProtection(redirectPath = '/') {
  const { isWalletConnected, loading } = useApp();
  const router = useRouter();
  
  useEffect(() => {
    // Skip during server-side rendering
    if (typeof window === 'undefined') return;
    
    // Skip while checking auth status
    if (loading) return;
    
    // If not authenticated, redirect
    if (!isWalletConnected) {
      router.push(redirectPath);
    }
  }, [isWalletConnected, loading, router, redirectPath]);
  
  return { isWalletConnected, loading };
}

// Hook to redirect authenticated users away from auth pages
export function useRedirectAuthenticated(redirectPath = '/dashboard') {
  const { isWalletConnected, loading } = useApp();
  const router = useRouter();
  
  useEffect(() => {
    // Skip during server-side rendering
    if (typeof window === 'undefined') return;
    
    // Skip while checking auth status
    if (loading) return;
    
    // If authenticated, redirect
    if (isWalletConnected) {
      router.push(redirectPath);
    }
  }, [isWalletConnected, loading, router, redirectPath]);
  
  return { isWalletConnected, loading };
}