import { create } from 'zustand';
import { ProjectRequest, ProjectRequestStatus } from '@/types';
import { db, isFirebaseConfigured } from '@/config/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

interface ProjectRequestState {
  projectRequests: ProjectRequest[];
  isLoading: boolean;
  error: string | null;
  unsubscribeRequests: Unsubscribe | null;

  // Initialization
  initialize: (userId: string, role: string) => void;
  cleanup: () => void;

  // Actions
  setProjectRequests: (requests: ProjectRequest[]) => void;
  createRequest: (request: Partial<ProjectRequest>) => Promise<ProjectRequest>;
  updateRequest: (id: string, updates: Partial<ProjectRequest>) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  approveRequest: (id: string, approvedBy: string) => Promise<void>;
  rejectRequest: (id: string, rejectedBy: string, reason: string) => Promise<void>;
  convertToProject: (id: string, projectId: string) => Promise<void>;
  getRequestById: (id: string) => ProjectRequest | undefined;
  getRequestsByStatus: (status: ProjectRequestStatus) => ProjectRequest[];
}

// Collection name
const PROJECT_REQUESTS_COLLECTION = 'projectRequests';

// Helper to convert Firestore timestamps to dates
function convertTimestamps(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  const dateFields = ['createdAt', 'updatedAt', 'approvedAt', 'rejectedAt', 'convertedAt'];

  for (const field of dateFields) {
    if (result[field] instanceof Timestamp) {
      result[field] = result[field].toDate();
    }
  }
  return result;
}

export const useProjectRequestStore = create<ProjectRequestState>((set, get) => ({
  projectRequests: [],
  isLoading: false,
  error: null,
  unsubscribeRequests: null,

  initialize: (userId: string, role: string) => {
    if (!isFirebaseConfigured() || !db) {
      console.warn('[ProjectRequestStore] Firebase not configured, using empty arrays');
      return;
    }

    set({ isLoading: true, error: null });

    // Build query based on role
    let baseQuery;
    if (role === 'admin') {
      baseQuery = query(
        collection(db, PROJECT_REQUESTS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Clients only see their own requests
      baseQuery = query(
        collection(db, PROJECT_REQUESTS_COLLECTION),
        where('clientId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribeRequests = onSnapshot(
      baseQuery,
      (snapshot) => {
        const projectRequests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestamps(doc.data()),
        })) as ProjectRequest[];
        console.log('[ProjectRequestStore] Received project requests update:', projectRequests.length, 'requests');
        set({ projectRequests, isLoading: false });
      },
      (error) => {
        console.error('[ProjectRequestStore] Error fetching project requests:', error);
        set({ error: 'Failed to fetch project requests', isLoading: false });
      }
    );

    set({ unsubscribeRequests });
  },

  cleanup: () => {
    const { unsubscribeRequests } = get();
    if (unsubscribeRequests) {
      unsubscribeRequests();
    }
    set({ unsubscribeRequests: null });
  },

  setProjectRequests: (requests) => set({ projectRequests: requests }),

  createRequest: async (requestData) => {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase not configured');
    }

    set({ isLoading: true });

    try {
      // Remove undefined fields to prevent Firestore errors
      const newRequest: Record<string, unknown> = {
        clientId: requestData.clientId!,
        clientName: requestData.clientName!,
        clientEmail: requestData.clientEmail!,
        projectName: requestData.projectName!,
        description: requestData.description || '',
        projectType: requestData.projectType || 'residential',
        hoursRequested: requestData.hoursRequested || 0,
        budget: requestData.budget || 0,
        status: 'pending' as ProjectRequestStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (requestData.freelancerId) newRequest.freelancerId = requestData.freelancerId;
      if (requestData.freelancerName) newRequest.freelancerName = requestData.freelancerName;
      if (requestData.address) newRequest.address = requestData.address;
      if (requestData.propertyDetails) newRequest.propertyDetails = requestData.propertyDetails;
      if (requestData.serviceDetails) newRequest.serviceDetails = requestData.serviceDetails;
      if (requestData.attachments) newRequest.attachments = requestData.attachments;

      console.log('[ProjectRequestStore] Creating request document in Firestore...');
      const docRef = await addDoc(collection(db, PROJECT_REQUESTS_COLLECTION), newRequest);
      console.log('[ProjectRequestStore] Request document created with ID:', docRef.id);

      const createdRequest: ProjectRequest = {
        id: docRef.id,
        ...newRequest,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending',
      } as ProjectRequest;

      set({ isLoading: false });
      return createdRequest;
    } catch (error) {
      console.error('[ProjectRequestStore] Error creating request:', error);
      set({ error: 'Failed to create request', isLoading: false });
      throw error;
    }
  },

  updateRequest: async (id, updates) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const requestRef = doc(db, PROJECT_REQUESTS_COLLECTION, id);
      await updateDoc(requestRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[ProjectRequestStore] Error updating request:', error);
      set({ error: 'Failed to update request' });
      throw error;
    }
  },

  deleteRequest: async (id) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      await deleteDoc(doc(db, PROJECT_REQUESTS_COLLECTION, id));
    } catch (error) {
      console.error('[ProjectRequestStore] Error deleting request:', error);
      set({ error: 'Failed to delete request' });
      throw error;
    }
  },

  approveRequest: async (id, approvedBy) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const requestRef = doc(db, PROJECT_REQUESTS_COLLECTION, id);
      await updateDoc(requestRef, {
        status: 'approved',
        approvedBy,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[ProjectRequestStore] Error approving request:', error);
      set({ error: 'Failed to approve request' });
      throw error;
    }
  },

  rejectRequest: async (id, rejectedBy, reason) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const requestRef = doc(db, PROJECT_REQUESTS_COLLECTION, id);
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedBy,
        rejectedAt: serverTimestamp(),
        rejectionReason: reason,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[ProjectRequestStore] Error rejecting request:', error);
      set({ error: 'Failed to reject request' });
      throw error;
    }
  },

  convertToProject: async (id, projectId) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const requestRef = doc(db, PROJECT_REQUESTS_COLLECTION, id);
      await updateDoc(requestRef, {
        status: 'converted',
        convertedToProjectId: projectId,
        convertedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[ProjectRequestStore] Error converting request:', error);
      set({ error: 'Failed to convert request' });
      throw error;
    }
  },

  getRequestById: (id) => {
    return get().projectRequests.find(pr => pr.id === id);
  },

  getRequestsByStatus: (status) => {
    return get().projectRequests.filter(pr => pr.status === status);
  },
}));
