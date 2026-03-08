import { create } from 'zustand';
import { Task, TaskApplication, TaskMilestone } from '@/types';
import { db, isFirebaseConfigured } from '@/config/firebase';
import {
  collection,
  doc,
  _getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';


// Collection names
const TASKS_COLLECTION = 'tasks';
const APPLICATIONS_COLLECTION = 'taskApplications';

interface TaskState {
  tasks: Task[];
  applications: TaskApplication[];
  isLoading: boolean;
  error: string | null;
  unsubscribeTasks: Unsubscribe | null;
  unsubscribeApplications: Unsubscribe | null;

  // Initialization
  initialize: (userId: string, role: string) => void;
  cleanup: () => void;

  // Task CRUD
  addTask: (task: Omit<Task, 'id' | 'postedAt' | 'status' | 'milestones'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  getTaskById: (taskId: string) => Task | undefined;

  // Application CRUD
  submitApplication: (application: Omit<TaskApplication, 'id' | 'appliedAt' | 'status'>) => Promise<void>;
  updateApplicationStatus: (applicationId: string, status: TaskApplication['status'], adminNotes?: string) => Promise<void>;
  withdrawApplication: (applicationId: string) => Promise<void>;
  getApplicationsByTaskId: (taskId: string) => TaskApplication[];
  getApplicationsByFreelancerId: (freelancerId: string) => TaskApplication[];

  // Task status management
  assignFreelancer: (taskId: string, freelancerId: string, applicationId: string) => Promise<void>;
  updateMilestoneStatus: (taskId: string, milestoneId: string, status: TaskMilestone['status']) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;

  // Filtering
  getOpenTasks: () => Task[];
  getTasksByCategory: (category: string) => Task[];
  getMyTasks: (freelancerId: string) => Task[];
}

// Helper to convert Firestore timestamps
function convertTimestamps(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  if (result.postedAt instanceof Timestamp) {
    result.postedAt = result.postedAt.toDate().toISOString();
  }
  if (result.deadline instanceof Timestamp) {
    result.deadline = result.deadline.toDate().toISOString();
  }
  if (result.appliedAt instanceof Timestamp) {
    result.appliedAt = result.appliedAt.toDate().toISOString();
  }
  if (result.respondedAt instanceof Timestamp) {
    result.respondedAt = result.respondedAt.toDate().toISOString();
  }
  return result;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  applications: [],
  isLoading: false,
  error: null,
  unsubscribeTasks: null,
  unsubscribeApplications: null,

  initialize: (userId: string, role: string) => {
    if (!isFirebaseConfigured() || !db) {
      console.warn('[TaskStore] Firebase not configured, using empty arrays');
      return;
    }

    set({ isLoading: true, error: null });

    // Build Tasks Query
    let tasksQuery;
    if (role === 'admin') {
      tasksQuery = query(collection(db, TASKS_COLLECTION), orderBy('postedAt', 'desc'));
    } else if (role === 'freelancer') {
      // Freelancers see all open tasks + their assigned tasks
      tasksQuery = query(collection(db, TASKS_COLLECTION), orderBy('postedAt', 'desc'));
    } else {
      // Clients see tasks related to their projects
      tasksQuery = query(collection(db, TASKS_COLLECTION), orderBy('postedAt', 'desc'));
    }

    const unsubscribeTasks = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const tasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestamps(doc.data()),
        })) as Task[];
        set({ tasks, isLoading: false });
      },
      (error) => {
        console.error('[TaskStore] Error fetching tasks:', error);
        set({ error: 'Failed to fetch tasks', isLoading: false });
      }
    );

    // Build Applications Query
    let applicationsQuery;
    if (role === 'admin') {
      applicationsQuery = query(collection(db, APPLICATIONS_COLLECTION), orderBy('appliedAt', 'desc'));
    } else if (role === 'freelancer') {
      applicationsQuery = query(collection(db, APPLICATIONS_COLLECTION), where('freelancerId', '==', userId), orderBy('appliedAt', 'desc'));
    } else {
      // Clients see applications for their tasks? (Maybe handled by project store)
      applicationsQuery = query(collection(db, APPLICATIONS_COLLECTION), orderBy('appliedAt', 'desc'));
    }

    const unsubscribeApplications = onSnapshot(
      applicationsQuery,
      (snapshot) => {
        const applications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestamps(doc.data()),
        })) as TaskApplication[];
        set({ applications, isLoading: false });
      },
      (error) => {
        console.error('[TaskStore] Error fetching applications:', error);
        set({ error: 'Failed to fetch applications', isLoading: false });
      }
    );

    set({ unsubscribeTasks, unsubscribeApplications });
  },

  cleanup: () => {
    const { unsubscribeTasks, unsubscribeApplications } = get();
    if (unsubscribeTasks) {
      unsubscribeTasks();
    }
    if (unsubscribeApplications) {
      unsubscribeApplications();
    }
    set({ unsubscribeTasks: null, unsubscribeApplications: null });
  },

  addTask: async (taskData) => {
    if (!isFirebaseConfigured() || !db) {
      console.warn('[TaskStore] Firebase not configured');
      return;
    }

    const newTask = {
      ...taskData,
      postedAt: serverTimestamp(),
      status: 'open',
      milestones: [],
    };

    try {
      await addDoc(collection(db, TASKS_COLLECTION), newTask);
    } catch (error) {
      console.error('[TaskStore] Error adding task:', error);
      set({ error: 'Failed to add task' });
      throw error;
    }
  },

  updateTask: async (taskId, updates) => {
    if (!isFirebaseConfigured() || !db) {
      console.warn('[TaskStore] Firebase not configured');
      return;
    }

    try {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[TaskStore] Error updating task:', error);
      set({ error: 'Failed to update task' });
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    if (!isFirebaseConfigured() || !db) {
      console.warn('[TaskStore] Firebase not configured');
      return;
    }

    try {
      await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
    } catch (error) {
      console.error('[TaskStore] Error deleting task:', error);
      set({ error: 'Failed to delete task' });
      throw error;
    }
  },

  getTaskById: (taskId) => {
    return get().tasks.find((task) => task.id === taskId);
  },

  submitApplication: async (applicationData) => {
    if (!isFirebaseConfigured() || !db) {
      console.warn('[TaskStore] Firebase not configured');
      return;
    }

    const newApplication = {
      ...applicationData,
      appliedAt: serverTimestamp(),
      status: 'pending',
    };

    try {
      await addDoc(collection(db, APPLICATIONS_COLLECTION), newApplication);
    } catch (error) {
      console.error('[TaskStore] Error submitting application:', error);
      set({ error: 'Failed to submit application' });
      throw error;
    }
  },

  updateApplicationStatus: async (applicationId, status, adminNotes) => {
    if (!isFirebaseConfigured() || !db) {
      console.warn('[TaskStore] Firebase not configured');
      return;
    }

    try {
      const appRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
      await updateDoc(appRef, {
        status,
        adminNotes,
        respondedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[TaskStore] Error updating application status:', error);
      set({ error: 'Failed to update application status' });
      throw error;
    }
  },

  withdrawApplication: async (applicationId) => {
    if (!isFirebaseConfigured() || !db) {
      console.warn('[TaskStore] Firebase not configured');
      return;
    }

    try {
      const appRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
      await updateDoc(appRef, {
        status: 'withdrawn',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[TaskStore] Error withdrawing application:', error);
      set({ error: 'Failed to withdraw application' });
      throw error;
    }
  },

  getApplicationsByTaskId: (taskId) => {
    return get().applications.filter((app) => app.taskId === taskId);
  },

  getApplicationsByFreelancerId: (freelancerId) => {
    return get().applications.filter((app) => app.freelancerId === freelancerId);
  },

  assignFreelancer: async (taskId, freelancerId, applicationId) => {
    if (!isFirebaseConfigured() || !db) {
      console.warn('[TaskStore] Firebase not configured');
      return;
    }

    try {
      // Update task
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      await updateDoc(taskRef, {
        assignedTo: freelancerId,
        selectedApplicationId: applicationId,
        status: 'in_progress',
        updatedAt: serverTimestamp(),
      });

      // Update all applications for this task
      const { applications } = get();
      const taskApplications = applications.filter((app) => app.taskId === taskId);

      for (const app of taskApplications) {
        const appRef = doc(db, APPLICATIONS_COLLECTION, app.id);
        await updateDoc(appRef, {
          status: app.id === applicationId ? 'accepted' : 'rejected',
          respondedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('[TaskStore] Error assigning freelancer:', error);
      set({ error: 'Failed to assign freelancer' });
      throw error;
    }
  },

  updateMilestoneStatus: async (taskId, milestoneId, status) => {
    if (!isFirebaseConfigured() || !db) {
      console.warn('[TaskStore] Firebase not configured');
      return;
    }

    try {
      const task = get().getTaskById(taskId);
      if (!task) throw new Error('Task not found');

      const updatedMilestones = task.milestones.map((m) =>
        m.id === milestoneId ? { ...m, status } : m
      );

      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      await updateDoc(taskRef, {
        milestones: updatedMilestones,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[TaskStore] Error updating milestone status:', error);
      set({ error: 'Failed to update milestone status' });
      throw error;
    }
  },

  completeTask: async (taskId) => {
    if (!isFirebaseConfigured() || !db) {
      console.warn('[TaskStore] Firebase not configured');
      return;
    }

    try {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      await updateDoc(taskRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[TaskStore] Error completing task:', error);
      set({ error: 'Failed to complete task' });
      throw error;
    }
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
