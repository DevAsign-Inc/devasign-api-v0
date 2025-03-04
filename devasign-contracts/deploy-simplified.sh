#!/bin/bash

# Exit on error
set -e

# Configuration
SECRET_KEY="SBIOOVFY6NVFJ43P7HROFFZWNJSPFYJOSY3Y356FPLRWGXEP4O2AUYB5"
WASM_PATH="/home/bishopbethel/devasign-build-v0/devasign-contracts/target/wasm32-unknown-unknown/release/devasign_contract.optimized.wasm"

# Check if the WASM file exists
if [ ! -f "$WASM_PATH" ]; then
  echo "Error: WASM file not found at $WASM_PATH"
  exit 1
fi

# Try deploying with soroban command format
echo "Deploying contract to testnet..."
CONTRACT_ID=$(soroban contract deploy \
  --wasm "$WASM_PATH" \
  --source-account "$SECRET_KEY" \
  --network-passphrase "Test SDF Network ; September 2015" \
  --rpc-url "https://soroban-testnet.stellar.org:443")

# Save the result
echo "Contract deployed successfully!"
echo "Contract ID: $CONTRACT_ID"
echo ""
echo "Please update your .env.local file with this contract ID:"
echo "NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID"

# Save the contract ID to a file for reference
echo "$CONTRACT_ID" > contract_id.txt
echo "Contract ID has been saved to contract_id.txt"