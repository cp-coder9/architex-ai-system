/**
 * Firebase Services Export
 * 
 * Central export point for all Firebase-related services.
 * Provides a clean API for interacting with Firebase Auth, Firestore, and Storage.
 */

// Export Firebase configuration and instances
export { auth, db, storage, default as firebaseApp, isFirebaseConfigured } from '@/config/firebase';

// Export utilities
export {
  AUTH_ERROR_CODES,
  getAuthErrorMessage,
  isAuthError,
  serializeForFirestore,
  deserializeFromFirestore,
  timestampToDate,
  generateDocumentId,
  chunkArray,
  retryOperation,
  debounce,
  throttle,
  COLLECTIONS,
  STORAGE_PATHS,
  validators,
} from './utils';

// Export testing utilities
export {
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
  type TestResult,
  type FirebaseTestSuite,
} from './firebaseTester';

// Export seed data utilities
export {
  seedTestData,
  clearTestData,
  clearAllTestDataByQuery,
  getSeededDataSummary,
} from './seedData';

// Export user service
export {
  // CRUD operations
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  
  // Role-based queries
  getUsersByRole,
  getAllClients,
  getAllFreelancers,
  getAllAdmins,
  
  // Utilities
  updateLastLogin,
  batchUpdateUsers,
  userExists,
  
  // Type-specific creators
  createClientUser,
  createFreelancerUser,
  createAdminUser,
} from './userService';

// Export agent service
export {
  // Types
  type AgentConfig,
  type AgentMemory,
  type AgentRule,
  
  // Agent Configurations
  saveAgentConfig,
  getAgentConfig,
  updateAgentConfig,
  
  // Agent Memory
  saveAgentMemory,
  getAgentMemory,
  updateAgentMemory,
  deleteAgentMemory,
  
  // Agent Logs
  logAgentAction,
  getAgentLogs,
  getProjectAgentLogs,
  
  // Agent Rules
  saveAgentRule,
  getAgentRules,
  updateRuleUsage,
} from './agentService';

// Export project service
export {
  // Projects
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectsByClient,
  getProjectsByFreelancer,
  getAllProjects,
  subscribeToProject,
  
  // Drawings
  addDrawing,
  getDrawingById,
  getDrawingsByProject,
  updateDrawing,
  updateDrawingStatus,
  
  // Time Entries
  createTimeEntry,
  getTimeEntriesByProject,
  getTimeEntriesByFreelancer,
  
  // Invoices
  createInvoice,
  getInvoiceById,
  getInvoicesByProject,
  getInvoicesByClient,
  updateInvoiceStatus,
  
  // Comments
  addComment,
  getCommentsByProject,
  
  // Milestones
  addMilestone,
  getMilestonesByProject,
  updateMilestone,
} from './projectService';

// Re-export Firebase Auth functions for convenience
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  deleteUser as deleteAuthUser,
  type User as FirebaseUser,
  type UserCredential,
} from 'firebase/auth';

// Re-export Firestore functions for advanced use cases
export {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
  type QuerySnapshot,
  type DocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

// Re-export Storage functions
export {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  type UploadTask,
  type StorageReference,
} from 'firebase/storage';
