const http = require('http');

// Simple function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  try {
    // Test 1: Root endpoint
    console.log('Testing root endpoint...');
    const rootResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/',
      method: 'GET'
    });
    console.log(`Status code: ${rootResponse.statusCode}`);
    console.log('Response data:', rootResponse.data);
    
    // Test 2: Register endpoint
    console.log('\nTesting register endpoint...');
    const registerResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    console.log(`Status code: ${registerResponse.statusCode}`);
    console.log('Response data:', registerResponse.data);
    
  } catch (error) {
    console.error('Error during tests:', error);
  }
}

// Run the tests
runTests();