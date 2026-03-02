/**
 * Authentication Store
 * 
 * Manages authentication state using Firebase Auth.
 * Provides login, registration, and session management for three user types:
 * - Admin
 * - Client
 * - Freelancer
 * 
 * Firebase Integration:
 * - Uses Firebase Auth for email/password authentication
 * - Stores user profiles in Firestore
 * - Maintains session state with onAuthStateChanged
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserRole, Client, Freelancer, Admin } from '@/types';
import {
  auth,
  isFirebaseConfigured,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type FirebaseUser,
} from '@/services/firebase';
import {
  getUserById,
  updateUser,
  createClientUser,
  createFreelancerUser,
  createAdminUser,
  updateLastLogin,
} from '@/services/firebase/userService';

// Uploaded file type for onboarding
type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  preview?: string;
};

type PhysicalAddress = {
  street: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
};

// Full onboarding data type matching OnboardingScreen
type OnboardingData = {
  serviceType: string;
  customServiceDescription: string;
  propertyType: string;
  urgency: string;
  uploadedFiles: UploadedFile[];
  personalDetails: {
    firstName: string;
    surname: string;
    phoneNumber: string;
    email: string;
  };
  propertyDetails: {
    identifierType: 'erf' | 'stand';
    identifierNumber: string;
    physicalAddress: PhysicalAddress;
  };
};

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  firebaseUser: FirebaseUser | null;
  tempOnboardingData: OnboardingData | null;
  termsAccepted: boolean;
  termsAcceptedAt: Date | null;
  credentialsToNote: { email: string; password: string } | null;

  // Actions
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  setTempOnboardingData: (data: AuthState['tempOnboardingData']) => void;
  acceptTerms: () => void;
  clearError: () => void;
  setCredentialsToNote: (creds: AuthState['credentialsToNote']) => void;
  initializeAuth: () => () => void;
}

/**
 * Convert Firebase Auth user to our User type
 */
async function getUserFromFirebase(firebaseUser: FirebaseUser): Promise<User | null> {
  try {
    const userData = await getUserById(firebaseUser.uid);
    return userData;
  } catch (error) {
    console.error('[AuthStore] Error fetching user data:', error);
    return null;
  }
}

/**
 * Create role-specific user data
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
        role: 'client',
        totalHoursPurchased: 0,
        totalHoursUsed: 0,
        projects: [],
        paymentMethods: [],
      } as unknown as Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

    case 'freelancer':
      return {
        ...baseUser,
        role: 'freelancer',
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
        role: 'admin',
        permissions: ['all'],
        lastLogin: new Date(),
      } as unknown as Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

    default:
      throw new Error('Invalid user role');
  }
}

// ============ ZUSTAND STORE ============

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      firebaseUser: null,
      tempOnboardingData: null,
      termsAccepted: false,
      termsAcceptedAt: null,
      credentialsToNote: null,

      /**
       * Initialize authentication listener
       * Returns unsubscribe function
       */
      initializeAuth: () => {
        // Check if Firebase is configured
        if (!isFirebaseConfigured()) {
          console.warn('[AuthStore] Firebase not configured - authentication unavailable');
          set({
            isLoading: false,
            error: 'Authentication service unavailable. Please contact support.'
          });
          return () => { };
        }

        set({ isLoading: true });

        const unsubscribe = onAuthStateChanged(
          auth!,
          async (firebaseUser) => {
            if (firebaseUser) {
              const userData = await getUserFromFirebase(firebaseUser);
              if (userData) {
                set({
                  firebaseUser,
                  currentUser: userData,
                  isAuthenticated: true,
                  isLoading: false,
                });
              } else {
                // User exists in Auth but not in Firestore
                set({
                  firebaseUser,
                  currentUser: null,
                  isAuthenticated: false,
                  isLoading: false,
                  error: 'User profile not found',
                });
              }
            } else {
              set({
                firebaseUser: null,
                currentUser: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          },
          (error) => {
            console.error('[AuthStore] Auth state error:', error);
            set({
              firebaseUser: null,
              currentUser: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Authentication error',
            });
          }
        );

        return unsubscribe;
      },

      /**
       * Login user
       */
      login: async (email: string, password: string, role: UserRole) => {
        set({ isLoading: true, error: null });

        // Check if Firebase is configured
        if (!isFirebaseConfigured()) {
          set({
            error: 'Authentication service unavailable. Please contact support.',
            isLoading: false,
          });
          return false;
        }

        try {
          const userCredential = await signInWithEmailAndPassword(auth!, email, password);
          const firebaseUser = userCredential.user;

          // Fetch user data from Firestore
          const userData = await getUserById(firebaseUser.uid);

          if (!userData) {
            await firebaseSignOut(auth!);
            set({
              error: 'User profile not found',
              isLoading: false,
            });
            return false;
          }

          // Verify role matches
          if (userData.role !== role) {
            await firebaseSignOut(auth!);
            set({
              error: 'Invalid role selection for this account',
              isLoading: false,
            });
            return false;
          }

          // Update last login for admins
          if (userData.role === 'admin') {
            await updateLastLogin(firebaseUser.uid);
          }

          set({
            firebaseUser,
            currentUser: userData,
            isAuthenticated: true,
            isLoading: false,
          });

          return true;
        } catch (error) {
          console.error('[AuthStore] Login error:', error);

          let errorMessage = 'Login failed';
          if (error instanceof Error) {
            // Handle Firebase auth errors
            if (error.message.includes('auth/user-not-found')) {
              errorMessage = 'User not found';
            } else if (error.message.includes('auth/wrong-password')) {
              errorMessage = 'Invalid password';
            } else if (error.message.includes('auth/invalid-email')) {
              errorMessage = 'Invalid email address';
            } else if (error.message.includes('auth/too-many-requests')) {
              errorMessage = 'Too many failed attempts. Please try again later.';
            } else if (error.message.includes('auth/invalid-credential')) {
              errorMessage = 'Invalid email or password';
            }
          }

          set({
            error: errorMessage,
            isLoading: false,
          });
          return false;
        }
      },

      /**
       * Register new user
       */
      register: async (userData) => {
        set({ isLoading: true, error: null });

        // Check if Firebase is configured
        if (!isFirebaseConfigured()) {
          set({
            error: 'Authentication service unavailable. Please contact support.',
            isLoading: false,
          });
          return false;
        }

        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth!,
            userData.email!,
            userData.password
          );

          const firebaseUser = userCredential.user;

          // Update Firebase Auth profile
          if (userData.name) {
            await updateProfile(firebaseUser, {
              displayName: userData.name,
            });
          }

          // Create user document in Firestore
          const userProfileData = createRoleSpecificUserData(userData, firebaseUser.uid);

          let newUser: User;
          switch (userData.role) {
            case 'client':
              newUser = await createClientUser(firebaseUser.uid, userProfileData as unknown as Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'role'>);
              break;
            case 'freelancer':
              newUser = await createFreelancerUser(firebaseUser.uid, userProfileData as unknown as Omit<Freelancer, 'id' | 'createdAt' | 'updatedAt' | 'role'>);
              break;
            case 'admin':
              newUser = await createAdminUser(firebaseUser.uid, userProfileData as unknown as Omit<Admin, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'permissions'>);
              break;
            default:
              throw new Error('Invalid user role');
          }

          set({
            firebaseUser,
            currentUser: newUser,
            isAuthenticated: true,
            isLoading: false,
            credentialsToNote: { email: userData.email!, password: userData.password },
          });

          return true;
        } catch (error) {
          console.error('[AuthStore] Registration error:', error);

          let errorMessage = 'Registration failed';
          if (error instanceof Error) {
            if (error.message.includes('auth/email-already-in-use')) {
              errorMessage = 'Email already registered';
            } else if (error.message.includes('auth/invalid-email')) {
              errorMessage = 'Invalid email address';
            } else if (error.message.includes('auth/weak-password')) {
              errorMessage = 'Password is too weak';
            }
          }

          set({
            error: errorMessage,
            isLoading: false,
          });
          return false;
        }
      },

      /**
       * Logout user
       */
      logout: async () => {
        set({ isLoading: true });

        try {
          if (isFirebaseConfigured() && auth) {
            await firebaseSignOut(auth);
          }

          set({
            currentUser: null,
            isAuthenticated: false,
            firebaseUser: null,
            error: null,
            isLoading: false,
          });
        } catch (error) {
          console.error('[AuthStore] Logout error:', error);
          set({
            error: 'Logout failed',
            isLoading: false,
          });
        }
      },

      /**
       * Update user profile
       */
      updateUser: async (updates) => {
        const { currentUser, firebaseUser } = get();

        if (!currentUser) return;

        try {
          // Update in Firestore if using Firebase
          if (firebaseUser) {
            await updateUser(firebaseUser.uid, updates);
          }

          // Update local state
          set({
            currentUser: { ...currentUser, ...updates, updatedAt: new Date() },
          });
        } catch (error) {
          console.error('[AuthStore] Update user error:', error);
          set({ error: 'Failed to update profile' });
        }
      },

      /**
       * Set temporary onboarding data
       */
      setTempOnboardingData: (data) => set({ tempOnboardingData: data }),

      /**
       * Accept terms of use
       */
      acceptTerms: () => set({ termsAccepted: true, termsAcceptedAt: new Date() }),

      /**
       * Clear error message
       */
      clearError: () => set({ error: null }),

      /**
       * Set credentials to be noted/shown in a popup
       */
      setCredentialsToNote: (creds) => set({ credentialsToNote: creds }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        tempOnboardingData: state.tempOnboardingData,
        credentialsToNote: state.credentialsToNote,
      }),
      // Custom serialization/deserialization to handle Date objects
      onRehydrateStorage: () => (state) => {
        if (state?.currentUser) {
          // Restore Date objects from ISO strings
          const user = state.currentUser;
          if (user.createdAt && typeof user.createdAt === 'string') {
            user.createdAt = new Date(user.createdAt);
          }
          if (user.updatedAt && typeof user.updatedAt === 'string') {
            user.updatedAt = new Date(user.updatedAt);
          }
          // Handle role-specific date fields
          if ('lastLogin' in user && user.lastLogin && typeof user.lastLogin === 'string') {
            (user as Admin).lastLogin = new Date(user.lastLogin);
          }
        }
      },
    }
  )
);

// Initialize auth listener on app start
// This should be called in your app's entry point (e.g., main.tsx)
export function initializeAuth(): () => void {
  return useAuthStore.getState().initializeAuth();
}
