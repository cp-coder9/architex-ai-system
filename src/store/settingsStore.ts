import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings, User, UserRole } from '@/types';

interface SettingsState {
  settings: Record<string, Settings>;
  users: User[];
  isLoading: boolean;
  
  // Settings actions
  getSettings: (userId: string) => Settings;
  updateSettings: (userId: string, updates: Partial<Settings>) => void;
  resetSettings: (userId: string) => void;
  
  // User management actions (admin only)
  getAllUsers: () => User[];
  getUsersByRole: (role: UserRole) => User[];
  createUser: (userData: Partial<User>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  activateUser: (id: string) => void;
  deactivateUser: (id: string) => void;
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

// Generate mock users
const generateMockUsers = (): User[] => [
  {
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
  },
  {
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
  },
  {
    id: 'client-2',
    email: 'jane.doe@buildcorp.com',
    name: 'Jane Doe',
    role: 'client',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
    isActive: true,
    phone: '+1 (555) 234-5678',
    company: 'BuildCorp Development',
  },
  {
    id: 'freelancer-1',
    email: 'freelancer@example.com',
    name: 'Sarah Johnson',
    role: 'freelancer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=freelancer',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
    isActive: true,
    phone: '+1 (555) 987-6543',
  },
  {
    id: 'freelancer-2',
    email: 'mike.chen@designpro.com',
    name: 'Mike Chen',
    role: 'freelancer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date(),
    isActive: true,
    phone: '+1 (555) 876-5432',
  },
  {
    id: 'freelancer-3',
    email: 'emma.wilson@archstudio.com',
    name: 'Emma Wilson',
    role: 'freelancer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date(),
    isActive: false,
    phone: '+1 (555) 765-4321',
  },
];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: {},
      users: generateMockUsers(),
      isLoading: false,

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
        set({ isLoading: true });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const newUser: User = {
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
          address: userData.address,
        };
        
        set(state => ({ 
          users: [...state.users, newUser],
          isLoading: false 
        }));
        
        return newUser;
      },

      updateUser: (id, updates) => {
        set(state => ({
          users: state.users.map(u => 
            u.id === id ? { ...u, ...updates, updatedAt: new Date() } : u
          ),
        }));
      },

      deleteUser: (id) => {
        set(state => ({
          users: state.users.filter(u => u.id !== id),
        }));
      },

      activateUser: (id) => {
        set(state => ({
          users: state.users.map(u => 
            u.id === id ? { ...u, isActive: true, updatedAt: new Date() } : u
          ),
        }));
      },

      deactivateUser: (id) => {
        set(state => ({
          users: state.users.map(u => 
            u.id === id ? { ...u, isActive: false, updatedAt: new Date() } : u
          ),
        }));
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
