/**
 * Type declarations for @stellar/freighter-api
 */

declare module '@stellar/freighter-api' {
  export interface FreighterApiError {
    code: number;
    message: string;
    ext?: string[];
  }

  // Get public key
  export function getAddress(): Promise<{ address: string, error?: FreighterApiError }>;
  
  // Check if Freighter is installed
  export function isConnected(): Promise<boolean>;
  
  // Request permission to connect
  export function requestAccess(): Promise<boolean>;
  
  // Get network details
  export function getNetworkDetails(): Promise<{
    network: string;
    networkPassphrase: string;
    networkUrl: string;
    sorobanRpcUrl?: string;
    error?: FreighterApiError;
  }>;
  
  // Get network
  export function getNetwork(): Promise<string>;
  
  // Check if site is allowed to connect to wallet
  export function isAllowed(): Promise<boolean>;
  
  // Set site as allowed to connect to wallet
  export function setAllowed(): Promise<void>;
  
  // Sign a transaction
  export function signTransaction(
    xdr: string,
    opts?: {
      networkPassphrase?: string;
      accountToSign?: string;
    }
  ): Promise<{ 
    signedTransaction: string;
    signature: string;
    error?: FreighterApiError;
  }>;
  
  // Sign a message
  export function signMessage(
    message: string,
    opts?: {
      networkPassphrase?: string;
      accountToSign?: string;
    }
  ): Promise<{
    signature: string;
    error?: FreighterApiError;
  }>;
}