#!/bin/bash

# Exit on error
set -e

# Configuration
NETWORK="testnet"
SECRET_KEY="SBIOOVFY6NVFJ43P7HROFFZWNJSPFYJOSY3Y356FPLRWGXEP4O2AUYB5"
CONTRACT_WASM_PATH="/home/bishopbethel/devasign-build-v0/devasign-contracts/target/wasm32-unknown-unknown/release/devasign_contract.optimized.wasm"

# Check if the WASM file exists
if [ ! -f "$CONTRACT_WASM_PATH" ]; then
  echo "WASM file not found at $CONTRACT_WASM_PATH"
  echo "Make sure you've built the contract first with:"
  echo "cd contracts/hello-world && cargo build --target wasm32-unknown-unknown --release"
  exit 1
fi

# Configure network
echo "Setting up network configuration..."
soroban config network add --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# Deploy contract
echo "Deploying contract to testnet..."
CONTRACT_ID=$(soroban contract deploy \
  --wasm $CONTRACT_WASM_PATH \
  --secret-key $SECRET_KEY \
  --network testnet)

echo "Contract deployed successfully!"
echo "Contract ID: $CONTRACT_ID"
echo ""
echo "Please update your .env.local file with this contract ID:"
echo "NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID"

# Save the contract ID to a file for reference
echo $CONTRACT_ID > contract_id.txt
echo "Contract ID has been saved to contract_id.txt"