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
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { db, auth } from '@/config/firebase';
import type { User, UserRole } from '@/types';

interface SeedUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyName?: string;
}

const SEED_USERS: SeedUser[] = [
  {
    email: 'admin@architex.co.za',
    password: 'Admin123!',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    companyName: 'Architex Axis',
  },
  {
    email: 'freelancer@architex.co.za',
    password: 'Freelancer123!',
    firstName: 'John',
    lastName: 'Freelancer',
    role: 'freelancer',
    companyName: 'Independent Contractor',
  },
  {
    email: 'client@architex.co.za',
    password: 'Client123!',
    firstName: 'Jane',
    lastName: 'Client',
    role: 'client',
    companyName: 'Client Company Pty Ltd',
  },
];

/**
 * Create a user profile in Firestore
 */
const createUserProfile = async (uid: string, userData: SeedUser): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  
  // Check if user already exists
  const existingUser = await getDoc(userRef);
  if (existingUser.exists()) {
    console.log(`[SeedUsers] User ${userData.email} already exists, skipping...`);
    return;
  }

  const profile: Omit<User, 'id'> = {
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    fullName: `${userData.firstName} ${userData.lastName}`,
    role: userData.role,
    companyName: userData.companyName || '',
    profileImage: '',
    phone: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
    isActive: true,
    hourlyRate: userData.role === 'freelancer' ? 250 : undefined, // ZAR 250/hr for freelancers
    specialization: userData.role === 'freelancer' ? ['Architectural Drawings', '3D Modeling'] : undefined,
    bio: userData.role === 'freelancer' 
      ? 'Experienced architectural drafter with expertise in SANS 10400 compliance.'
      : undefined,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'South Africa',
    },
    preferences: {
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      theme: 'system',
      language: 'en',
    },
    // Client-specific fields
    availableHours: userData.role === 'client' ? 0 : undefined,
    totalSpent: userData.role === 'client' ? 0 : undefined,
    // Freelancer-specific fields
    rating: userData.role === 'freelancer' ? 5.0 : undefined,
    totalProjects: userData.role === 'freelancer' ? 0 : undefined,
    completedProjects: userData.role === 'freelancer' ? 0 : undefined,
    earnings: userData.role === 'freelancer' ? 0 : undefined,
    // Admin-specific fields
    permissions: userData.role === 'admin' 
      ? ['manage_users', 'manage_projects', 'manage_finances', 'system_settings'] 
      : undefined,
  };

  await setDoc(userRef, {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
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
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`[SeedUsers] User ${userData.email} already exists in Auth`);
      // Try to create Firestore profile anyway (in case Auth exists but Firestore doesn't)
      try {
        // We can't get the UID without signing in, so we'll skip this case
        console.log(`[SeedUsers] Skipping Firestore profile for existing user`);
      } catch (e) {
        console.error(`[SeedUsers] Error creating profile:`, e);
      }
    } else {
      console.error(`[SeedUsers] Error creating user ${userData.email}:`, error.message);
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
