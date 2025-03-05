import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string | null | undefined) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatCompensation(amount: number) {
  return `${(amount / 10000000).toFixed(7)} XLM`;
}

export const statusColors = {
  'Open': {
    bg: 'bg-blue-900/20',
    text: 'text-blue-400',
    border: 'border-blue-800'
  },
  'Assigned': {
    bg: 'bg-amber-900/20',
    text: 'text-amber-400',
    border: 'border-amber-800'
  },
  'InProgress': {
    bg: 'bg-purple-900/20',
    text: 'text-purple-400',
    border: 'border-purple-800'
  },
  'Completed': {
    bg: 'bg-orange-900/20',
    text: 'text-orange-400',
    border: 'border-orange-800'
  },
  'Approved': {
    bg: 'bg-green-900/20',
    text: 'text-green-400',
    border: 'border-green-800'
  },
  'Rejected': {
    bg: 'bg-red-900/20',
    text: 'text-red-400',
    border: 'border-red-800'
  }
}