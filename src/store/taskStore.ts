import { create } from 'zustand';
import { Task, TaskApplication, TaskMilestone } from '@/types';

// Sample data for demonstration
const sampleTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Floor Plan Compliance Review',
    description: 'Review and verify floor plan compliance with SANS 10400 regulations',
    category: 'Architecture',
    requiredSkills: ['Floor Plan Analysis', 'SANS 10400', 'Building Regulations'],
    experienceLevel: 'expert',
    estimatedHours: 20,
    hourlyRate: 500,
    budget: 10000,
    status: 'open',
    postedBy: 'admin-1',
    postedAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    milestones: [],
  },
  {
    id: 'task-2',
    title: 'Structural Drawing Verification',
    description: 'Verify structural drawings meet municipal requirements',
    category: 'Structural',
    requiredSkills: ['Structural Engineering', 'Municipal Requirements', 'CAD'],
    experienceLevel: 'intermediate',
    estimatedHours: 15,
    hourlyRate: 450,
    budget: 6750,
    status: 'open',
    postedBy: 'admin-1',
    postedAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    milestones: [],
  },
];

const sampleApplications: TaskApplication[] = [];

interface TaskState {
  tasks: Task[];
  applications: TaskApplication[];
  isLoading: boolean;
  error: string | null;
  
  // Task CRUD
  addTask: (task: Omit<Task, 'id' | 'postedAt' | 'status' | 'milestones'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  getTaskById: (taskId: string) => Task | undefined;
  
  // Application CRUD
  submitApplication: (application: Omit<TaskApplication, 'id' | 'appliedAt' | 'status'>) => void;
  updateApplicationStatus: (applicationId: string, status: TaskApplication['status'], adminNotes?: string) => void;
  withdrawApplication: (applicationId: string) => void;
  getApplicationsByTaskId: (taskId: string) => TaskApplication[];
  getApplicationsByFreelancerId: (freelancerId: string) => TaskApplication[];
  
  // Task status management
  assignFreelancer: (taskId: string, freelancerId: string, applicationId: string) => void;
  updateMilestoneStatus: (taskId: string, milestoneId: string, status: TaskMilestone['status']) => void;
  completeTask: (taskId: string) => void;
  
  // Filtering
  getOpenTasks: () => Task[];
  getTasksByCategory: (category: string) => Task[];
  getMyTasks: (freelancerId: string) => Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: sampleTasks,
  applications: sampleApplications,
  isLoading: false,
  error: null,
  
  addTask: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      postedAt: new Date().toISOString(),
      status: 'open',
      milestones: [],
    };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
  },
  
  updateTask: (taskId, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    }));
  },
  
  deleteTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    }));
  },
  
  getTaskById: (taskId) => {
    return get().tasks.find((task) => task.id === taskId);
  },
  
  submitApplication: (applicationData) => {
    const newApplication: TaskApplication = {
      ...applicationData,
      id: `app-${Date.now()}`,
      appliedAt: new Date().toISOString(),
      status: 'pending',
    };
    set((state) => ({ applications: [...state.applications, newApplication] }));
  },
  
  updateApplicationStatus: (applicationId, status, adminNotes) => {
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === applicationId
          ? { ...app, status, adminNotes, respondedAt: new Date().toISOString() }
          : app
      ),
    }));
  },
  
  withdrawApplication: (applicationId) => {
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === applicationId ? { ...app, status: 'withdrawn' } : app
      ),
    }));
  },
  
  getApplicationsByTaskId: (taskId) => {
    return get().applications.filter((app) => app.taskId === taskId);
  },
  
  getApplicationsByFreelancerId: (freelancerId) => {
    return get().applications.filter((app) => app.freelancerId === freelancerId);
  },
  
  assignFreelancer: (taskId, freelancerId, applicationId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, assignedTo: freelancerId, selectedApplicationId: applicationId, status: 'in_progress' as const }
          : task
      ),
      applications: state.applications.map((app) =>
        app.taskId === taskId
          ? { ...app, status: app.id === applicationId ? 'accepted' : 'rejected' as const, respondedAt: new Date().toISOString() }
          : app
      ),
    }));
  },
  
  updateMilestoneStatus: (taskId, milestoneId, status) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              milestones: task.milestones.map((m) =>
                m.id === milestoneId ? { ...m, status } : m
              ),
            }
          : task
      ),
    }));
  },
  
  completeTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, status: 'completed' } : task
      ),
    }));
  },
  
  getOpenTasks: () => {
    return get().tasks.filter((task) => task.status === 'open');
  },
  
  getTasksByCategory: (category) => {
    return get().tasks.filter((task) => task.category === category);
  },
  
  getMyTasks: (freelancerId) => {
    return get().tasks.filter((task) => task.assignedTo === freelancerId);
  },
}));
