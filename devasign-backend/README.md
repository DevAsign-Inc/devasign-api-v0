# DevAsign Backend API

This backend provides a RESTful API for the DevAsign project management application.

## Authentication

The application now uses **wallet-based authentication only**. Email/password login has been removed.

Authentication flow:
1. User connects their Stellar wallet
2. Backend generates a nonce
3. User signs the nonce message with their wallet
4. Backend verifies the signature and issues a JWT token
5. JWT token is used for all authenticated requests

## Getting Started

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run for Postman testing (in-memory database)
npm run postman
```

## Testing the API in Postman

1. Start the test server:
```bash
npm run postman
```

2. Open Postman and create a new collection for "DevAsign API"

3. View the API documentation at http://localhost:5000/api/docs

4. Create the following requests:

### Wallet Authentication

#### 1. Initialize Wallet Auth
- **Method**: POST
- **URL**: http://localhost:5000/api/v1/auth/init
- **Headers**: Content-Type: application/json
- **Body**:
```json
{
  "stellarAddress": "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"
}
```
- This returns a message and nonce that should be signed with your Stellar wallet

#### 2. Verify Wallet Signature
- **Method**: POST
- **URL**: http://localhost:5000/api/v1/auth/verify
- **Headers**: Content-Type: application/json
- **Body**:
```json
{
  "stellarAddress": "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
  "signature": "YOUR_SIGNATURE_HERE"
}
```
- For proper testing, you need to sign the message with a real Stellar wallet (Freighter or Albedo)
- This returns a JWT token for authenticated requests

#### 3. Get Current User
- **Method**: GET
- **URL**: http://localhost:5000/api/v1/auth/me
- **Headers**: Authorization: Bearer YOUR_JWT_TOKEN

#### 4. Update User Profile
- **Method**: PUT
- **URL**: http://localhost:5000/api/v1/auth/profile
- **Headers**: 
  - Content-Type: application/json
  - Authorization: Bearer YOUR_JWT_TOKEN
- **Body**:
```json
{
  "name": "New Display Name"
}
```

### Project Management

Various project management endpoints are available and require authentication.

## Key Changes from Previous Version

- Removed email/password authentication
- Made wallet authentication the primary method
- Updated User model to use stellarAddress as primary identifier
- Enhanced token security by including stellarAddress in JWT payload
- Added profile update endpoint
- Improved error handling for wallet-related operations

## Wallet Integration Notes

- For frontend integration, use Albedo or Freighter for Stellar wallet support
- The frontend should handle the signing process and send the signature to the backend
- See the client-example directory for example React components