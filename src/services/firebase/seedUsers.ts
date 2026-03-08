/**
 * Seed Users Script
 * 
 * Creates test user profiles in Firestore for development/testing.
 * Run this after creating the Firebase Auth accounts.
 * 
 * Users:
 * - admin@architex.co.za (Admin)
 * - freelancer@architex.co.za (Freelancer)
 * - client@architex.co.za (Client)
 */

import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/config/firebase';
import type { User, UserRole } from '@/types';

interface SeedUser {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  company?: string;
}

const SEED_USERS: SeedUser[] = [
  {
    email: 'admin@architex.co.za',
    password: 'Admin123!',
    name: 'System Administrator',
    role: 'admin',
    company: 'Architex Axis',
  },
  {
    email: 'freelancer@architex.co.za',
    password: 'Freelancer123!',
    name: 'John Freelancer',
    role: 'freelancer',
    company: 'Independent Contractor',
  },
  {
    email: 'client@architex.co.za',
    password: 'Client123!',
    name: 'Jane Client',
    role: 'client',
    company: 'Client Company Pty Ltd',
  },
];

/**
 * Create a user profile in Firestore
 */
const createUserProfile = async (uid: string, userData: SeedUser): Promise<void> => {
  if (!db) {
    throw new Error('Firebase Firestore not initialized');
  }
  const userRef = doc(db, 'users', uid);

  // Check if user already exists
  const existingUser = await getDoc(userRef);
  if (existingUser.exists()) {
    console.log(`[SeedUsers] User ${userData.email} already exists, skipping...`);
    return;
  }

  const profile: Omit<User, 'id'> = {
    email: userData.email,
    name: userData.name,
    role: userData.role,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.email)}`,
    phone: '',
    company: userData.company || '',
    address: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };

  await setDoc(userRef, {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  console.log(`[SeedUsers] Created ${userData.role} user: ${userData.email}`);
};

/**
 * Create a single user (Auth + Firestore)
 */
const createUser = async (userData: SeedUser): Promise<void> => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );

    // Create Firestore profile
    await createUserProfile(userCredential.user.uid, userData);

    console.log(`[SeedUsers] ✓ Successfully created user: ${userData.email}`);
  } catch (error: unknown) {
    const err = error as { code?: string, message?: string };
    if (err.code === 'auth/email-already-in-use') {
      console.log(`[SeedUsers] User ${userData.email} already exists in Auth`);
    } else {
      console.error(`[SeedUsers] Error creating user ${userData.email}:`, err.message);
    }
  }
};

/**
 * Seed all test users
 */
export const seedUsers = async (): Promise<void> => {
  console.log('[SeedUsers] Starting to seed test users...');

  for (const user of SEED_USERS) {
    await createUser(user);
  }

  console.log('[SeedUsers] Seeding complete!');
  console.log('[SeedUsers] User credentials:');
  SEED_USERS.forEach(u => {
    console.log(`  ${u.role}: ${u.email} / ${u.password}`);
  });
};

/**
 * Create only Firestore profiles (for users that already exist in Auth)
 * Use this if you've manually created users in Firebase Console
 */
export const seedFirestoreProfilesOnly = async (users: Array<{ uid: string; email: string; role: UserRole }>): Promise<void> => {
  console.log('[SeedUsers] Creating Firestore profiles only...');

  for (const user of users) {
    const seedUser = SEED_USERS.find(u => u.email === user.email);
    if (seedUser) {
      await createUserProfile(user.uid, seedUser);
    }
  }

  console.log('[SeedUsers] Firestore profile seeding complete!');
};

// Export individual user data for reference
export const TEST_USERS = SEED_USERS;

// Default passwords for reference
export const DEFAULT_PASSWORDS = {
  admin: 'Admin123!',
  freelancer: 'Freelancer123!',
  client: 'Client123!',
};
