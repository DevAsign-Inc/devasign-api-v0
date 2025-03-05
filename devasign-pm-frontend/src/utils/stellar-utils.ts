import * as StellarSdk from '@stellar/stellar-sdk';
import { Keypair } from 'stellar-sdk';

/**
 * Utility functions for working with Stellar
 */

/**
 * Checks if a string is a valid Stellar contract ID (strkey format starting with C)
 */
export function isValidContractId(contractId: string): boolean {
  if (!contractId) return false;
  
  try {
    // Simple format check for Stellar contract IDs (C...)
    if (contractId.startsWith('C') && contractId.length === 56) {
      return true;
    }
    
    // Hex format check (64 characters)
    if (/^[0-9a-fA-F]{64}$/.test(contractId)) {
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('Error validating contract ID:', err);
    return false;
  }
}

/**
 * Gets a human-readable contract ID format
 */
export function formatContractId(contractId: string, maxLength: number = 12): string {
  if (!contractId) return '';
  
  // If it's already short enough, return as is
  if (contractId.length <= maxLength) {
    return contractId;
  }
  
  // Otherwise, show beginning and end with ellipsis
  const start = contractId.slice(0, maxLength / 2);
  const end = contractId.slice(-maxLength / 2);
  return `${start}...${end}`;
}