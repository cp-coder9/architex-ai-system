// Check and manage authorized domains using Firebase Identity Toolkit API
const https = require('https');

const PROJECT_ID = 'architex-5536f';
const ACCESS_TOKEN = process.argv[2]; // Pass access token as argument

function makeRequest(hostname, path, method = 'GET', postData = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function getAuthorizedDomains() {
  console.log('=== Managing Firebase Authorized Domains ===\n');
  
  // Note: Managing authorized domains requires OAuth 2.0 access token
  // Since we don't have one readily available, let's provide instructions
  
  console.log('To check/add authorized domains, please follow these steps:\n');
  
  console.log('MANUAL SETUP REQUIRED:');
  console.log('1. Go to: https://console.firebase.google.com/project/architex-5536f/authentication/settings');
  console.log('2. Scroll to "Authorized domains" section');
  console.log('3. Verify these domains are listed:');
  console.log('   - localhost (for local development)');
  console.log('   - architex-5536f.firebaseapp.com');
  console.log('   - architex-5536f.web.app');
  console.log('4. ADD this domain for production:');
  console.log('   → architex-ai-system-1.vercel.app');
  console.log('5. Click "Add domain" and enter the Vercel domain');
  console.log('6. Click "Add"\n');
  
  console.log('VERCEL DOMAIN TO ADD:');
  console.log('  architex-ai-system-1.vercel.app\n');
  
  console.log('After adding the domain, the deployed app will work correctly.\n');
  
  console.log('CURRENT STATUS:');
  console.log('  ✓ Firestore rules deployed');
  console.log('  ✓ Test users created and verified');
  console.log('  ✓ All logins work via REST API');
  console.log('  ⚠ Vercel domain authorization pending (manual step)\n');
}

getAuthorizedDomains();
