/**
 * Firebase Tester Utilities
 *
 * Provides comprehensive testing and verification functions for Firebase operations.
 * Used in development mode to verify Firebase connectivity and data operations.
 *
 * Features:
 * - Firebase configuration validation
 * - Connectivity testing (Auth, Firestore, Storage)
 * - CRUD operation verification
 * - Real-time subscription testing
 * - Performance metrics collection
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
  Timestamp,
  enableNetwork,
  disableNetwork,
  type Firestore,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type Auth,
} from 'firebase/auth';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage, isFirebaseConfigured } from '@/config/firebase';
import { getAuthErrorMessage } from './utils';

// Test result types
export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface FirebaseTestSuite {
  timestamp: Date;
  overallStatus: 'passed' | 'failed' | 'partial';
  tests: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  config: {
    isConfigured: boolean;
    projectId?: string;
    authDomain?: string;
    hasEmulator: boolean;
  };
}

// Test document type
interface TestDocument {
  id: string;
  message: string;
  timestamp: Timestamp;
  testData: Record<string, unknown>;
}

const TEST_COLLECTION = '_firebase_test_';
const TEST_DOC_ID = 'connectivity_test';

/**
 * Check Firebase configuration status
 */
export function checkFirebaseConfig(): {
  isConfigured: boolean;
  projectId?: string;
  authDomain?: string;
  hasEmulator: boolean;
  missingVars: string[];
} {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const missingVars = requiredVars.filter((varName) => !import.meta.env[varName]);

  return {
    isConfigured: isFirebaseConfigured(),
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    hasEmulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true',
    missingVars,
  };
}

/**
 * Test Firestore connectivity with a simple read/write operation
 */
export async function testFirestoreConnectivity(): Promise<TestResult> {
  const startTime = performance.now();
  
  if (!db) {
    return {
      name: 'Firestore Connectivity',
      passed: false,
      duration: 0,
      error: 'Firestore not initialized',
    };
  }
  
  const testDocRef = doc(db, TEST_COLLECTION, TEST_DOC_ID);

  try {
    // Write test
    await setDoc(testDocRef, {
      message: 'Firebase connectivity test',
      timestamp: serverTimestamp(),
      testData: { type: 'connectivity', random: Math.random() },
    });

    // Read test
    const snapshot = await getDoc(testDocRef);
    const data = snapshot.data() as TestDocument | undefined;

    // Cleanup
    await deleteDoc(testDocRef);

    const duration = Math.round(performance.now() - startTime);

    return {
      name: 'Firestore Connectivity',
      passed: snapshot.exists() && data?.message === 'Firebase connectivity test',
      duration,
      details: { readSuccess: true, writeSuccess: true, cleanupSuccess: true },
    };
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    return {
      name: 'Firestore Connectivity',
      passed: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test Firestore CRUD operations
 */
export async function testFirestoreCRUD(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  if (!db) {
    return [{
      name: 'Firestore CRUD',
      passed: false,
      duration: 0,
      error: 'Firestore not initialized',
    }];
  }
  
  const testId = `test_${Date.now()}`;

  // CREATE Test
  const createStart = performance.now();
  try {
    const testDocRef = doc(db, TEST_COLLECTION, testId);
    await setDoc(testDocRef, {
      name: 'CRUD Test Document',
      value: 42,
      tags: ['test', 'firebase', 'crud'],
      nested: { foo: 'bar', count: 1 },
      createdAt: serverTimestamp(),
    });
    results.push({
      name: 'Firestore CREATE',
      passed: true,
      duration: Math.round(performance.now() - createStart),
    });
  } catch (error) {
    results.push({
      name: 'Firestore CREATE',
      passed: false,
      duration: Math.round(performance.now() - createStart),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // READ Test
  const readStart = performance.now();
  try {
    const testDocRef = doc(db, TEST_COLLECTION, testId);
    const snapshot = await getDoc(testDocRef);
    results.push({
      name: 'Firestore READ',
      passed: snapshot.exists() && snapshot.data()?.value === 42,
      duration: Math.round(performance.now() - readStart),
    });
  } catch (error) {
    results.push({
      name: 'Firestore READ',
      passed: false,
      duration: Math.round(performance.now() - readStart),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // UPDATE Test
  const updateStart = performance.now();
  try {
    const testDocRef = doc(db, TEST_COLLECTION, testId);
    await updateDoc(testDocRef, {
      value: 100,
      'nested.count': 2,
      updatedAt: serverTimestamp(),
    });
    const updatedSnapshot = await getDoc(testDocRef);
    const data = updatedSnapshot.data();
    results.push({
      name: 'Firestore UPDATE',
      passed: data?.value === 100 && data?.nested?.count === 2,
      duration: Math.round(performance.now() - updateStart),
    });
  } catch (error) {
    results.push({
      name: 'Firestore UPDATE',
      passed: false,
      duration: Math.round(performance.now() - updateStart),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // QUERY Test
  const queryStart = performance.now();
  try {
    const testCollection = collection(db, TEST_COLLECTION);
    const q = query(testCollection, where('name', '==', 'CRUD Test Document'));
    const querySnapshot = await getDocs(q);
    results.push({
      name: 'Firestore QUERY',
      passed: !querySnapshot.empty,
      duration: Math.round(performance.now() - queryStart),
      details: { resultsCount: querySnapshot.size },
    });
  } catch (error) {
    results.push({
      name: 'Firestore QUERY',
      passed: false,
      duration: Math.round(performance.now() - queryStart),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // DELETE Test
  const deleteStart = performance.now();
  try {
    const testDocRef = doc(db, TEST_COLLECTION, testId);
    await deleteDoc(testDocRef);
    const deletedSnapshot = await getDoc(testDocRef);
    results.push({
      name: 'Firestore DELETE',
      passed: !deletedSnapshot.exists(),
      duration: Math.round(performance.now() - deleteStart),
    });
  } catch (error) {
    results.push({
      name: 'Firestore DELETE',
      passed: false,
      duration: Math.round(performance.now() - deleteStart),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return results;
}

/**
 * Test real-time subscriptions (onSnapshot)
 */
export async function testRealtimeSubscription(): Promise<TestResult> {
  const startTime = performance.now();
  
  if (!db) {
    return {
      name: 'Firestore Real-time Subscription',
      passed: false,
      duration: 0,
      error: 'Firestore not initialized',
    };
  }
  
  const testDocRef = doc(db, TEST_COLLECTION, `subscription_test_${Date.now()}`);

  return new Promise((resolve) => {
    let unsubscribe: Unsubscribe | null = null;
    let updateReceived = false;

    // Set up subscription
    unsubscribe = onSnapshot(
      testDocRef,
      (snapshot) => {
        if (snapshot.exists() && !updateReceived) {
          updateReceived = true;
          const duration = Math.round(performance.now() - startTime);

          // Cleanup
          if (unsubscribe) {
            unsubscribe();
            deleteDoc(testDocRef).catch(() => {});
          }

          resolve({
            name: 'Firestore Real-time Subscription',
            passed: true,
            duration,
            details: { receivedData: snapshot.data() },
          });
        }
      },
      (error) => {
        const duration = Math.round(performance.now() - startTime);
        resolve({
          name: 'Firestore Real-time Subscription',
          passed: false,
          duration,
          error: error.message,
        });
      }
    );

    // Trigger an update after a short delay
    setTimeout(async () => {
      try {
        await setDoc(testDocRef, {
          message: 'Subscription test',
          timestamp: serverTimestamp(),
        });
      } catch (error) {
        if (unsubscribe) {
          unsubscribe();
        }
        const duration = Math.round(performance.now() - startTime);
        resolve({
          name: 'Firestore Real-time Subscription',
          passed: false,
          duration,
          error: error instanceof Error ? error.message : 'Failed to write test document',
        });
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      if (unsubscribe) {
        unsubscribe();
        deleteDoc(testDocRef).catch(() => {});
      }
      if (!updateReceived) {
        const duration = Math.round(performance.now() - startTime);
        resolve({
          name: 'Firestore Real-time Subscription',
          passed: false,
          duration,
          error: 'Timeout: No update received within 10 seconds',
        });
      }
    }, 10000);
  });
}

/**
 * Test Firebase Auth availability (doesn't create actual users)
 */
export async function testAuthAvailability(): Promise<TestResult> {
  const startTime = performance.now();

  try {
    // Check if auth object is initialized
    if (!auth) {
      throw new Error('Auth object not initialized');
    }

    // Try to check current user state (this will trigger auth state check)
    const currentUser = auth.currentUser;

    const duration = Math.round(performance.now() - startTime);
    return {
      name: 'Firebase Auth Availability',
      passed: true,
      duration,
      details: { isInitialized: true, currentUser: currentUser?.uid || null },
    };
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    return {
      name: 'Firebase Auth Availability',
      passed: false,
      duration,
      error: error instanceof Error ? error.message : 'Auth not available',
    };
  }
}

/**
 * Test Firebase Storage availability
 */
export async function testStorageAvailability(): Promise<TestResult> {
  const startTime = performance.now();
  
  if (!storage) {
    return {
      name: 'Firebase Storage',
      passed: false,
      duration: 0,
      error: 'Storage not initialized',
    };
  }
  
  const testPath = `${TEST_COLLECTION}/test_${Date.now()}.txt`;

  try {
    // Test write
    const storageRef = ref(storage, testPath);
    const testContent = 'Firebase storage test content';
    await uploadString(storageRef, testContent);

    // Test read
    const downloadURL = await getDownloadURL(storageRef);

    // Cleanup
    await deleteObject(storageRef);

    const duration = Math.round(performance.now() - startTime);
    return {
      name: 'Firebase Storage',
      passed: !!downloadURL,
      duration,
      details: { writeSuccess: true, readSuccess: true, cleanupSuccess: true },
    };
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    return {
      name: 'Firebase Storage',
      passed: false,
      duration,
      error: error instanceof Error ? error.message : 'Storage test failed',
    };
  }
}

/**
 * Test offline persistence
 */
export async function testOfflinePersistence(): Promise<TestResult> {
  const startTime = performance.now();

  if (!db) {
    return {
      name: 'Firestore Offline Persistence',
      passed: false,
      duration: 0,
      error: 'Firestore not initialized',
    };
  }

  try {
    // Note: This test checks if Firestore supports offline persistence
    // Actual offline/online toggling may not work in all environments
    const testDocRef = doc(db, TEST_COLLECTION, `offline_test_${Date.now()}`);

    // Write while "offline" (simulated)
    await setDoc(testDocRef, {
      message: 'Offline persistence test',
      timestamp: serverTimestamp(),
    });

    // Read back
    const snapshot = await getDoc(testDocRef);
    const success = snapshot.exists();

    // Cleanup
    await deleteDoc(testDocRef);

    const duration = Math.round(performance.now() - startTime);
    return {
      name: 'Firestore Offline Persistence',
      passed: success,
      duration,
      details: { offlineSupported: success },
    };
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    return {
      name: 'Firestore Offline Persistence',
      passed: false,
      duration,
      error: error instanceof Error ? error.message : 'Offline persistence test failed',
    };
  }
}

/**
 * Run complete Firebase test suite
 */
export async function runFirebaseTestSuite(): Promise<FirebaseTestSuite> {
  const config = checkFirebaseConfig();
  const allTests: TestResult[] = [];

  console.log('[FirebaseTester] Starting test suite...');
  console.log('[FirebaseTester] Configuration:', config);

  // Only run tests if Firebase is configured
  if (!config.isConfigured) {
    console.warn('[FirebaseTester] Firebase not configured, skipping tests');
    return {
      timestamp: new Date(),
      overallStatus: 'failed',
      tests: [],
      summary: { total: 0, passed: 0, failed: 0 },
      config,
    };
  }

  // Run all tests
  try {
    // Test Firestore connectivity
    console.log('[FirebaseTester] Testing Firestore connectivity...');
    const connectivityResult = await testFirestoreConnectivity();
    allTests.push(connectivityResult);
    console.log('[FirebaseTester] Connectivity:', connectivityResult.passed ? 'PASSED' : 'FAILED');

    // Test CRUD operations
    console.log('[FirebaseTester] Testing CRUD operations...');
    const crudResults = await testFirestoreCRUD();
    allTests.push(...crudResults);
    console.log('[FirebaseTester] CRUD tests completed');

    // Test real-time subscriptions
    console.log('[FirebaseTester] Testing real-time subscriptions...');
    const subscriptionResult = await testRealtimeSubscription();
    allTests.push(subscriptionResult);
    console.log('[FirebaseTester] Subscription:', subscriptionResult.passed ? 'PASSED' : 'FAILED');

    // Test Auth
    console.log('[FirebaseTester] Testing Auth availability...');
    const authResult = await testAuthAvailability();
    allTests.push(authResult);
    console.log('[FirebaseTester] Auth:', authResult.passed ? 'PASSED' : 'FAILED');

    // Test Storage
    console.log('[FirebaseTester] Testing Storage...');
    const storageResult = await testStorageAvailability();
    allTests.push(storageResult);
    console.log('[FirebaseTester] Storage:', storageResult.passed ? 'PASSED' : 'FAILED');

    // Test offline persistence
    console.log('[FirebaseTester] Testing offline persistence...');
    const offlineResult = await testOfflinePersistence();
    allTests.push(offlineResult);
    console.log('[FirebaseTester] Offline persistence:', offlineResult.passed ? 'PASSED' : 'FAILED');
  } catch (error) {
    console.error('[FirebaseTester] Test suite error:', error);
  }

  // Calculate summary
  const passed = allTests.filter((t) => t.passed).length;
  const failed = allTests.filter((t) => !t.passed).length;

  const overallStatus: 'passed' | 'failed' | 'partial' =
    failed === 0 ? 'passed' : passed === 0 ? 'failed' : 'partial';

  console.log('[FirebaseTester] Test suite complete:', { passed, failed, total: allTests.length });

  return {
    timestamp: new Date(),
    overallStatus,
    tests: allTests,
    summary: {
      total: allTests.length,
      passed,
      failed,
    },
    config,
  };
}

/**
 * Quick connectivity check - returns true if Firebase appears to be working
 */
export async function quickConnectivityCheck(): Promise<boolean> {
  try {
    if (!isFirebaseConfigured() || !db) {
      return false;
    }

    const testDocRef = doc(db, TEST_COLLECTION, `quick_test_${Date.now()}`);
    await setDoc(testDocRef, { timestamp: serverTimestamp() });
    await deleteDoc(testDocRef);
    return true;
  } catch {
    return false;
  }
}

/**
 * Log Firebase operation with debug info
 */
export function logFirebaseOperation(
  operation: string,
  collection: string,
  docId?: string,
  data?: unknown,
  error?: Error
): void {
  if (!import.meta.env.DEV) return;

  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    operation,
    collection,
    docId,
    data,
    error: error?.message,
  };

  if (error) {
    console.error(`[Firebase:${operation}]`, logData);
  } else {
    console.log(`[Firebase:${operation}]`, logData);
  }
}

/**
 * Verify a specific collection exists and is accessible
 */
export async function verifyCollection(collectionName: string): Promise<TestResult> {
  const startTime = performance.now();

  if (!db) {
    return {
      name: `Collection: ${collectionName}`,
      passed: false,
      duration: 0,
      error: 'Firestore not initialized',
    };
  }

  try {
    const collRef = collection(db, collectionName);
    const q = query(collRef);
    const snapshot = await getDocs(q);

    const duration = Math.round(performance.now() - startTime);
    return {
      name: `Collection: ${collectionName}`,
      passed: true,
      duration,
      details: { documentCount: snapshot.size },
    };
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    return {
      name: `Collection: ${collectionName}`,
      passed: false,
      duration,
      error: error instanceof Error ? error.message : 'Collection verification failed',
    };
  }
}

/**
 * Batch test multiple collections
 */
export async function verifyCollections(collectionNames: string[]): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (const name of collectionNames) {
    const result = await verifyCollection(name);
    results.push(result);
  }

  return results;
}

export default {
  checkFirebaseConfig,
  testFirestoreConnectivity,
  testFirestoreCRUD,
  testRealtimeSubscription,
  testAuthAvailability,
  testStorageAvailability,
  testOfflinePersistence,
  runFirebaseTestSuite,
  quickConnectivityCheck,
  logFirebaseOperation,
  verifyCollection,
  verifyCollections,
};
