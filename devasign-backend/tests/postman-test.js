const http = require('http');

// Simple function to make HTTP requests with detailed logging
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    console.log('Making request:');
    console.log(`  Method: ${options.method}`);
    console.log(`  URL: ${options.hostname}:${options.port}${options.path}`);
    console.log('  Headers:', options.headers || 'None');
    
    if (data) {
      console.log('  Body:', data);
    }
    
    const req = http.request(options, (res) => {
      console.log(`\nResponse status: ${res.statusCode}`);
      console.log('Response headers:', res.headers);
      
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

async function testRegistration() {
  try {
    console.log('===== TESTING USER REGISTRATION =====');
    
    // Test with a random email to avoid duplicates
    const randomEmail = `test${Math.floor(Math.random() * 100000)}@example.com`;
    
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
      email: randomEmail,
      password: 'password123'
    });
    
    if (registerResponse.statusCode === 201) {
      console.log('\n✅ Registration successful!');
      console.log(`Token: ${registerResponse.data.token}`);
      
      // Test the authentication with the new token
      console.log('\n===== TESTING AUTHENTICATION WITH TOKEN =====');
      
      const authResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/auth/me',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${registerResponse.data.token}`
        }
      });
      
      if (authResponse.statusCode === 200) {
        console.log('\n✅ Authentication successful!');
      } else {
        console.log('\n❌ Authentication failed!');
      }
    } else {
      console.log('\n❌ Registration failed!');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testRegistration();