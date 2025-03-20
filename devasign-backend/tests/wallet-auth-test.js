const http = require('http');

// Test wallet address (Stellar testnet master account)
const STELLAR_TEST_ADDRESS = 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H';
// Test signature (this is a dummy signature, not validly signed)
const TEST_SIGNATURE = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

// Simple function to make HTTP requests with detailed logging
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    console.log('\n📡 Making request:');
    console.log(`  Method: ${options.method}`);
    console.log(`  URL: ${options.hostname}:${options.port}${options.path}`);
    console.log('  Headers:', options.headers || 'None');
    
    if (data) {
      console.log('  Body:', data);
    }
    
    const req = http.request(options, (res) => {
      console.log(`\n📨 Response status: ${res.statusCode}`);
      
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('Response body:', responseData);
        
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          console.log('Error parsing JSON:', e.message);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error.message);
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testWalletAuth() {
  try {
    console.log('===== TESTING WALLET AUTHENTICATION FLOW =====');
    
    // Step 1: Call the API docs endpoint
    console.log('\n📝 Step 1: Check API Documentation');
    const docsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/docs',
      method: 'GET'
    });
    
    if (docsResponse.statusCode === 200) {
      console.log('✅ API documentation accessible');
    } else {
      console.log('❌ API documentation not available');
    }
    
    // Step 1.5: Check debug routes
    console.log('\n🔍 Step 1.5: Check Available Routes');
    const routesResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/debug/routes',
      method: 'GET'
    });
    
    // Step 2: Initialize wallet authentication
    console.log('\n🔑 Step 2: Initialize Wallet Authentication');
    const initResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/init',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      stellarAddress: STELLAR_TEST_ADDRESS
    });
    
    if (initResponse.statusCode !== 200) {
      console.log('❌ Wallet initialization failed');
      return;
    }
    
    console.log('✅ Wallet initialization successful');
    const nonce = initResponse.data.data.nonce;
    const message = initResponse.data.data.message;
    console.log(`Nonce: ${nonce}`);
    console.log(`Message to sign: \n${message}`);
    
    // Step 3: Verify wallet signature
    console.log('\n🔏 Step 3: Verify Wallet Signature');
    const verifyResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      stellarAddress: STELLAR_TEST_ADDRESS,
      signature: TEST_SIGNATURE
    });
    
    // Since we're using a dummy signature, we expect this to fail
    // In a real scenario with proper signing, this would succeed
    if (verifyResponse.statusCode === 401) {
      console.log('✅ Signature verification behaves as expected with dummy signature');
      console.log('   (In Postman with a real wallet, you would sign the message properly)');
    } else if (verifyResponse.statusCode === 200) {
      console.log('🎉 Signature verification successful (this is just a test environment)');
      
      // For testing - if dummy signature works, try the JWT token
      const token = verifyResponse.data.token;
      console.log(`JWT Token: ${token}`);
      
      // Test protected endpoint
      console.log('\n🔒 Step 4: Test Protected Endpoint (Me)');
      const meResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/auth/me',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (meResponse.statusCode === 200) {
        console.log('✅ Protected endpoint access successful');
      } else {
        console.log('❌ Protected endpoint access failed');
      }
    }
    
    console.log('\n✨ Testing completed. For real wallet testing, use Postman with the Freighter or Albedo extension.');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testWalletAuth();