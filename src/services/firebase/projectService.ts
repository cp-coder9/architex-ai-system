/**
 * Project Service
 * 
 * Handles CRUD operations for projects, drawings, and related data in Firestore.
 * 
 * Collections:
 * - projects: Project documents
 * - drawings: Drawing documents (subcollection of projects)
 * - timeEntries: Time tracking entries
 * - invoices: Invoice documents
 * - comments: Project comments
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  WriteBatch,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  Project,
  Drawing,
  TimeEntry,
  Invoice,
  Comment,
  Milestone,
  ProjectStatus,
  DrawingStatus,
} from '@/types';

// Collection names
const PROJECTS_COLLECTION = 'projects';
const DRAWINGS_COLLECTION = 'drawings';
const TIME_ENTRIES_COLLECTION = 'timeEntries';
const INVOICES_COLLECTION = 'invoices';
const COMMENTS_COLLECTION = 'comments';
const MILESTONES_COLLECTION = 'milestones';

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
      } else if (Array.isArray(value)) {
        serialized[key] = value.map((item) =>
          item instanceof Date ? Timestamp.fromDate(item) : item
        );
      } else {
        serialized[key] = value;
      }
    }
  });

  return serialized;
}

function deserializeProject(data: Record<string, unknown>, id: string): Project {
  return {
    id,
    ...data,
    createdAt: timestampToDate(data.createdAt as Timestamp),
    updatedAt: timestampToDate(data.updatedAt as Timestamp),
    deadline: data.deadline ? timestampToDate(data.deadline as Timestamp) : undefined,
  } as Project;
}

function deserializeDrawing(data: Record<string, unknown>, id: string): Drawing {
  return {
    id,
    ...data,
    uploadedAt: timestampToDate(data.uploadedAt as Timestamp),
  } as Drawing;
}

function deserializeTimeEntry(data: Record<string, unknown>, id: string): TimeEntry {
  return {
    id,
    ...data,
    date: timestampToDate(data.date as Timestamp),
    createdAt: timestampToDate(data.createdAt as Timestamp),
  } as TimeEntry;
}

function deserializeInvoice(data: Record<string, unknown>, id: string): Invoice {
  return {
    id,
    ...data,
    createdAt: timestampToDate(data.createdAt as Timestamp),
    dueDate: timestampToDate(data.dueDate as Timestamp),
    sentAt: data.sentAt ? timestampToDate(data.sentAt as Timestamp) : undefined,
    paidAt: data.paidAt ? timestampToDate(data.paidAt as Timestamp) : undefined,
  } as Invoice;
}

function deserializeComment(data: Record<string, unknown>, id: string): Comment {
  return {
    id,
    ...data,
    createdAt: timestampToDate(data.createdAt as Timestamp),
  } as Comment;
}

function deserializeMilestone(data: Record<string, unknown>, id: string): Milestone {
  return {
    id,
    ...data,
    dueDate: data.dueDate ? timestampToDate(data.dueDate as Timestamp) : undefined,
    completedAt: data.completedAt ? timestampToDate(data.completedAt as Timestamp) : undefined,
  } as Milestone;
}

// ==================== Projects ====================

/**
 * Create a new project
 */
export async function createProject(
  project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Project> {
  try {
    const projectRef = doc(collection(db!, PROJECTS_COLLECTION));
    const now = new Date();

    const newProject: Project = {
      ...project,
      id: projectRef.id,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(projectRef, serializeData(newProject as unknown as Record<string, unknown>));

    return newProject;
  } catch (error) {
    console.error('[ProjectService] Error creating project:', error);
    throw new Error('Failed to create project');
  }
}

/**
 * Get project by ID
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  try {
    const projectRef = doc(db!, PROJECTS_COLLECTION, projectId);
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists()) {
      return deserializeProject(projectSnap.data(), projectSnap.id);
    }

    return null;
  } catch (error) {
    console.error('[ProjectService] Error fetching project:', error);
    throw new Error('Failed to fetch project');
  }
}

/**
 * Update project
 */
export async function updateProject(
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const projectRef = doc(db!, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, {
      ...serializeData(updates as Record<string, unknown>),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[ProjectService] Error updating project:', error);
    throw new Error('Failed to update project');
  }
}

/**
 * Delete project and all related data
 */
export async function deleteProject(projectId: string): Promise<void> {
  try {
    const batch: WriteBatch = writeBatch(db!);

    // Delete project
    const projectRef = doc(db!, PROJECTS_COLLECTION, projectId);
    batch.delete(projectRef);

    // Delete related drawings
    const drawingsQuery = query(
      collection(db!, DRAWINGS_COLLECTION),
      where('projectId', '==', projectId)
    );
    const drawingsSnap = await getDocs(drawingsQuery);
    drawingsSnap.docs.forEach((doc) => batch.delete(doc.ref));

    // Delete related time entries
    const timeEntriesQuery = query(
      collection(db!, TIME_ENTRIES_COLLECTION),
      where('projectId', '==', projectId)
    );
    const timeEntriesSnap = await getDocs(timeEntriesQuery);
    timeEntriesSnap.docs.forEach((doc) => batch.delete(doc.ref));

    // Delete related comments
    const commentsQuery = query(
      collection(db!, COMMENTS_COLLECTION),
      where('projectId', '==', projectId)
    );
    const commentsSnap = await getDocs(commentsQuery);
    commentsSnap.docs.forEach((doc) => batch.delete(doc.ref));

    // Delete related milestones
    const milestonesQuery = query(
      collection(db!, MILESTONES_COLLECTION),
      where('projectId', '==', projectId)
    );
    const milestonesSnap = await getDocs(milestonesQuery);
    milestonesSnap.docs.forEach((doc) => batch.delete(doc.ref));

    await batch.commit();
  } catch (error) {
    console.error('[ProjectService] Error deleting project:', error);
    throw new Error('Failed to delete project');
  }
}

/**
 * Get projects by client ID
 */
export async function getProjectsByClient(clientId: string): Promise<Project[]> {
  try {
    const projectsRef = collection(db!, PROJECTS_COLLECTION);
    const q = query(
      projectsRef,
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) =>
      deserializeProject(doc.data(), doc.id)
    );
  } catch (error) {
    console.error('[ProjectService] Error fetching client projects:', error);
    throw new Error('Failed to fetch client projects');
  }
}

/**
 * Get projects by freelancer ID
 */
export async function getProjectsByFreelancer(freelancerId: string): Promise<Project[]> {
  try {
    const projectsRef = collection(db!, PROJECTS_COLLECTION);
    const q = query(
      projectsRef,
      where('freelancerId', '==', freelancerId),
      orderBy('createdAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) =>
      deserializeProject(doc.data(), doc.id)
    );
  } catch (error) {
    console.error('[ProjectService] Error fetching freelancer projects:', error);
    throw new Error('Failed to fetch freelancer projects');
  }
}

/**
 * Get all projects (admin only)
 */
export async function getAllProjects(
  status?: ProjectStatus,
  limitCount: number = 100
): Promise<Project[]> {
  try {
    const projectsRef = collection(db!, PROJECTS_COLLECTION);
    let q = query(projectsRef, orderBy('createdAt', 'desc'), limit(limitCount));

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) =>
      deserializeProject(doc.data(), doc.id)
    );
  } catch (error) {
    console.error('[ProjectService] Error fetching all projects:', error);
    throw new Error('Failed to fetch projects');
  }
}

/**
 * Subscribe to project updates (real-time)
 */
export function subscribeToProject(
  projectId: string,
  callback: (project: Project | null) => void
): Unsubscribe {
  const projectRef = doc(db!, PROJECTS_COLLECTION, projectId);

  return onSnapshot(
    projectRef,
    (snapshot: DocumentSnapshot) => {
      if (snapshot.exists()) {
        callback(deserializeProject(snapshot.data() as Record<string, unknown>, snapshot.id));
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('[ProjectService] Error subscribing to project:', error);
      callback(null);
    }
  );
}

// ==================== Drawings ====================

/**
 * Add drawing to project
 */
export async function addDrawing(
  drawing: Omit<Drawing, 'id' | 'uploadedAt'>
): Promise<Drawing> {
  try {
    const drawingRef = doc(collection(db!, DRAWINGS_COLLECTION));
    const now = new Date();

    const newDrawing: Drawing = {
      ...drawing,
      id: drawingRef.id,
      uploadedAt: now,
    };

    await setDoc(drawingRef, serializeData(newDrawing as unknown as Record<string, unknown>));

    // Update project's drawings array
    const projectRef = doc(db!, PROJECTS_COLLECTION, drawing.projectId);
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists()) {
      const projectData = projectSnap.data();
      const currentDrawings = (projectData.drawings as string[]) || [];
      await updateDoc(projectRef, {
        drawings: [...currentDrawings, drawingRef.id],
        updatedAt: serverTimestamp(),
      });
    }

    return newDrawing;
  } catch (error) {
    console.error('[ProjectService] Error adding drawing:', error);
    throw new Error('Failed to add drawing');
  }
}

/**
 * Get drawing by ID
 */
export async function getDrawingById(drawingId: string): Promise<Drawing | null> {
  try {
    const drawingRef = doc(db!, DRAWINGS_COLLECTION, drawingId);
    const drawingSnap = await getDoc(drawingRef);

    if (drawingSnap.exists()) {
      return deserializeDrawing(drawingSnap.data(), drawingSnap.id);
    }

    return null;
  } catch (error) {
    console.error('[ProjectService] Error fetching drawing:', error);
    throw new Error('Failed to fetch drawing');
  }
}

/**
 * Get drawings by project
 */
export async function getDrawingsByProject(projectId: string): Promise<Drawing[]> {
  try {
    const drawingsRef = collection(db!, DRAWINGS_COLLECTION);
    const q = query(
      drawingsRef,
      where('projectId', '==', projectId),
      orderBy('uploadedAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) =>
      deserializeDrawing(doc.data(), doc.id)
    );
  } catch (error) {
    console.error('[ProjectService] Error fetching project drawings:', error);
    throw new Error('Failed to fetch drawings');
  }
}

/**
 * Update drawing
 */
export async function updateDrawing(
  drawingId: string,
  updates: Partial<Omit<Drawing, 'id' | 'uploadedAt'>>
): Promise<void> {
  try {
    const drawingRef = doc(db!, DRAWINGS_COLLECTION, drawingId);
    await updateDoc(drawingRef, serializeData(updates as Record<string, unknown>));

    // Update project timestamp
    const drawingSnap = await getDoc(drawingRef);
    if (drawingSnap.exists()) {
      const drawingData = drawingSnap.data();
      const projectRef = doc(db!, PROJECTS_COLLECTION, drawingData.projectId as string);
      await updateDoc(projectRef, {
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('[ProjectService] Error updating drawing:', error);
    throw new Error('Failed to update drawing');
  }
}

/**
 * Update drawing status
 */
export async function updateDrawingStatus(
  drawingId: string,
  status: DrawingStatus
): Promise<void> {
  await updateDrawing(drawingId, { status });
}

// ==================== Time Entries ====================

/**
 * Create time entry
 */
export async function createTimeEntry(
  timeEntry: Omit<TimeEntry, 'id' | 'createdAt'>
): Promise<TimeEntry> {
  try {
    const entryRef = doc(collection(db!, TIME_ENTRIES_COLLECTION));
    const now = new Date();

    const newEntry: TimeEntry = {
      ...timeEntry,
      id: entryRef.id,
      createdAt: now,
    };

    await setDoc(entryRef, serializeData(newEntry as unknown as Record<string, unknown>));

    // Update project hours used
    const projectRef = doc(db!, PROJECTS_COLLECTION, timeEntry.projectId);
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists()) {
      const projectData = projectSnap.data();
      const currentHours = (projectData.hoursUsed as number) || 0;
      await updateDoc(projectRef, {
        hoursUsed: currentHours + timeEntry.hours,
        updatedAt: serverTimestamp(),
      });
    }

    return newEntry;
  } catch (error) {
    console.error('[ProjectService] Error creating time entry:', error);
    throw new Error('Failed to create time entry');
  }
}

/**
 * Get time entries by project
 */
export async function getTimeEntriesByProject(projectId: string): Promise<TimeEntry[]> {
  try {
    const entriesRef = collection(db!, TIME_ENTRIES_COLLECTION);
    const q = query(
      entriesRef,
      where('projectId', '==', projectId),
      orderBy('date', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) =>
      deserializeTimeEntry(doc.data(), doc.id)
    );
  } catch (error) {
    console.error('[ProjectService] Error fetching time entries:', error);
    throw new Error('Failed to fetch time entries');
  }
}

/**
 * Get time entries by freelancer
 */
export async function getTimeEntriesByFreelancer(freelancerId: string): Promise<TimeEntry[]> {
  try {
    const entriesRef = collection(db!, TIME_ENTRIES_COLLECTION);
    const q = query(
      entriesRef,
      where('freelancerId', '==', freelancerId),
      orderBy('date', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) =>
      deserializeTimeEntry(doc.data(), doc.id)
    );
  } catch (error) {
    console.error('[ProjectService] Error fetching freelancer time entries:', error);
    throw new Error('Failed to fetch time entries');
  }
}

// ==================== Invoices ====================

/**
 * Create invoice
 */
export async function createInvoice(
  invoice: Omit<Invoice, 'id' | 'createdAt'>
): Promise<Invoice> {
  try {
    const invoiceRef = doc(collection(db!, INVOICES_COLLECTION));
    const now = new Date();

    const newInvoice: Invoice = {
      ...invoice,
      id: invoiceRef.id,
      createdAt: now,
    };

    await setDoc(invoiceRef, serializeData(newInvoice as unknown as Record<string, unknown>));

    // Update time entries to mark as invoiced
    const batch: WriteBatch = writeBatch(db!);
    invoice.timeEntries.forEach((entryId) => {
      const entryRef = doc(db!, TIME_ENTRIES_COLLECTION, entryId);
      batch.update(entryRef, {
        invoiced: true,
        invoiceId: invoiceRef.id,
      });
    });
    await batch.commit();

    return newInvoice;
  } catch (error) {
    console.error('[ProjectService] Error creating invoice:', error);
    throw new Error('Failed to create invoice');
  }
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
  try {
    const invoiceRef = doc(db!, INVOICES_COLLECTION, invoiceId);
    const invoiceSnap = await getDoc(invoiceRef);

    if (invoiceSnap.exists()) {
      return deserializeInvoice(invoiceSnap.data(), invoiceSnap.id);
    }

    return null;
  } catch (error) {
    console.error('[ProjectService] Error fetching invoice:', error);
    throw new Error('Failed to fetch invoice');
  }
}

/**
 * Get invoices by project
 */
export async function getInvoicesByProject(projectId: string): Promise<Invoice[]> {
  try {
    const invoicesRef = collection(db!, INVOICES_COLLECTION);
    const q = query(
      invoicesRef,
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) =>
      deserializeInvoice(doc.data(), doc.id)
    );
  } catch (error) {
    console.error('[ProjectService] Error fetching project invoices:', error);
    throw new Error('Failed to fetch invoices');
  }
}

/**
 * Get invoices by client
 */
export async function getInvoicesByClient(clientId: string): Promise<Invoice[]> {
  try {
    const invoicesRef = collection(db!, INVOICES_COLLECTION);
    const q = query(
      invoicesRef,
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) =>
      deserializeInvoice(doc.data(), doc.id)
    );
  } catch (error) {
    console.error('[ProjectService] Error fetching client invoices:', error);
    throw new Error('Failed to fetch invoices');
  }
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: Invoice['status'],
  additionalData?: { sentAt?: Date; paidAt?: Date }
): Promise<void> {
  try {
    const invoiceRef = doc(db!, INVOICES_COLLECTION, invoiceId);
    const updates: Record<string, unknown> = { status };

    if (additionalData?.sentAt) {
      updates.sentAt = Timestamp.fromDate(additionalData.sentAt);
    }
    if (additionalData?.paidAt) {
      updates.paidAt = Timestamp.fromDate(additionalData.paidAt);
    }

    await updateDoc(invoiceRef, updates);
  } catch (error) {
    console.error('[ProjectService] Error updating invoice status:', error);
    throw new Error('Failed to update invoice status');
  }
}

// ==================== Comments ====================

/**
 * Add comment to project
 */
export async function addComment(
  comment: Omit<Comment, 'id' | 'createdAt'>
): Promise<Comment> {
  try {
    const commentRef = doc(collection(db!, COMMENTS_COLLECTION));
    const now = new Date();

    const newComment: Comment = {
      ...comment,
      id: commentRef.id,
      createdAt: now,
    };

    await setDoc(commentRef, serializeData(newComment as unknown as Record<string, unknown>));

    // Update project's comments array
    const projectRef = doc(db!, PROJECTS_COLLECTION, comment.projectId);
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists()) {
      const projectData = projectSnap.data();
      const currentComments = (projectData.comments as string[]) || [];
      await updateDoc(projectRef, {
        comments: [...currentComments, commentRef.id],
        updatedAt: serverTimestamp(),
      });
    }

    return newComment;
  } catch (error) {
    console.error('[ProjectService] Error adding comment:', error);
    throw new Error('Failed to add comment');
  }
}

/**
 * Get comments by project
 */
export async function getCommentsByProject(projectId: string): Promise<Comment[]> {
  try {
    const commentsRef = collection(db!, COMMENTS_COLLECTION);
    const q = query(
      commentsRef,
      where('projectId', '==', projectId),
      orderBy('createdAt', 'asc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) =>
      deserializeComment(doc.data(), doc.id)
    );
  } catch (error) {
    console.error('[ProjectService] Error fetching comments:', error);
    throw new Error('Failed to fetch comments');
  }
}

// ==================== Milestones ====================

/**
 * Add milestone to project
 */
export async function addMilestone(
  milestone: Omit<Milestone, 'id'>
): Promise<Milestone> {
  try {
    const milestoneRef = doc(collection(db!, MILESTONES_COLLECTION));

    const newMilestone: Milestone = {
      ...milestone,
      id: milestoneRef.id,
    };

    await setDoc(milestoneRef, serializeData(newMilestone as unknown as Record<string, unknown>));

    // Update project's milestones array
    const projectRef = doc(db!, PROJECTS_COLLECTION, milestone.projectId);
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists()) {
      const projectData = projectSnap.data();
      const currentMilestones = (projectData.milestones as string[]) || [];
      await updateDoc(projectRef, {
        milestones: [...currentMilestones, milestoneRef.id],
        updatedAt: serverTimestamp(),
      });
    }

    return newMilestone;
  } catch (error) {
    console.error('[ProjectService] Error adding milestone:', error);
    throw new Error('Failed to add milestone');
  }
}

/**
 * Get milestones by project
 */
export async function getMilestonesByProject(projectId: string): Promise<Milestone[]> {
  try {
    const milestonesRef = collection(db!, MILESTONES_COLLECTION);
    const q = query(
      milestonesRef,
      where('projectId', '==', projectId),
      orderBy('order', 'asc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) =>
      deserializeMilestone(doc.data(), doc.id)
    );
  } catch (error) {
    console.error('[ProjectService] Error fetching milestones:', error);
    throw new Error('Failed to fetch milestones');
  }
}

/**
 * Update milestone
 */
export async function updateMilestone(
  milestoneId: string,
  updates: Partial<Omit<Milestone, 'id'>>
): Promise<void> {
  try {
    const milestoneRef = doc(db!, MILESTONES_COLLECTION, milestoneId);
    await updateDoc(milestoneRef, serializeData(updates as Record<string, unknown>));
  } catch (error) {
    console.error('[ProjectService] Error updating milestone:', error);
    throw new Error('Failed to update milestone');
  }
}
