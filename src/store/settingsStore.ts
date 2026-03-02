import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings, User, UserRole } from '@/types';
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
  createUser: (userData: Partial<User>) => Promise<User>;
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

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: {},
      users: [],
      isLoading: false,
      error: null,
      unsubscribeUsers: null,

      initialize: () => {
        if (!isFirebaseConfigured() || !db) {
          console.warn('[SettingsStore] Firebase not configured, using empty arrays');
          return;
        }

        set({ isLoading: true, error: null });

        // Subscribe to users collection
        const usersQuery = query(
          collection(db, USERS_COLLECTION),
          orderBy('createdAt', 'desc')
        );

        const unsubscribeUsers = onSnapshot(
          usersQuery,
          (snapshot) => {
            const users = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as User[];
            set({ users, isLoading: false });
          },
          (error) => {
            console.error('[SettingsStore] Error fetching users:', error);
            set({ error: 'Failed to fetch users', isLoading: false });
          }
        );

        set({ unsubscribeUsers });
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
        if (!isFirebaseConfigured() || !db) {
          console.warn('[SettingsStore] Firebase not configured');
          throw new Error('Firebase not configured');
        }

        set({ isLoading: true });

        try {
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

          const docRef = await addDoc(collection(db, USERS_COLLECTION), newUser);

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
