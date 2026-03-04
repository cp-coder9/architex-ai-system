import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings, User, UserRole, Client, Freelancer, Admin } from '@/types';
import { db, isFirebaseConfigured } from '@/config/firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  createClientUser,
  createFreelancerUser,
  createAdminUser,
} from '@/services/firebase/userService';

interface SettingsState {
  settings: Record<string, Settings>;
  users: User[];
  isLoading: boolean;
  error: string | null;
  unsubscribeUsers: Unsubscribe | null;

  // Initialization
  initialize: () => void;
  cleanup: () => void;

  // Settings actions
  getSettings: (userId: string) => Settings;
  updateSettings: (userId: string, updates: Partial<Settings>) => void;
  resetSettings: (userId: string) => void;

  // User management actions (admin only)
  getAllUsers: () => User[];
  getUsersByRole: (role: UserRole) => User[];
  createUser: (userData: Partial<User> & { password?: string }) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  activateUser: (id: string) => Promise<void>;
  deactivateUser: (id: string) => Promise<void>;
  getUserById: (id: string) => User | undefined;
  getUserStats: () => { total: number; byRole: Record<UserRole, number>; active: number };
}

const defaultSettings: Settings = {
  userId: '',
  theme: 'system',
  language: 'en',
  timezone: 'America/New_York',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  emailNotifications: {
    projectUpdates: true,
    drawingStatus: true,
    agentChecks: true,
    invoices: true,
    messages: true,
    marketing: false,
  },
  pushNotifications: {
    enabled: true,
    projectUpdates: true,
    drawingStatus: true,
    messages: true,
  },
};

// Collection name
const USERS_COLLECTION = 'users';

/**
 * Create role-specific user data for Firestore
 */
function createRoleSpecificUserData(
  userData: Partial<User>,
  uid: string
): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
  const baseUser: Record<string, unknown> = {
    email: userData.email!,
    name: userData.name!,
    role: userData.role!,
    avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
    isActive: true,
  };

  // Only add optional fields if they have values (avoid undefined)
  if (userData.phone) baseUser.phone = userData.phone;
  if (userData.company) baseUser.company = userData.company;
  if (userData.address) baseUser.address = userData.address;

  switch (userData.role) {
    case 'client':
      return {
        ...baseUser,
        role: 'client' as const,
        totalHoursPurchased: 0,
        totalHoursUsed: 0,
        projects: [],
        paymentMethods: [],
      } as unknown as Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

    case 'freelancer':
      return {
        ...baseUser,
        role: 'freelancer' as const,
        hourlyRate: (userData as unknown as Freelancer).hourlyRate || 0,
        skills: (userData as unknown as Freelancer).skills || [],
        totalHoursWorked: 0,
        totalEarnings: 0,
        rating: 0,
        availability: 'available',
        currentProjects: [],
        certifications: (userData as unknown as Freelancer).certifications || [],
      } as unknown as Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

    case 'admin':
      return {
        ...baseUser,
        role: 'admin' as const,
        permissions: ['all'],
        lastLogin: new Date(),
      } as unknown as Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

    default:
      throw new Error('Invalid user role');
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: {},
      users: [],
      isLoading: false,
      error: null,
      unsubscribeUsers: null,

      initialize: () => {
        console.log('[SettingsStore] initialize() called');
        
        if (!isFirebaseConfigured() || !db) {
          console.warn('[SettingsStore] Firebase not configured, using empty arrays');
          console.log('[SettingsStore] isFirebaseConfigured:', isFirebaseConfigured());
          console.log('[SettingsStore] db:', db);
          return;
        }

        console.log('[SettingsStore] Firebase configured, setting up listeners...');
        set({ isLoading: true, error: null });

        // Subscribe to users collection
        const usersQuery = query(
          collection(db, USERS_COLLECTION),
          orderBy('createdAt', 'desc')
        );

        console.log('[SettingsStore] Setting up onSnapshot listener for users collection...');
        
        const unsubscribeUsers = onSnapshot(
          usersQuery,
          (snapshot) => {
            const rawUsers = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            console.log(`[SettingsStore] onSnapshot received ${rawUsers.length} users`);
            console.log('[SettingsStore] Raw users data:', rawUsers);
            
            const users = rawUsers as User[];
            set({ users, isLoading: false });
          },
          (error) => {
            console.error('[SettingsStore] Error fetching users:', error);
            set({ error: 'Failed to fetch users', isLoading: false });
          }
        );

        set({ unsubscribeUsers });
        console.log('[SettingsStore] Listeners set up successfully');
      },

      cleanup: () => {
        const { unsubscribeUsers } = get();
        if (unsubscribeUsers) {
          unsubscribeUsers();
        }
        set({ unsubscribeUsers: null });
      },

      getSettings: (userId) => {
        return get().settings[userId] || { ...defaultSettings, userId };
      },

      updateSettings: (userId, updates) => {
        set(state => ({
          settings: {
            ...state.settings,
            [userId]: {
              ...state.getSettings(userId),
              ...updates,
            },
          },
        }));
      },

      resetSettings: (userId) => {
        set(state => ({
          settings: {
            ...state.settings,
            [userId]: { ...defaultSettings, userId },
          },
        }));
      },

      getAllUsers: () => get().users,

      getUsersByRole: (role) => {
        return get().users.filter(u => u.role === role);
      },

      createUser: async (userData) => {
        console.log('[SettingsStore] createUser called with:', userData);
        
        const { auth, isFirebaseConfigured: isAuthConfigured } = await import('@/config/firebase');
        
        if (!isFirebaseConfigured() || !db) {
          console.warn('[SettingsStore] Firebase not configured');
          throw new Error('Firebase not configured');
        }

        set({ isLoading: true });

        try {
          // If password is provided, create user in Firebase Auth first
          if (userData.password && isAuthConfigured() && auth) {
            console.log('[SettingsStore] Creating user in Firebase Auth...');
            
            const userCredential = await createUserWithEmailAndPassword(
              auth,
              userData.email!,
              userData.password
            );
            
            const firebaseUid = userCredential.user.uid;
            console.log('[SettingsStore] Firebase Auth user created with UID:', firebaseUid);

            // Update display name
            if (userData.name) {
              await updateProfile(userCredential.user, {
                displayName: userData.name,
              });
              console.log('[SettingsStore] Updated Firebase Auth profile');
            }

            // Create role-specific user data in Firestore
            const userProfileData = createRoleSpecificUserData(userData, firebaseUid);
            
            let newUser: User;
            switch (userData.role) {
              case 'client':
                newUser = await createClientUser(firebaseUid, userProfileData as unknown as Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'role'>);
                break;
              case 'freelancer':
                newUser = await createFreelancerUser(firebaseUid, userProfileData as unknown as Omit<Freelancer, 'id' | 'createdAt' | 'updatedAt' | 'role'>);
                break;
              case 'admin':
                newUser = await createAdminUser(firebaseUid, userProfileData as unknown as Omit<Admin, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'permissions'>);
                break;
              default:
                throw new Error('Invalid user role');
            }

            console.log('[SettingsStore] User created successfully:', newUser.id);
            set({ isLoading: false });
            return newUser;
          }
          
          // Fallback: Create only Firestore document (legacy behavior without Auth)
          console.log('[SettingsStore] No password provided, creating Firestore document only (legacy mode)');
          
          const newUser: Record<string, unknown> = {
            email: userData.email!,
            name: userData.name!,
            role: userData.role!,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isActive: true,
          };

          // Only add optional fields if they have values
          if (userData.phone) newUser.phone = userData.phone;
          if (userData.company) newUser.company = userData.company;
          if (userData.address) newUser.address = userData.address;

          console.log('[SettingsStore] Adding user to Firestore:', newUser);
          const docRef = await addDoc(collection(db, USERS_COLLECTION), newUser);
          console.log('[SettingsStore] User created with ID:', docRef.id);

          const createdUser: User = {
            id: docRef.id,
            ...newUser,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as User;

          set({ isLoading: false });
          return createdUser;
        } catch (error) {
          console.error('[SettingsStore] Error creating user:', error);
          set({ error: 'Failed to create user', isLoading: false });
          throw error;
        }
      },

      updateUser: async (id, updates) => {
        if (!isFirebaseConfigured() || !db) {
          console.warn('[SettingsStore] Firebase not configured');
          return;
        }

        try {
          const userRef = doc(db, USERS_COLLECTION, id);
          await updateDoc(userRef, {
            ...updates,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          console.error('[SettingsStore] Error updating user:', error);
          set({ error: 'Failed to update user' });
          throw error;
        }
      },

      deleteUser: async (id) => {
        if (!isFirebaseConfigured() || !db) {
          console.warn('[SettingsStore] Firebase not configured');
          return;
        }

        try {
          await deleteDoc(doc(db, USERS_COLLECTION, id));
        } catch (error) {
          console.error('[SettingsStore] Error deleting user:', error);
          set({ error: 'Failed to delete user' });
          throw error;
        }
      },

      activateUser: async (id) => {
        if (!isFirebaseConfigured() || !db) {
          console.warn('[SettingsStore] Firebase not configured');
          return;
        }

        try {
          const userRef = doc(db, USERS_COLLECTION, id);
          await updateDoc(userRef, {
            isActive: true,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          console.error('[SettingsStore] Error activating user:', error);
          set({ error: 'Failed to activate user' });
          throw error;
        }
      },

      deactivateUser: async (id) => {
        if (!isFirebaseConfigured() || !db) {
          console.warn('[SettingsStore] Firebase not configured');
          return;
        }

        try {
          const userRef = doc(db, USERS_COLLECTION, id);
          await updateDoc(userRef, {
            isActive: false,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          console.error('[SettingsStore] Error deactivating user:', error);
          set({ error: 'Failed to deactivate user' });
          throw error;
        }
      },

      getUserById: (id) => {
        return get().users.find(u => u.id === id);
      },

      getUserStats: () => {
        const users = get().users;
        return {
          total: users.length,
          byRole: {
            admin: users.filter(u => u.role === 'admin').length,
            client: users.filter(u => u.role === 'client').length,
            freelancer: users.filter(u => u.role === 'freelancer').length,
          },
          active: users.filter(u => u.isActive).length,
        };
      },
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
