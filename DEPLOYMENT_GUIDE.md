# DeVAsign - Deployment Guide

This guide explains how to deploy the DeVAsign smart contract and connect it to the frontend application.

## Overview

The project consists of two main components:

1. **Smart Contract**: Written in Rust using the Soroban SDK.
2. **Frontend**: Built with Next.js, React, and TypeScript.

## Prerequisites

- Rust and Cargo installed
- Node.js and npm/yarn installed
- Soroban CLI installed
- Freighter wallet browser extension

## Step 1: Deploy the Smart Contract

First, we need to compile and deploy the smart contract to the Stellar Soroban network.

### Compile the contract

```bash
cd devasign-contracts
cargo build --target wasm32-unknown-unknown --release
```

This will generate the WASM file in the `target/wasm32-unknown-unknown/release` directory.

### Optimize the WASM file

```bash
cd contracts/hello-world
./fix_wasm.sh
```

### Deploy the contract to Soroban Testnet

```bash
soroban contract deploy \
  --wasm ../../target/wasm32-unknown-unknown/release/devasign_contract.wasm \
  --source <YOUR_WALLET_SECRET> \
  --network testnet
```

This will output the contract ID, which you'll need for the frontend configuration.

## Step 2: Configure the Frontend

### Set Environment Variables

Create or update the `.env.local` file in the frontend directory with the following variables:

```
# Soroban Network Configuration
NEXT_PUBLIC_SOROBAN_NETWORK=testnet
NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Contract Configuration
NEXT_PUBLIC_CONTRACT_ID=<YOUR_DEPLOYED_CONTRACT_ID>
```

Replace `<YOUR_DEPLOYED_CONTRACT_ID>` with the contract ID you received after deployment.

## Step 3: Run the Frontend

### Install Dependencies

```bash
cd devasign-frontend
npm install
```

### Start the Development Server

```bash
npm run dev
```

The application should now be running on http://localhost:3000.

## Using the Application

### Connect Wallet

1. Make sure Freighter wallet is installed and set up with a funded Testnet account.
2. Click "Connect Wallet" in the application.
3. Approve the connection request in Freighter.

### Create a Project

1. Navigate to the Projects section.
2. Click "Create Project".
3. Fill in the project details and submit.
4. Approve the transaction in Freighter.

### Create Tasks

1. Open a project.
2. Click "Add Task".
3. Fill in the task details, including compensation.
4. Approve the transaction in Freighter.

### Apply for Tasks (as Developer)

1. Browse available tasks.
2. Click "Apply" on a task.
3. Approve the transaction in Freighter.

### Approve Applications (as Project Manager)

1. Go to your project.
2. View task applicants.
3. Click "Approve" on an application.
4. Approve the transaction in Freighter.

## Smart Contract Integration

The frontend connects to the smart contract through the following components:

1. `soroban.ts` - Base utility for Soroban interaction
2. `contractService.ts` - Specific methods for our contract
3. `AppContext.tsx` - React context for state management

## Troubleshooting

### Contract Errors

- Check the contract ID is correct in `.env.local`
- Ensure your wallet has enough funds for transactions
- Check network settings match in both Freighter and the application

### Frontend Issues

- Clear browser cache and reload
- Check browser console for error messages
- Make sure Freighter is unlocked
- Verify you're on the correct network in Freighter

## Security Considerations

- Always use testnet for development
- Avoid exposing private keys in code or environment variables
- Test thoroughly before moving to mainnet
- Consider using a proper secrets management solution for production