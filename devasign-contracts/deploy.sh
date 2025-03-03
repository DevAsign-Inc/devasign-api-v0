#!/bin/bash

# Exit on error
set -e

# Configuration
NETWORK="testnet"  # Use "testnet" or "mainnet" or "futurenet"
CONTRACT_NAME="hello-world"
CONTRACT_PATH="./contracts/$CONTRACT_NAME/target/wasm32-unknown-unknown/release/$CONTRACT_NAME.wasm"

# Build the contract
echo "Building contract..."
cd contracts/$CONTRACT_NAME
cargo build --target wasm32-unknown-unknown --release
cd ../..

# Fix the WASM file (optional step, depends on your build setup)
if [ -f "./contracts/$CONTRACT_NAME/fix_wasm.sh" ]; then
  echo "Running fix_wasm.sh..."
  cd contracts/$CONTRACT_NAME
  ./fix_wasm.sh
  cd ../..
fi

# Check if soroban-cli is installed
if ! command -v soroban &> /dev/null; then
    echo "soroban-cli is not installed. Please install it first."
    echo "You can install it using: cargo install soroban-cli"
    exit 1
fi

# Ensure we have a Stellar account configured
echo "Checking Stellar account setup..."
if ! soroban config identity ls | grep -q "default"; then
    echo "No default identity found. Please set up a Stellar account first."
    echo "Run: soroban config identity generate default"
    exit 1
fi

# Deploy the contract
echo "Deploying contract to $NETWORK..."
CONTRACT_ID=$(soroban contract deploy \
  --wasm $CONTRACT_PATH \
  --source default \
  --network $NETWORK)

echo "Contract deployed successfully!"
echo "Contract ID: $CONTRACT_ID"
echo ""
echo "Please update your .env.local file with this contract ID:"
echo "NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID"

# Save the contract ID to a file for reference
echo $CONTRACT_ID > contract_id.txt
echo "Contract ID has been saved to contract_id.txt"