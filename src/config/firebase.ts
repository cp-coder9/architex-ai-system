/**
 * Firebase Configuration
 * 
 * This module initializes Firebase services for the Architex Axis application.
 * Uses Firebase v9+ modular SDK for tree-shaking and optimal bundle size.
 * 
 * Required environment variables:
 * - VITE_FIREBASE_API_KEY
 * - VITE_FIREBASE_AUTH_DOMAIN
 * - VITE_FIREBASE_PROJECT_ID
 * - VITE_FIREBASE_STORAGE_BUCKET
 * - VITE_FIREBASE_MESSAGING_SENDER_ID
 * - VITE_FIREBASE_APP_ID
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration object using environment variables
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate configuration
function validateConfig(): void {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const missing = requiredVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missing.length > 0) {
    console.warn(
      `[Firebase] Missing environment variables: ${missing.join(', ')}. ` +
      'Using mock mode for development.'
    );
  }
}

// Initialize Firebase
validateConfig();

// Only initialize Firebase if properly configured
let app: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;
let db: ReturnType<typeof getFirestore> | undefined;
let storage: ReturnType<typeof getStorage> | undefined;

if (isFirebaseConfigured()) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Connect to emulators in development mode
  // Supports both VITE_FIREBASE_EMULATOR and VITE_USE_FIREBASE_EMULATOR for compatibility
  const useEmulator =
    import.meta.env.VITE_FIREBASE_EMULATOR === 'true' ||
    import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

  if (import.meta.env.DEV && useEmulator) {
    console.log('[Firebase] Connecting to local emulators...');
    console.log('[Firebase] Auth emulator: localhost:9099');
    console.log('[Firebase] Firestore emulator: localhost:8080');
    console.log('[Firebase] Storage emulator: localhost:9199');

    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: false });
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('[Firebase] ✅ Successfully connected to all emulators');
    } catch (error) {
      console.error('[Firebase] ❌ Failed to connect to emulators:', error);
      console.warn('[Firebase] Falling back to production Firebase services');
    }
  } else {
    if (import.meta.env.DEV) {
      console.log('[Firebase] Running in development mode without emulators');
      console.log('[Firebase] To use emulators, set VITE_FIREBASE_EMULATOR=true in your .env file');
    }
  }
} else {
  console.warn('[Firebase] Firebase not configured. Authentication and database features will be unavailable.');
}

// Export Firebase services (will be undefined if not configured)
export { auth, db, storage };

// Export app instance (will be undefined if not configured)
export default app;

// Helper function to check if Firebase is properly configured
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  );
}
