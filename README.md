# DevAsign

DevAsign is a decentralized task management and contribution platform designed to simplify how open-source projects coordinate work, incentivize contributions, and ensure transparent, fair compensation for developers.

## Core Value Propositions

- **Transparent Task Allocation**: Seamlessly convert GitHub/GitLab issues into trackable, blockchain-verified tasks.
- **Trustless Compensation**: Automate developer payments based on verifiable task completion.
- **Decentralized Accountability**: Eliminate intermediaries and create a trust-minimized contribution framework.

## System Overview

DevAsign connects project managers with developers through a blockchain-powered platform that integrates with GitHub and GitLab. The system handles the entire workflow from task creation to payment disbursement.

### Key Features

- Automatic wallet creation for users
- GitHub/GitLab project import
- Task creation and management
- Escrow-protected compensation
- Verifiable task completion
- Automated payment release

## Applications

### Project Manager Application

Project managers can:
- Create a wallet automatically after authentication and KYC
- Deposit funds into their wallet
- Import existing projects from GitHub/GitLab
- Create tasks with assigned compensation
- Review developer applications and select candidates
- Approve completed tasks
- Monitor fund disbursement

### Developer Application

Developers can:
- Create a wallet automatically after authentication and KYC
- Browse and filter the task pool
- Apply for specific tasks with proposed completion timeframes
- Complete tasks within the specified timeline
- Receive automatic compensation upon task approval

## Smart Contract Overview

DevAsign utilizes the Soroban blockchain platform for smart contracts with the following components:

### Escrow System
- **Escrow Management Module**: Coordinates escrow lifecycle and fund management
- **Task Escrow Initializer**: Creates and configures new task escrow contracts
- **Fund Locking Module**: Manages fund holding and conditional release
- **Disbursement Controller**: Handles fund release based on task completion

### Validation System
- **Task Completion Verifier**: Validates task completion criteria and milestones
- **Multi-Stage Approval Module**: Manages multi-party task validation and sign-off
- **Dispute Resolution Module**: Provides mechanisms for resolving task completion disputes

## Technology Stack

### Backend
- ExpressJS with TypeScript
- PostgreSQL
- Firebase (Authentication)
- Rust (Smart Contract)

### Frontend
- NextJS with TypeScript

### Infrastructure
- Vercel for web application deployment
- AWS App Runner for API deployment

### Automated Testing
- Stellar Quickstart Image for integration testing
- Jest for unit testing
- Cypress for end-to-end testing

### Integrations
- GitHub & GitLab REST API

## Getting Started

(This section would include installation and setup instructions once the project is ready for deployment)

## Contributing

(Information about contributing to the DevAsign project itself would go here)

## License

This project is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0).

This means you are free to:
- Share — copy and redistribute the material in any medium or format
- Adapt — remix, transform, and build upon the material

Under the following terms:
- Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
- NonCommercial — You may not use the material for commercial purposes.
- ShareAlike — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.

For more information, see the full license text at: https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode
