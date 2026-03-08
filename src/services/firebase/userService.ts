/**
 * User Service
 * 
 * Handles CRUD operations for user data in Firestore.
 * Supports the three user types: Admin, Client, and Freelancer.
 * 
 * Collection: users
 * Document ID: User UID (from Firebase Auth)
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  WriteBatch,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { User, UserRole, Client, Freelancer, Admin } from '@/types';

// Collection name
const USERS_COLLECTION = 'users';

// Type guard to check if user is configured
function _isFirebaseConfigured(): boolean {
  return !!db;
}

/**
 * Convert Firestore timestamp to Date
 */
function timestampToDate(timestamp: Timestamp | Date | undefined): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp || new Date();
}

/**
 * Convert Date to Firestore timestamp
 */
function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

/**
 * Serialize user data for Firestore storage
 * Removes undefined values and converts Dates to Timestamps
 */
function serializeUserData(user: Partial<User>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  
  Object.entries(user).forEach(([key, value]) => {
    if (value !== undefined) {
      if (value instanceof Date) {
        data[key] = dateToTimestamp(value);
      } else {
        data[key] = value;
      }
    }
  });
  
  return data;
}

/**
 * Deserialize user data from Firestore
 * Converts Timestamps to Dates
 */
function deserializeUserData(data: Record<string, unknown>): User {
  const user: Record<string, unknown> = { ...data };
  
  // Convert timestamps to dates
  if (data.createdAt) {
    user.createdAt = timestampToDate(data.createdAt as Timestamp);
  }
  if (data.updatedAt) {
    user.updatedAt = timestampToDate(data.updatedAt as Timestamp);
  }
  if (data.lastLogin) {
    user.lastLogin = timestampToDate(data.lastLogin as Timestamp);
  }
  
  return user as unknown as User;
}

/**
 * Create a new user document in Firestore
 * Called after successful Firebase Auth registration
 */
export async function createUser(
  uid: string,
  userData: Omit<User, 'id'>
): Promise<User> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const now = new Date();
    
    const newUser: User = {
      ...userData,
      id: uid,
      createdAt: now,
      updatedAt: now,
    } as User;

    await setDoc(userRef, serializeUserData(newUser));
    
    return newUser;
  } catch (error) {
    console.error('[UserService] Error creating user:', error);
    throw new Error('Failed to create user profile');
  }
}

/**
 * Get user by ID (UID)
 */
export async function getUserById(uid: string): Promise<User | null> {
  if (!db) {
    return null;
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return deserializeUserData({ id: userSnap.id, ...userSnap.data() });
    }

    return null;
  } catch (error) {
    console.error('[UserService] Error fetching user:', error);
    throw new Error('Failed to fetch user profile');
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  if (!db) {
    return null;
  }

  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('email', '==', email));
    const querySnap = await getDocs(q);

    if (!querySnap.empty) {
      const doc = querySnap.docs[0];
      return deserializeUserData({ id: doc.id, ...doc.data() });
    }

    return null;
  } catch (error) {
    console.error('[UserService] Error fetching user by email:', error);
    throw new Error('Failed to fetch user by email');
  }
}

/**
 * Update user data
 */
export async function updateUser(
  uid: string,
  updates: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const updateData = {
      ...serializeUserData(updates),
      updatedAt: dateToTimestamp(new Date()),
    };

    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('[UserService] Error updating user:', error);
    throw new Error('Failed to update user profile');
  }
}

/**
 * Delete user document
 * Note: Also need to delete Firebase Auth user separately
 */
export async function deleteUser(uid: string): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('[UserService] Error deleting user:', error);
    throw new Error('Failed to delete user profile');
  }
}

/**
 * Get all users by role
 */
export async function getUsersByRole(role: UserRole): Promise<User[]> {
  if (!db) {
    return [];
  }

  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('role', '==', role));
    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) =>
      deserializeUserData({ id: doc.id, ...doc.data() })
    );
  } catch (error) {
    console.error('[UserService] Error fetching users by role:', error);
    throw new Error('Failed to fetch users');
  }
}

/**
 * Get all clients
 */
export async function getAllClients(): Promise<Client[]> {
  const users = await getUsersByRole('client');
  return users as Client[];
}

/**
 * Get all freelancers
 */
export async function getAllFreelancers(): Promise<Freelancer[]> {
  const users = await getUsersByRole('freelancer');
  return users as Freelancer[];
}

/**
 * Get all admins
 */
export async function getAllAdmins(): Promise<Admin[]> {
  const users = await getUsersByRole('admin');
  return users as Admin[];
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(uid: string): Promise<void> {
  await updateUser(uid, {
    lastLogin: new Date(),
  } as Partial<User>);
}

/**
 * Batch update multiple users (for admin operations)
 */
export async function batchUpdateUsers(
  updates: Array<{ uid: string; data: Partial<User> }>
): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  try {
    const batch: WriteBatch = writeBatch(db);
    const now = dateToTimestamp(new Date());

    updates.forEach(({ uid, data }) => {
      const userRef = doc(db!, USERS_COLLECTION, uid);
      batch.update(userRef, {
        ...serializeUserData(data),
        updatedAt: now,
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('[UserService] Error in batch update:', error);
    throw new Error('Failed to batch update users');
  }
}

/**
 * Check if user exists by email
 */
export async function userExists(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  return user !== null;
}

/**
 * Type-specific user creation helpers
 */
export async function createClientUser(
  uid: string,
  data: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'role'>
): Promise<Client> {
  const clientData: Omit<Client, 'id'> = {
    ...data,
    role: 'client',
    totalHoursPurchased: 0,
    totalHoursUsed: 0,
    projects: [],
    paymentMethods: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  } as unknown as Omit<Client, 'id'>;

  return createUser(uid, clientData) as Promise<Client>;
}

export async function createFreelancerUser(
  uid: string,
  data: Omit<Freelancer, 'id' | 'createdAt' | 'updatedAt' | 'role'>
): Promise<Freelancer> {
  const freelancerData: Omit<Freelancer, 'id'> = {
    ...data,
    role: 'freelancer',
    totalHoursWorked: 0,
    totalEarnings: 0,
    rating: 0,
    availability: 'available',
    currentProjects: [],
    certifications: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  } as unknown as Omit<Freelancer, 'id'>;

  return createUser(uid, freelancerData) as Promise<Freelancer>;
}

export async function createAdminUser(
  uid: string,
  data: Omit<Admin, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'permissions'>
): Promise<Admin> {
  const adminData: Omit<Admin, 'id'> = {
    ...data,
    role: 'admin',
    permissions: ['all'],
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  } as unknown as Omit<Admin, 'id'>;

  return createUser(uid, adminData) as Promise<Admin>;
}
