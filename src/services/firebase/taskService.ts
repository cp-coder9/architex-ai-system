/**
 * Task Service
 *
 * Handles CRUD operations for marketplace tasks and freelancer applications.
 *
 * Collections:
 * - tasks: Marketplace task postings
 * - taskApplications: Freelancer applications to tasks
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
  orderBy,
  limit,
  getDocs,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Task, TaskApplication } from '@/types';

const TASKS_COLLECTION = 'tasks';
const TASK_APPLICATIONS_COLLECTION = 'taskApplications';

// Helper functions
function timestampToDate(timestamp: Timestamp | Date | undefined): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp || new Date();
}

function serializeData(data: Record<string, unknown>): Record<string, unknown> {
  const serialized: Record<string, unknown> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      if (value instanceof Date) {
        serialized[key] = Timestamp.fromDate(value);
      } else {
        serialized[key] = value;
      }
    }
  });

  return serialized;
}

// ==================== Tasks ====================

/**
 * Create a new marketplace task
 */
export async function createTask(
  task: Omit<Task, 'id' | 'postedAt' | 'status'>
): Promise<Task> {
  try {
    const taskRef = doc(collection(db!, TASKS_COLLECTION));
    const now = new Date();

    const newTask: Task = {
      ...task,
      id: taskRef.id,
      status: 'draft',
      postedAt: now.toISOString(),
    };

    await setDoc(taskRef, newTask);

    return newTask;
  } catch (error) {
    console.error('[TaskService] Error creating task:', error);
    throw new Error('Failed to create task');
  }
}

/**
 * Get task by ID
 */
export async function getTaskById(taskId: string): Promise<Task | null> {
  try {
    const taskRef = doc(db!, TASKS_COLLECTION, taskId);
    const taskSnap = await getDoc(taskRef);

    if (taskSnap.exists()) {
      return { id: taskSnap.id, ...taskSnap.data() } as Task;
    }

    return null;
  } catch (error) {
    console.error('[TaskService] Error fetching task:', error);
    throw new Error('Failed to fetch task');
  }
}

/**
 * Update task
 */
export async function updateTask(
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'postedAt'>>
): Promise<void> {
  try {
    const taskRef = doc(db!, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, updates);
  } catch (error) {
    console.error('[TaskService] Error updating task:', error);
    throw new Error('Failed to update task');
  }
}

/**
 * Delete task
 */
export async function deleteTask(taskId: string): Promise<void> {
  try {
    const taskRef = doc(db!, TASKS_COLLECTION, taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error('[TaskService] Error deleting task:', error);
    throw new Error('Failed to delete task');
  }
}

/**
 * Get all open tasks for marketplace
 */
export async function getOpenTasks(limitCount: number = 100): Promise<Task[]> {
  try {
    const tasksRef = collection(db!, TASKS_COLLECTION);
    const q = query(
      tasksRef,
      where('status', '==', 'open'),
      orderBy('postedAt', 'desc'),
      limit(limitCount)
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Task);
  } catch (error) {
    console.error('[TaskService] Error fetching open tasks:', error);
    throw new Error('Failed to fetch open tasks');
  }
}

/**
 * Get tasks posted by admin
 */
export async function getTasksByAdmin(adminId: string): Promise<Task[]> {
  try {
    const tasksRef = collection(db!, TASKS_COLLECTION);
    const q = query(
      tasksRef,
      where('postedBy', '==', adminId),
      orderBy('postedAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Task);
  } catch (error) {
    console.error('[TaskService] Error fetching admin tasks:', error);
    throw new Error('Failed to fetch tasks');
  }
}

/**
 * Get task assigned to freelancer
 */
export async function getTasksByFreelancer(freelancerId: string): Promise<Task[]> {
  try {
    const tasksRef = collection(db!, TASKS_COLLECTION);
    const q = query(
      tasksRef,
      where('assignedTo', '==', freelancerId),
      orderBy('postedAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Task);
  } catch (error) {
    console.error('[TaskService] Error fetching freelancer tasks:', error);
    throw new Error('Failed to fetch tasks');
  }
}

/**
 * Publish task to marketplace (change status from draft to open)
 */
export async function publishTask(taskId: string): Promise<void> {
  try {
    const taskRef = doc(db!, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, {
      status: 'open',
    });
  } catch (error) {
    console.error('[TaskService] Error publishing task:', error);
    throw new Error('Failed to publish task');
  }
}

/**
 * Assign task to freelancer
 */
export async function assignTask(taskId: string, freelancerId: string, applicationId: string): Promise<void> {
  try {
    const taskRef = doc(db!, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, {
      status: 'in_progress',
      assignedTo: freelancerId,
      selectedApplicationId: applicationId,
    });
  } catch (error) {
    console.error('[TaskService] Error assigning task:', error);
    throw new Error('Failed to assign task');
  }
}

/**
 * Mark task as completed
 */
export async function completeTask(taskId: string): Promise<void> {
  try {
    const taskRef = doc(db!, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, {
      status: 'completed',
    });
  } catch (error) {
    console.error('[TaskService] Error completing task:', error);
    throw new Error('Failed to complete task');
  }
}

// ==================== Task Applications ====================

/**
 * Create a task application
 */
export async function createTaskApplication(
  application: Omit<TaskApplication, 'id' | 'appliedAt' | 'status'>
): Promise<TaskApplication> {
  try {
    const appRef = doc(collection(db!, TASK_APPLICATIONS_COLLECTION));
    const now = new Date();

    const newApplication: TaskApplication = {
      ...application,
      id: appRef.id,
      status: 'pending',
      appliedAt: now.toISOString(),
    };

    await setDoc(appRef, newApplication);

    return newApplication;
  } catch (error) {
    console.error('[TaskService] Error creating application:', error);
    throw new Error('Failed to create application');
  }
}

/**
 * Get application by ID
 */
export async function getApplicationById(applicationId: string): Promise<TaskApplication | null> {
  try {
    const appRef = doc(db!, TASK_APPLICATIONS_COLLECTION, applicationId);
    const appSnap = await getDoc(appRef);

    if (appSnap.exists()) {
      return { id: appSnap.id, ...appSnap.data() } as TaskApplication;
    }

    return null;
  } catch (error) {
    console.error('[TaskService] Error fetching application:', error);
    throw new Error('Failed to fetch application');
  }
}

/**
 * Get applications for a task
 */
export async function getApplicationsByTask(taskId: string): Promise<TaskApplication[]> {
  try {
    const appsRef = collection(db!, TASK_APPLICATIONS_COLLECTION);
    const q = query(
      appsRef,
      where('taskId', '==', taskId),
      orderBy('appliedAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TaskApplication);
  } catch (error) {
    console.error('[TaskService] Error fetching task applications:', error);
    throw new Error('Failed to fetch applications');
  }
}

/**
 * Get applications by freelancer
 */
export async function getApplicationsByFreelancer(freelancerId: string): Promise<TaskApplication[]> {
  try {
    const appsRef = collection(db!, TASK_APPLICATIONS_COLLECTION);
    const q = query(
      appsRef,
      where('freelancerId', '==', freelancerId),
      orderBy('appliedAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TaskApplication);
  } catch (error) {
    console.error('[TaskService] Error fetching freelancer applications:', error);
    throw new Error('Failed to fetch applications');
  }
}

/**
 * Accept task application
 */
export async function acceptApplication(
  applicationId: string,
  adminNotes?: string
): Promise<void> {
  try {
    const appRef = doc(db!, TASK_APPLICATIONS_COLLECTION, applicationId);
    await updateDoc(appRef, {
      status: 'accepted',
      respondedAt: serverTimestamp(),
      adminNotes: adminNotes || null,
    });
  } catch (error) {
    console.error('[TaskService] Error accepting application:', error);
    throw new Error('Failed to accept application');
  }
}

/**
 * Reject task application
 */
export async function rejectApplication(
  applicationId: string,
  adminNotes?: string
): Promise<void> {
  try {
    const appRef = doc(db!, TASK_APPLICATIONS_COLLECTION, applicationId);
    await updateDoc(appRef, {
      status: 'rejected',
      respondedAt: serverTimestamp(),
      adminNotes: adminNotes || null,
    });
  } catch (error) {
    console.error('[TaskService] Error rejecting application:', error);
    throw new Error('Failed to reject application');
  }
}

/**
 * Withdraw task application
 */
export async function withdrawApplication(applicationId: string): Promise<void> {
  try {
    const appRef = doc(db!, TASK_APPLICATIONS_COLLECTION, applicationId);
    await updateDoc(appRef, {
      status: 'withdrawn',
    });
  } catch (error) {
    console.error('[TaskService] Error withdrawing application:', error);
    throw new Error('Failed to withdraw application');
  }
}

// ==================== Real-time Subscriptions ====================

/**
 * Subscribe to task updates (real-time)
 */
export function subscribeToTask(
  taskId: string,
  callback: (task: Task | null) => void
): Unsubscribe {
  const taskRef = doc(db!, TASKS_COLLECTION, taskId);

  return onSnapshot(
    taskRef,
    (snapshot: DocumentSnapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as Task);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('[TaskService] Error subscribing to task:', error);
      callback(null);
    }
  );
}

/**
 * Subscribe to open tasks (real-time)
 */
export function subscribeToOpenTasks(
  callback: (tasks: Task[]) => void
): Unsubscribe {
  const tasksRef = collection(db!, TASKS_COLLECTION);
  const q = query(
    tasksRef,
    where('status', '==', 'open'),
    orderBy('postedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Task);
      callback(tasks);
    },
    (error) => {
      console.error('[TaskService] Error subscribing to open tasks:', error);
      callback([]);
    }
  );
}
