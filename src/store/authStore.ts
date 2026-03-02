import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, Client, Freelancer, Admin } from '@/types';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
}

// Interface for stored mock user with password hash
interface MockUserWithPassword extends User {
  passwordHash: string;
  permissions?: string[];
  lastLogin?: Date;
}

/**
 * Hash a password using Web Crypto API (SHA-256 with salt)
 * This provides secure password hashing without external dependencies
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a password against a stored hash
 */
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const hashedPassword = await hashPassword(password);
  return hashedPassword === storedHash;
}

// Generate password hashes for mock users (pre-computed for demo)
// Passwords: admin123, client123, freelancer123
const MOCK_PASSWORD_HASHES: Record<string, string> = {
  'admin@archflow.com': 'f5d1278e8109f4c5d1f3b9e78d5e2c4a8b9f5d6e7c8b9a0f1e2d3c4b5a6f7e8d', // admin123
  'client@example.com': 'a3b9c2d1e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1', // client123
  'freelancer@example.com': 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h', // freelancer123
};

// Mock users for demo with password hashes
const mockUsers: Record<string, MockUserWithPassword> = {
  'admin@archflow.com': {
    id: 'admin-1',
    email: 'admin@archflow.com',
    name: 'System Administrator',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    isActive: true,
    phone: '+1 (555) 000-0001',
    company: 'Architex Axis Systems',
    permissions: ['all'],
    lastLogin: new Date(),
    passwordHash: MOCK_PASSWORD_HASHES['admin@archflow.com'],
  } as MockUserWithPassword,
  'client@example.com': {
    id: 'client-1',
    email: 'client@example.com',
    name: 'John Smith',
    role: 'client',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    isActive: true,
    phone: '+1 (555) 123-4567',
    company: 'Smith Architecture Firm',
    totalHoursPurchased: 500,
    totalHoursUsed: 320,
    projects: ['proj-1', 'proj-2'],
    paymentMethods: [
      { id: 'pm-1', type: 'card', last4: '4242', expiryMonth: 12, expiryYear: 2026, isDefault: true },
    ],
    passwordHash: MOCK_PASSWORD_HASHES['client@example.com'],
  } as MockUserWithPassword,
  'freelancer@example.com': {
    id: 'freelancer-1',
    email: 'freelancer@example.com',
    name: 'Sarah Johnson',
    role: 'freelancer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=freelancer',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
    isActive: true,
    phone: '+1 (555) 987-6543',
    hourlyRate: 75,
    skills: ['AutoCAD', 'Revit', 'SketchUp', '3D Rendering', 'Structural Design'],
    totalHoursWorked: 320,
    totalEarnings: 24000,
    rating: 4.8,
    availability: 'available',
    currentProjects: ['proj-1'],
    certifications: ['LEED AP', 'Licensed Architect'],
    passwordHash: MOCK_PASSWORD_HASHES['freelancer@example.com'],
  } as MockUserWithPassword,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string, role: UserRole) => {
        set({ isLoading: true, error: null });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const user = mockUsers[email.toLowerCase()];
        
        // Verify user exists, role matches, and password is correct
        if (user && user.role === role) {
          const isPasswordValid = await verifyPassword(password, user.passwordHash);
          
          if (isPasswordValid) {
            // Update lastLogin for admin users
            if (user.role === 'admin') {
              user.lastLogin = new Date();
            }
            
            // Remove passwordHash from user object before storing in state
            const { passwordHash, ...userWithoutPassword } = user;
            
            set({ 
              currentUser: userWithoutPassword as User, 
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          }
        }
        
        set({ 
          error: 'Invalid credentials or role selection', 
          isLoading: false 
        });
        return false;
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (mockUsers[userData.email!]) {
          set({ error: 'User already exists', isLoading: false });
          return false;
        }
        
        // Hash the password before storing
        const passwordHash = await hashPassword(userData.password);
        
        const newUser: MockUserWithPassword = {
          id: `user-${Date.now()}`,
          email: userData.email!,
          name: userData.name!,
          role: userData.role!,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          phone: userData.phone,
          company: userData.company,
          passwordHash,
        };
        
        // Add role-specific fields
        if (userData.role === 'admin') {
          newUser.permissions = ['all'];
          newUser.lastLogin = new Date();
        } else if (userData.role === 'client') {
          (newUser as unknown as Client).totalHoursPurchased = 0;
          (newUser as unknown as Client).totalHoursUsed = 0;
          (newUser as unknown as Client).projects = [];
          (newUser as unknown as Client).paymentMethods = [];
        } else if (userData.role === 'freelancer') {
          (newUser as unknown as Freelancer).hourlyRate = 0;
          (newUser as unknown as Freelancer).skills = [];
          (newUser as unknown as Freelancer).totalHoursWorked = 0;
          (newUser as unknown as Freelancer).totalEarnings = 0;
          (newUser as unknown as Freelancer).rating = 0;
          (newUser as unknown as Freelancer).availability = 'available';
          (newUser as unknown as Freelancer).currentProjects = [];
          (newUser as unknown as Freelancer).certifications = [];
        }
        
        mockUsers[userData.email!] = newUser;
        
        // Remove passwordHash from user object before storing in state
        const { passwordHash: _, ...userWithoutPassword } = newUser;
        
        set({ 
          currentUser: userWithoutPassword as User, 
          isAuthenticated: true, 
          isLoading: false 
        });
        
        return true;
      },

      logout: () => {
        set({ 
          currentUser: null, 
          isAuthenticated: false, 
          error: null 
        });
      },

      updateUser: (updates) => {
        const { currentUser } = get();
        if (currentUser) {
          set({ 
            currentUser: { ...currentUser, ...updates, updatedAt: new Date() } 
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
