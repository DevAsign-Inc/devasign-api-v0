# DevAsign: Smart Contracts Meet Sprint Planning

## 🌐 Project Overview

### Problem Statement
Traditional task-based work payment systems are fundamentally broken:
- High transaction fees (up to 20% on centralized platforms)
- Slow cross-border payment processes
- Limited cryptocurrency integration
- Complex blockchain interactions for non-technical users

### Solution
DevAsign is a Soroban-powered API and Linear plugin that revolutionizes task compensation by enabling:
- Instant, automated token bounties for completed tasks
- Cross-border payments with minimal fees
- Seamless integration with project management tools

## 🏗️ Technical Architecture

### Core Components
1. **Soroban Smart Contract API**
   - Programmable bounty release logic
   - Support for multiple stablecoins (USDC, XLM)
   - Automatic fund distribution upon task completion

2. **Linear Plugin**
   - User-friendly interface for:
     * Setting task bounties
     * Selecting payment tokens
     * Tracking payment history

### Technology Stack
- **Blockchain**: Stellar (Soroban)
- **Smart Contract Language**: Rust
- **Frontend Integration**: Linear plugin
- **Payment Tokens**: USDC, XLM

## 🧠 Technical Decision Rationale

### Why Soroban?
1. **Cost Efficiency**
   - Sub-cent transaction fees
   - Enables micro-transactions ($0.10 payouts)

2. **Performance**
   - 3-5 second settlement times
   - Significantly faster than Ethereum

3. **Asset Support**
   - Native USDC integration
   - Ideal for borderless payments

## 💻 Development Experience

### Stellar Development Insights
- Leveraged Rust's strong typing for robust smart contract development
- Utilized Soroban's contract SDK for secure, efficient blockchain interactions
- Learned and implemented Stellar's unique asset and payment models

## 🚀 Deployment Instructions

### Prerequisites
- Rust (latest stable version)
- Soroban CLI
- Linear workspace access
- Stellar wallet with testnet XLM

### Local Setup
1. Clone the repository
   ```bash
   git clone https://github.com/your-org/devassign.git
   cd devassign
   ```

2. Install dependencies
   ```bash
   cargo build
   npm install
   ```

3. Configure environment
   ```bash
   cp .env.example .env
   # Edit .env with your Stellar credentials
   ```

4. Deploy smart contracts
   ```bash
   soroban contract deploy --network testnet
   ```

5. Install Linear plugin
   - Navigate to Linear's custom apps section
   - Upload `linear-plugin.json`

### Testing
- **Smart Contract Tests**:
  ```bash
  cargo test
  ```
- **Integration Tests**:
  ```bash
  npm run test:integration
  ```

## 🔐 Test Credentials

### Testnet Wallet
- **Address**: `GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- **Secret Key**: `SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- **Network**: Stellar Testnet

**Note**: These are example credentials. Replace with actual test wallet details.

## 🌍 Vision

Transforming every project management tool into a gateway for decentralized, frictionless work economies.

## 📜 License
MIT License