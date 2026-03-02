// Test login using Firebase Auth REST API
const https = require('https');

const API_KEY = 'AIzaSyACVQXu7TkQ6FgzMlf2Di88XAa8UfSn0RI';
const TEST_USERS = [
  { email: 'admin@architex.co.za', password: 'Admin123!', role: 'admin' },
  { email: 'freelancer@architex.co.za', password: 'Freelancer123!', role: 'freelancer' },
  { email: 'client@architex.co.za', password: 'Client123!', role: 'client' }
];

function signInWithEmailAndPassword(email, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: email,
      password: password,
      returnSecureToken: true
    });

    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:signInWithPassword?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(parsed.error);
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function testAllLogins() {
  console.log('=== Testing Firebase Auth Logins ===\n');

  for (const user of TEST_USERS) {
    try {
      const result = await signInWithEmailAndPassword(user.email, user.password);
      console.log(`✓ ${user.role.toUpperCase()} login successful: ${user.email}`);
      console.log(`  UID: ${result.localId}`);
      console.log(`  Token expires in: ${result.expiresIn}s`);
    } catch (error) {
      console.error(`✗ ${user.role.toUpperCase()} login FAILED: ${user.email}`);
      console.error(`  Error: ${error.message}`);
      if (error.message && error.message.includes('INVALID_LOGIN_CREDENTIALS')) {
        console.error('  → Password may be incorrect or user not found');
      }
      if (error.message && error.message.includes('USER_DISABLED')) {
        console.error('  → User account is disabled');
      }
    }
    console.log('');
  }

  console.log('=== Login Tests Complete ===');
}

testAllLogins().catch(console.error);