const admin = require('firebase-admin');
const serviceAccount = require('../architex-5536f-firebase-adminsdk-fbsvc-cb316c116b.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function addAuthorizedDomain() {
  const vercelDomain = 'architex-ai-system-1.vercel.app';
  
  try {
    console.log('=== Managing Authorized Domains ===\n');
    
    // Get current authorized domains
    const authorizedDomains = await admin.auth().getAuthorizedDomains();
    console.log('Current authorized domains:');
    authorizedDomains.forEach(domain => console.log(`  - ${domain}`));
    
    // Check if Vercel domain is already authorized
    if (authorizedDomains.includes(vercelDomain)) {
      console.log(`\n✓ Domain already authorized: ${vercelDomain}`);
    } else {
      console.log(`\n→ Adding domain: ${vercelDomain}`);
      // Note: The Firebase Admin SDK doesn't have a direct method to add authorized domains
      // This must be done through the Firebase Console
      console.log('\n⚠ Please add the domain manually in Firebase Console:');
      console.log('1. Go to: https://console.firebase.google.com/project/architex-5536f/authentication/settings');
      console.log('2. Scroll to "Authorized domains" section');
      console.log('3. Click "Add domain"');
      console.log(`4. Enter: ${vercelDomain}`);
      console.log('5. Click "Add"');
    }
    
    console.log('\n=== Complete ===');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addAuthorizedDomain();