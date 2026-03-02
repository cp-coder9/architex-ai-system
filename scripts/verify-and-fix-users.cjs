const admin = require('firebase-admin');
const serviceAccount = require('../architex-5536f-firebase-adminsdk-fbsvc-cb316c116b.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

const testUsers = [
  {
    email: 'admin@architex.co.za',
    password: 'Admin123!',
    role: 'admin',
    displayName: 'Admin User'
  },
  {
    email: 'freelancer@architex.co.za',
    password: 'Freelancer123!',
    role: 'freelancer',
    displayName: 'Freelancer User'
  },
  {
    email: 'client@architex.co.za',
    password: 'Client123!',
    role: 'client',
    displayName: 'Client User'
  }
];

async function verifyAndFixUsers() {
  console.log('=== Verifying and Fixing Test Users ===\n');

  for (const user of testUsers) {
    try {
      // Check if user exists
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(user.email);
        console.log(`✓ User exists: ${user.email} (UID: ${userRecord.uid})`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          console.log(`✗ User not found: ${user.email} - Creating...`);
          userRecord = await auth.createUser({
            email: user.email,
            password: user.password,
            displayName: user.displayName,
            emailVerified: true
          });
          console.log(`  ✓ Created user: ${user.email} (UID: ${userRecord.uid})`);
        } else {
          throw error;
        }
      }

      // Update password to ensure it's correct
      await auth.updateUser(userRecord.uid, {
        password: user.password,
        emailVerified: true
      });
      console.log(`  ✓ Password updated for: ${user.email}`);

      // Check if user document exists in Firestore
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      if (!userDoc.exists) {
        console.log(`  → Creating Firestore user document...`);
        await db.collection('users').doc(userRecord.uid).set({
          id: userRecord.uid,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          isActive: true,
          emailVerified: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`  ✓ Firestore document created for: ${user.email}`);
      } else {
        console.log(`  ✓ Firestore document exists for: ${user.email}`);
        
        // Ensure role is correct
        const data = userDoc.data();
        if (data.role !== user.role) {
          console.log(`  → Updating role from ${data.role} to ${user.role}...`);
          await db.collection('users').doc(userRecord.uid).update({
            role: user.role,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`  ✓ Role updated`);
        }
      }

      console.log('');
    } catch (error) {
      console.error(`✗ Error processing ${user.email}:`, error.message);
      console.log('');
    }
  }

  // List all users
  console.log('\n=== All Users in Firebase Auth ===');
  const listUsersResult = await auth.listUsers(100);
  listUsersResult.users.forEach(user => {
    console.log(`- ${user.email} (${user.uid}) - Email verified: ${user.emailVerified}`);
  });

  console.log('\n=== Verification Complete ===');
  console.log('\nTest Login Credentials:');
  console.log('Admin:      admin@architex.co.za / Admin123!');
  console.log('Freelancer: freelancer@architex.co.za / Freelancer123!');
  console.log('Client:     client@architex.co.za / Client123!');
  
  process.exit(0);
}

verifyAndFixUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});