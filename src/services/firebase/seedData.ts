/**
 * Firebase Test Data Seeding Utility
 *
 * Provides functions to create and manage test data in Firebase for development
 * and testing purposes. All seeded data is prefixed with "test_" for easy identification
 * and cleanup.
 *
 * Usage:
 *   import { seedTestData, clearTestData } from '@/services/firebase/seedData';
 *
 *   // Seed test data
 *   await seedTestData();
 *
 *   // Clear all test data
 *   await clearTestData();
 *
 *   // Get summary of seeded data
 *   const summary = getSeededDataSummary();
 */

import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from './utils';
import type { User, Project, Drawing, Invoice, TimeEntry, Comment } from '@/types';

/**
 * Check if we're in a development environment
 * Seeds data ONLY in development mode with emulators or when explicitly allowed
 */
function isDevelopmentEnvironment(): boolean {
  // Check if we're in production build
  if (import.meta.env.PROD) {
    return false;
  }

  // Check for explicit development flag
  const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
  
  // Check if emulator mode is enabled (safest for seeding)
  const emulatorEnabled = import.meta.env.VITE_FIREBASE_EMULATOR === 'true';
  
  // Allow seeding if in development with emulator, or if explicitly bypassed
  const bypassCheck = import.meta.env.VITE_ALLOW_SEEDING === 'true';
  
  return isDev && (emulatorEnabled || bypassCheck);
}

/**
 * Guard function to prevent accidental production seeding
 */
function guardProductionSeeding(): void {
  if (import.meta.env.PROD) {
    throw new Error(
      '⛔ CRITICAL ERROR: Attempted to seed test data in PRODUCTION environment.\n' +
      'This operation is strictly forbidden to prevent data corruption.\n' +
      'If you need to seed production data, use the Firebase Console or a dedicated migration script.'
    );
  }

  if (!isDevelopmentEnvironment()) {
    throw new Error(
      '⛔ Seeding blocked: Environment not safe for test data seeding.\n' +
      'Required: Development mode with Firebase emulators enabled, or VITE_ALLOW_SEEDING=true\n' +
      'Current mode: ' + import.meta.env.MODE + '\n' +
      'VITE_FIREBASE_EMULATOR: ' + import.meta.env.VITE_FIREBASE_EMULATOR
    );
  }

  console.log('✅ Development environment verified. Proceeding with test data seeding...');
}

// Storage key for tracking seeded data
const SEED_STORAGE_KEY = 'firebase_seed_data';

// Test data prefixes
const TEST_PREFIX = 'test_';

// Seeded data tracking
interface SeededData {
  users: string[];
  projects: string[];
  drawings: string[];
  invoices: string[];
  timeEntries: string[];
  comments: string[];
  lastSeeded?: string;
}

/**
 * Get the current seeded data summary from localStorage
 */
export function getSeededDataSummary(): {
  users: number;
  projects: number;
  drawings: number;
  invoices: number;
  timeEntries: number;
  comments: number;
  totalCreated: number;
  lastSeeded: Date | null;
} {
  const stored = localStorage.getItem(SEED_STORAGE_KEY);
  if (!stored) {
    return {
      users: 0,
      projects: 0,
      drawings: 0,
      invoices: 0,
      timeEntries: 0,
      comments: 0,
      totalCreated: 0,
      lastSeeded: null,
    };
  }

  const data: SeededData = JSON.parse(stored);
  return {
    users: data.users?.length || 0,
    projects: data.projects?.length || 0,
    drawings: data.drawings?.length || 0,
    invoices: data.invoices?.length || 0,
    timeEntries: data.timeEntries?.length || 0,
    comments: data.comments?.length || 0,
    totalCreated:
      (data.users?.length || 0) +
      (data.projects?.length || 0) +
      (data.drawings?.length || 0) +
      (data.invoices?.length || 0) +
      (data.timeEntries?.length || 0) +
      (data.comments?.length || 0),
    lastSeeded: data.lastSeeded ? new Date(data.lastSeeded) : null,
  };
}

/**
 * Save seeded data tracking to localStorage
 */
function saveSeededData(data: SeededData): void {
  data.lastSeeded = new Date().toISOString();
  localStorage.setItem(SEED_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Load seeded data tracking from localStorage
 */
function loadSeededData(): SeededData {
  const stored = localStorage.getItem(SEED_STORAGE_KEY);
  if (!stored) {
    return {
      users: [],
      projects: [],
      drawings: [],
      invoices: [],
      timeEntries: [],
      comments: [],
    };
  }
  return JSON.parse(stored);
}

// Test data generators
const generateTestUser = (role: 'admin' | 'client' | 'freelancer', index: number): Partial<User> => {
  const base = {
    id: `${TEST_PREFIX}${role}_${index}`,
    email: `${TEST_PREFIX}${role}${index}@test.com`,
    name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)} ${index}`,
    role,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${TEST_PREFIX}${role}${index}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    phone: '+27 (011) 555-0000',
    company: role === 'client' ? `Test Client Company ${index}` : undefined,
  };

  switch (role) {
    case 'client':
      return {
        ...base,
        totalHoursPurchased: 100 + index * 50,
        totalHoursUsed: 50 + index * 20,
        projects: [],
        paymentMethods: [
          {
            id: `pm_test_${index}`,
            type: 'card' as const,
            last4: '4242',
            expiryMonth: 12,
            expiryYear: 2026,
            isDefault: true,
          },
        ],
      } as Partial<User>;
    case 'freelancer':
      return {
        ...base,
        hourlyRate: 50 + index * 25,
        skills: ['AutoCAD', 'Revit', 'SketchUp'].slice(0, 2 + (index % 2)),
        totalHoursWorked: 100 + index * 50,
        totalEarnings: 5000 + index * 2500,
        rating: 4.5 + (index % 5) * 0.1,
        availability: ['available', 'busy', 'available'][index % 3] as 'available' | 'busy' | 'unavailable',
        currentProjects: [],
        certifications: index % 2 === 0 ? ['LEED AP'] : [],
      } as Partial<User>;
    case 'admin':
      return {
        ...base,
        permissions: ['all'],
        lastLogin: new Date(),
      } as Partial<User>;
    default:
      return base;
  }
};

const generateTestProject = (index: number, clientId: string, freelancerId?: string): Partial<Project> => ({
  id: `${TEST_PREFIX}project_${index}`,
  name: `Test Project ${index}`,
  description: `This is a test project for development purposes. Project number ${index}.`,
  clientId,
  freelancerId,
  status: ['draft', 'active', 'on_hold', 'completed'][index % 4] as Project['status'],
  hoursAllocated: 100 + index * 25,
  hoursUsed: 50 + index * 10,
  budget: 5000 + index * 1000,
  createdAt: new Date(),
  updatedAt: new Date(),
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  drawings: [],
  milestones: [],
  comments: [],
  projectType: ['residential', 'commercial', 'industrial'][index % 3] as Project['projectType'],
  referenceNumber: `TEST-${String(index).padStart(4, '0')}`,
  address: `${index + 1} Test Street, Johannesburg`,
});

const generateTestDrawing = (index: number, projectId: string, uploadedBy: string): Partial<Drawing> => ({
  id: `${TEST_PREFIX}drawing_${index}`,
  projectId,
  name: `Test Drawing ${index}.dwg`,
  type: ['floor_plan', 'elevation', 'section', 'site_plan'][index % 4] as Drawing['type'],
  status: ['pending', 'in_review', 'approved', 'revision_needed'][index % 4] as Drawing['status'],
  fileUrl: `https://example.com/drawings/${TEST_PREFIX}drawing_${index}.dwg`,
  thumbnailUrl: `https://example.com/thumbnails/${TEST_PREFIX}drawing_${index}.png`,
  version: 1 + (index % 3),
  uploadedBy,
  uploadedAt: new Date(),
  fileSize: 1024 * 1024 * (1 + index * 0.5),
  dimensions: {
    width: 210 + index * 50,
    height: 297 + index * 50,
    unit: 'mm',
  },
  annotations: [],
});

const generateTestInvoice = (index: number, projectId: string, clientId: string, freelancerId: string): Partial<Invoice> => {
  const hoursTotal = 10 + index * 5;
  const hourlyRate = 75;
  const subtotal = hoursTotal * hourlyRate;
  const taxRate = 0.15;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  return {
    id: `${TEST_PREFIX}invoice_${index}`,
    invoiceNumber: `INV-TEST-${String(index).padStart(4, '0')}`,
    clientId,
    projectId,
    freelancerId,
    timeEntries: [],
    hoursTotal,
    hourlyRate,
    subtotal,
    taxRate,
    taxAmount,
    total,
    status: ['draft', 'sent', 'paid'][index % 3] as Invoice['status'],
    createdAt: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    notes: `Test invoice ${index} for development purposes.`,
  };
};

const generateTestTimeEntry = (index: number, projectId: string, freelancerId: string): Partial<TimeEntry> => ({
  id: `${TEST_PREFIX}time_${index}`,
  projectId,
  freelancerId,
  description: `Test work session ${index}`,
  hours: 2 + index * 0.5,
  date: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  invoiced: index % 3 === 0,
  invoiceId: index % 3 === 0 ? `${TEST_PREFIX}invoice_${index}` : undefined,
});

const generateTestComment = (index: number, projectId: string, userId: string): Partial<Comment> => ({
  id: `${TEST_PREFIX}comment_${index}`,
  projectId,
  userId,
  content: `This is test comment ${index} for development purposes.`,
  createdAt: new Date(Date.now() - index * 60 * 60 * 1000),
});

/**
 * Seed test data into Firebase
 * ⚠️ DEVELOPMENT ONLY - This function will throw in production
 */
export async function seedTestData(options?: {
  users?: number;
  projectsPerClient?: number;
  drawingsPerProject?: number;
  invoicesPerProject?: number;
}): Promise<SeededData> {
  const opts = {
    users: 3,
    projectsPerClient: 2,
    drawingsPerProject: 2,
    invoicesPerProject: 1,
    ...options,
  };

  // Prevent accidental production seeding
  guardProductionSeeding();

  console.log('[SeedData] Starting test data seeding...');

  const seededData: SeededData = {
    users: [],
    projects: [],
    drawings: [],
    invoices: [],
    timeEntries: [],
    comments: [],
  };

  try {
    // Create test users
    console.log('[SeedData] Creating test users...');
    const testUsers: { id: string; role: string }[] = [];

    for (let i = 0; i < opts.users; i++) {
      // Create one of each role
      const roles: ('admin' | 'client' | 'freelancer')[] = ['admin', 'client', 'freelancer'];
      for (const role of roles) {
        const userData = generateTestUser(role, i);
        const userRef = doc(db!, COLLECTIONS.USERS, userData.id!);
        await setDoc(userRef, {
          ...userData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: role === 'admin' ? serverTimestamp() : undefined,
        });
        seededData.users.push(userData.id!);
        testUsers.push({ id: userData.id!, role });
        console.log(`[SeedData] Created ${role} user: ${userData.id}`);
      }
    }

    // Get client and freelancer IDs
    const clientIds = testUsers.filter((u) => u.role === 'client').map((u) => u.id);
    const freelancerIds = testUsers.filter((u) => u.role === 'freelancer').map((u) => u.id);

    // Create test projects
    console.log('[SeedData] Creating test projects...');
    let projectIndex = 0;
    for (const clientId of clientIds) {
      for (let i = 0; i < opts.projectsPerClient; i++) {
        const freelancerId = freelancerIds[projectIndex % freelancerIds.length];
        const projectData = generateTestProject(projectIndex, clientId, freelancerId);
        const projectRef = doc(db!, COLLECTIONS.PROJECTS, projectData.id!);
        await setDoc(projectRef, {
          ...projectData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          deadline: Timestamp.fromDate(projectData.deadline!),
        });
        seededData.projects.push(projectData.id!);
        console.log(`[SeedData] Created project: ${projectData.id}`);

        // Create drawings for this project
        for (let d = 0; d < opts.drawingsPerProject; d++) {
          const drawingIndex = projectIndex * opts.drawingsPerProject + d;
          const drawingData = generateTestDrawing(drawingIndex, projectData.id!, freelancerId);
          const drawingRef = doc(db!, COLLECTIONS.DRAWINGS, drawingData.id!);
          await setDoc(drawingRef, {
            ...drawingData,
            uploadedAt: serverTimestamp(),
          });
          seededData.drawings.push(drawingData.id!);
        }

        // Create invoices for this project
        for (let inv = 0; inv < opts.invoicesPerProject; inv++) {
          const invoiceIndex = projectIndex * opts.invoicesPerProject + inv;
          const invoiceData = generateTestInvoice(invoiceIndex, projectData.id!, clientId, freelancerId);
          const invoiceRef = doc(db!, COLLECTIONS.INVOICES, invoiceData.id!);
          await setDoc(invoiceRef, {
            ...invoiceData,
            createdAt: serverTimestamp(),
            dueDate: Timestamp.fromDate(invoiceData.dueDate!),
          });
          seededData.invoices.push(invoiceData.id!);
        }

        // Create time entries
        for (let t = 0; t < 3; t++) {
          const timeIndex = projectIndex * 3 + t;
          const timeData = generateTestTimeEntry(timeIndex, projectData.id!, freelancerId);
          const timeRef = doc(db!, COLLECTIONS.TIME_ENTRIES, timeData.id!);
          await setDoc(timeRef, {
            ...timeData,
            date: Timestamp.fromDate(timeData.date!),
            createdAt: serverTimestamp(),
          });
          seededData.timeEntries.push(timeData.id!);
        }

        // Create comments
        for (let c = 0; c < 2; c++) {
          const commentIndex = projectIndex * 2 + c;
          const userId = c % 2 === 0 ? clientId : freelancerId;
          const commentData = generateTestComment(commentIndex, projectData.id!, userId);
          const commentRef = doc(db!, COLLECTIONS.COMMENTS, commentData.id!);
          await setDoc(commentRef, {
            ...commentData,
            createdAt: serverTimestamp(),
          });
          seededData.comments.push(commentData.id!);
        }

        projectIndex++;
      }
    }

    // Save tracking data
    saveSeededData(seededData);

    console.log('[SeedData] Seeding complete:', {
      users: seededData.users.length,
      projects: seededData.projects.length,
      drawings: seededData.drawings.length,
      invoices: seededData.invoices.length,
      timeEntries: seededData.timeEntries.length,
      comments: seededData.comments.length,
    });

    return seededData;
  } catch (error) {
    console.error('[SeedData] Seeding failed:', error);
    throw error;
  }
}

/**
 * Clear all test data from Firebase
 * ⚠️ DEVELOPMENT ONLY - This function will throw in production
 */
export async function clearTestData(): Promise<void> {
  // Prevent accidental production clearing
  guardProductionSeeding();

  console.log('[SeedData] Clearing test data...');

  const seededData = loadSeededData();
  const batch = writeBatch(db!);
  let deleteCount = 0;
  const BATCH_SIZE = 500; // Firestore batch limit

  const addToBatch = (collection: string, id: string) => {
    const ref = doc(db!, collection, id);
    batch.delete(ref);
    deleteCount++;

    if (deleteCount >= BATCH_SIZE) {
      throw new Error('Batch size limit reached - implement chunking if needed');
    }
  };

  try {
    // Delete all tracked documents
    seededData.users?.forEach((id) => addToBatch(COLLECTIONS.USERS, id));
    seededData.projects?.forEach((id) => addToBatch(COLLECTIONS.PROJECTS, id));
    seededData.drawings?.forEach((id) => addToBatch(COLLECTIONS.DRAWINGS, id));
    seededData.invoices?.forEach((id) => addToBatch(COLLECTIONS.INVOICES, id));
    seededData.timeEntries?.forEach((id) => addToBatch(COLLECTIONS.TIME_ENTRIES, id));
    seededData.comments?.forEach((id) => addToBatch(COLLECTIONS.COMMENTS, id));

    // Commit the batch
    await batch.commit();
    console.log(`[SeedData] Deleted ${deleteCount} documents`);

    // Clear localStorage tracking
    localStorage.removeItem(SEED_STORAGE_KEY);

    console.log('[SeedData] Clearing complete');
  } catch (error) {
    console.error('[SeedData] Clearing failed:', error);
    throw error;
  }
}

/**
 * Clear all test data by query (fallback method)
 * ⚠️ DEVELOPMENT ONLY - This function will throw in production
 */
export async function clearAllTestDataByQuery(): Promise<number> {
  // Prevent accidental production clearing
  guardProductionSeeding();

  console.log('[SeedData] Clearing all test data by query...');

  const collections = [
    COLLECTIONS.USERS,
    COLLECTIONS.PROJECTS,
    COLLECTIONS.DRAWINGS,
    COLLECTIONS.INVOICES,
    COLLECTIONS.TIME_ENTRIES,
    COLLECTIONS.COMMENTS,
  ];

  let totalDeleted = 0;

  for (const collectionName of collections) {
    try {
      const collRef = collection(db!, collectionName);
      const q = query(collRef, where('id', '>=', TEST_PREFIX), where('id', '<', TEST_PREFIX + '\uf8ff'));
      const snapshot = await getDocs(q);

      const batch = writeBatch(db!);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        totalDeleted++;
      });

      if (snapshot.docs.length > 0) {
        await batch.commit();
        console.log(`[SeedData] Deleted ${snapshot.docs.length} documents from ${collectionName}`);
      }
    } catch (error) {
      console.error(`[SeedData] Error clearing ${collectionName}:`, error);
    }
  }

  // Clear localStorage tracking
  localStorage.removeItem(SEED_STORAGE_KEY);

  console.log(`[SeedData] Total deleted: ${totalDeleted}`);
  return totalDeleted;
}

export default {
  seedTestData,
  clearTestData,
  clearAllTestDataByQuery,
  getSeededDataSummary,
};
