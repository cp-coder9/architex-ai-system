/**
 * Project Request Service
 *
 * Handles CRUD operations for project requests in Firestore.
 * Project requests are submitted by clients and approved/rejected by admins.
 *
 * Collections:
 * - projectRequests: Project request documents
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
import { ProjectRequest, ProjectRequestStatus } from '@/types';

const PROJECT_REQUESTS_COLLECTION = 'projectRequests';

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

function deserializeProjectRequest(data: Record<string, unknown>, id: string): ProjectRequest {
  return {
    id,
    ...data,
    createdAt: timestampToDate(data.createdAt as Timestamp),
    updatedAt: timestampToDate(data.updatedAt as Timestamp),
    approvedAt: data.approvedAt ? timestampToDate(data.approvedAt as Timestamp) : undefined,
    rejectedAt: data.rejectedAt ? timestampToDate(data.rejectedAt as Timestamp) : undefined,
    convertedAt: data.convertedAt ? timestampToDate(data.convertedAt as Timestamp) : undefined,
  } as ProjectRequest;
}

/**
 * Create a new project request
 */
export async function createProjectRequest(
  request: Omit<ProjectRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<ProjectRequest> {
  try {
    const requestRef = doc(collection(db!, PROJECT_REQUESTS_COLLECTION));
    const now = new Date();

    const newRequest: ProjectRequest = {
      ...request,
      id: requestRef.id,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(requestRef, serializeData(newRequest as unknown as Record<string, unknown>));

    return newRequest;
  } catch (error) {
    console.error('[ProjectRequestService] Error creating request:', error);
    throw new Error('Failed to create project request');
  }
}

/**
 * Get project request by ID
 */
export async function getProjectRequestById(requestId: string): Promise<ProjectRequest | null> {
  try {
    const requestRef = doc(db!, PROJECT_REQUESTS_COLLECTION, requestId);
    const requestSnap = await getDoc(requestRef);

    if (requestSnap.exists()) {
      return deserializeProjectRequest(requestSnap.data(), requestSnap.id);
    }

    return null;
  } catch (error) {
    console.error('[ProjectRequestService] Error fetching request:', error);
    throw new Error('Failed to fetch project request');
  }
}

/**
 * Update project request
 */
export async function updateProjectRequest(
  requestId: string,
  updates: Partial<Omit<ProjectRequest, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const requestRef = doc(db!, PROJECT_REQUESTS_COLLECTION, requestId);
    await updateDoc(requestRef, {
      ...serializeData(updates as Record<string, unknown>),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[ProjectRequestService] Error updating request:', error);
    throw new Error('Failed to update project request');
  }
}

/**
 * Delete project request
 */
export async function deleteProjectRequest(requestId: string): Promise<void> {
  try {
    const requestRef = doc(db!, PROJECT_REQUESTS_COLLECTION, requestId);
    await deleteDoc(requestRef);
  } catch (error) {
    console.error('[ProjectRequestService] Error deleting request:', error);
    throw new Error('Failed to delete project request');
  }
}

/**
 * Get project requests by client ID
 */
export async function getProjectRequestsByClient(clientId: string): Promise<ProjectRequest[]> {
  try {
    const requestsRef = collection(db!, PROJECT_REQUESTS_COLLECTION);
    const q = query(
      requestsRef,
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => deserializeProjectRequest(doc.data(), doc.id));
  } catch (error) {
    console.error('[ProjectRequestService] Error fetching client requests:', error);
    throw new Error('Failed to fetch project requests');
  }
}

/**
 * Get all project requests (admin only)
 */
export async function getAllProjectRequests(
  status?: ProjectRequestStatus,
  limitCount: number = 100
): Promise<ProjectRequest[]> {
  try {
    const requestsRef = collection(db!, PROJECT_REQUESTS_COLLECTION);
    let q = query(requestsRef, orderBy('createdAt', 'desc'), limit(limitCount));

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => deserializeProjectRequest(doc.data(), doc.id));
  } catch (error) {
    console.error('[ProjectRequestService] Error fetching all requests:', error);
    throw new Error('Failed to fetch project requests');
  }
}

/**
 * Get pending project requests
 */
export async function getPendingProjectRequests(limitCount: number = 100): Promise<ProjectRequest[]> {
  try {
    const requestsRef = collection(db!, PROJECT_REQUESTS_COLLECTION);
    const q = query(
      requestsRef,
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => deserializeProjectRequest(doc.data(), doc.id));
  } catch (error) {
    console.error('[ProjectRequestService] Error fetching pending requests:', error);
    throw new Error('Failed to fetch pending requests');
  }
}

/**
 * Approve project request
 */
export async function approveProjectRequest(
  requestId: string,
  approvedBy: string,
  freelancerId?: string,
  freelancerName?: string
): Promise<void> {
  try {
    const requestRef = doc(db!, PROJECT_REQUESTS_COLLECTION, requestId);
    await updateDoc(requestRef, {
      status: 'approved',
      approvedBy,
      freelancerId: freelancerId || null,
      freelancerName: freelancerName || null,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[ProjectRequestService] Error approving request:', error);
    throw new Error('Failed to approve project request');
  }
}

/**
 * Reject project request
 */
export async function rejectProjectRequest(
  requestId: string,
  rejectedBy: string,
  rejectionReason: string
): Promise<void> {
  try {
    const requestRef = doc(db!, PROJECT_REQUESTS_COLLECTION, requestId);
    await updateDoc(requestRef, {
      status: 'rejected',
      rejectedBy,
      rejectionReason,
      rejectedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[ProjectRequestService] Error rejecting request:', error);
    throw new Error('Failed to reject project request');
  }
}

/**
 * Mark project request as converted to project
 */
export async function markRequestAsConverted(
  requestId: string,
  projectId: string
): Promise<void> {
  try {
    const requestRef = doc(db!, PROJECT_REQUESTS_COLLECTION, requestId);
    await updateDoc(requestRef, {
      status: 'converted',
      convertedToProjectId: projectId,
      convertedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[ProjectRequestService] Error marking request as converted:', error);
    throw new Error('Failed to mark request as converted');
  }
}

/**
 * Subscribe to project request updates (real-time)
 */
export function subscribeToProjectRequest(
  requestId: string,
  callback: (request: ProjectRequest | null) => void
): Unsubscribe {
  const requestRef = doc(db!, PROJECT_REQUESTS_COLLECTION, requestId);

  return onSnapshot(
    requestRef,
    (snapshot: DocumentSnapshot) => {
      if (snapshot.exists()) {
        callback(deserializeProjectRequest(snapshot.data() as Record<string, unknown>, snapshot.id));
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('[ProjectRequestService] Error subscribing to request:', error);
      callback(null);
    }
  );
}

/**
 * Subscribe to project requests for a client (real-time)
 */
export function subscribeToClientProjectRequests(
  clientId: string,
  callback: (requests: ProjectRequest[]) => void
): Unsubscribe {
  const requestsRef = collection(db!, PROJECT_REQUESTS_COLLECTION);
  const q = query(
    requestsRef,
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const requests = snapshot.docs.map((doc) =>
        deserializeProjectRequest(doc.data() as Record<string, unknown>, doc.id)
      );
      callback(requests);
    },
    (error) => {
      console.error('[ProjectRequestService] Error subscribing to client requests:', error);
      callback([]);
    }
  );
}
