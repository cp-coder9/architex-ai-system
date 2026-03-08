import { create } from 'zustand';
import { Project, Drawing, Milestone, TimeEntry, ProjectStatus, DrawingStatus, AgentCheck, AgentIssue, ProofOfWork } from '@/types';
import { DrawingType } from '@/types/agent';
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
  Timestamp,
  increment,
} from 'firebase/firestore';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  drawings: Drawing[];
  timeEntries: TimeEntry[];
  proofs: ProofOfWork[];
  isLoading: boolean;
  error: string | null;
  unsubscribeProjects: Unsubscribe | null;
  unsubscribeDrawings: Unsubscribe | null;
  unsubscribeTimeEntries: Unsubscribe | null;
  unsubscribeProofs: Unsubscribe | null;

  // Initialization
  initialize: (userId: string, role: string) => void;
  cleanup: () => void;

  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  createProject: (project: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addDrawing: (drawing: Partial<Drawing>) => Promise<Drawing>;
  updateDrawing: (id: string, updates: Partial<Drawing>) => Promise<void>;
  deleteDrawing: (id: string) => Promise<void>;
  addTimeEntry: (entry: Partial<TimeEntry>) => Promise<void>;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => Promise<void>;
  addMilestone: (milestone: Partial<Milestone>) => Promise<void>;
  updateMilestone: (id: string, updates: Partial<Milestone>) => Promise<void>;
  runAgentCheck: (drawingId: string) => Promise<AgentCheck>;
  overrideAgentCheck: (checkId: string, reason: string) => Promise<void>;
  resolveIssue: (checkId: string, issueId: string, userId: string) => Promise<void>;
  // Proof of Work Actions
  submitProofOfWork: (proofData: Partial<ProofOfWork>) => Promise<ProofOfWork>;
  verifyProof: (proofId: string, approved: boolean, reason?: string, verifiedBy?: string) => Promise<void>;
  getProofsByProjectId: (projectId: string) => ProofOfWork[];
  getProofsByFreelancerId: (freelancerId: string) => ProofOfWork[];
  getProofById: (proofId: string) => ProofOfWork | undefined;
}

// Collection names
const PROJECTS_COLLECTION = 'projects';
const DRAWINGS_COLLECTION = 'drawings';
const TIME_ENTRIES_COLLECTION = 'timeEntries';
const PROOFS_COLLECTION = 'proofs';

// Helper to convert Firestore timestamps to dates
function convertTimestamps(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  const dateFields = ['createdAt', 'updatedAt', 'uploadedAt', 'date', 'submittedAt', 'verifiedAt', 'completedAt', 'deadline', 'paidAt', 'sentAt'];

  for (const field of dateFields) {
    if (result[field] instanceof Timestamp) {
      result[field] = result[field].toDate();
    }
  }
  return result;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  drawings: [],
  timeEntries: [],
  proofs: [],
  isLoading: false,
  error: null,
  unsubscribeProjects: null,
  unsubscribeDrawings: null,
  unsubscribeTimeEntries: null,
  unsubscribeProofs: null,

  initialize: (userId: string, role: string) => {
    if (!isFirebaseConfigured() || !db) {
      console.warn('[ProjectStore] Firebase not configured, using empty arrays');
      return;
    }

    set({ isLoading: true, error: null });

    // Build Project Query
    let projectsQuery;
    if (role === 'admin') {
      projectsQuery = query(collection(db, PROJECTS_COLLECTION), orderBy('createdAt', 'desc'));
    } else if (role === 'client') {
      projectsQuery = query(collection(db, PROJECTS_COLLECTION), where('clientId', '==', userId), orderBy('createdAt', 'desc'));
    } else {
      projectsQuery = query(collection(db, PROJECTS_COLLECTION), where('freelancerId', '==', userId), orderBy('createdAt', 'desc'));
    }

    const unsubscribeProjects = onSnapshot(
      projectsQuery,
      (snapshot) => {
        const projects = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestamps(doc.data()),
        })) as Project[];
        set({ projects, isLoading: false });
      },
      (error) => {
        console.error('[ProjectStore] Error fetching projects:', error);
        set({ error: 'Failed to fetch projects', isLoading: false });
      }
    );

    // Build Drawings Query
    // Clients and freelancers see drawings from their projects
    // For simplicity, we filter in memory if role != admin or use a more complex query
    // But rules might prevent broad subscribe even if we filter in memory.
    // Better to filter by projectId, but initialize() is for all.
    // If role is client/freelancer, we might need to get projectIds first.
    // Or just use a broad query that the rules will allow (e.g. where participants contains userId)

    // For now, let's keep it simple: admin sees all, others might need a different approach 
    // or the rules need to be "allow read: if exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) && get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.clientId == request.auth.uid"

    let drawingsQuery;
    if (role === 'admin') {
      drawingsQuery = query(collection(db, DRAWINGS_COLLECTION), orderBy('uploadedAt', 'desc'));
    } else {
      // This might still fail if there are many drawings and no project-specific filter
      // But we'll try to at least filter by role-specific fields if they exist
      drawingsQuery = query(collection(db, DRAWINGS_COLLECTION));
    }

    const unsubscribeDrawings = onSnapshot(
      drawingsQuery,
      (snapshot) => {
        const drawings = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestamps(doc.data()),
        })) as Drawing[];
        set({ drawings });
      },
      (error) => {
        console.error('[ProjectStore] Error fetching drawings:', error);
      }
    );

    // Build Time Entries Query
    let timeEntriesQuery;
    if (role === 'admin') {
      timeEntriesQuery = query(collection(db, TIME_ENTRIES_COLLECTION), orderBy('date', 'desc'));
    } else if (role === 'client') {
      // Clients see time entries for their projects
      timeEntriesQuery = query(collection(db, TIME_ENTRIES_COLLECTION), orderBy('date', 'desc'));
    } else {
      timeEntriesQuery = query(collection(db, TIME_ENTRIES_COLLECTION), where('freelancerId', '==', userId), orderBy('date', 'desc'));
    }

    const unsubscribeTimeEntries = onSnapshot(
      timeEntriesQuery,
      (snapshot) => {
        const timeEntries = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestamps(doc.data()),
        })) as TimeEntry[];
        set({ timeEntries });
      },
      (error) => {
        console.error('[ProjectStore] Error fetching time entries:', error);
      }
    );

    // Build Proofs Query
    let proofsQuery;
    if (role === 'admin') {
      proofsQuery = query(collection(db, PROOFS_COLLECTION), orderBy('submittedAt', 'desc'));
    } else if (role === 'freelancer') {
      proofsQuery = query(collection(db, PROOFS_COLLECTION), where('freelancerId', '==', userId), orderBy('submittedAt', 'desc'));
    } else {
      proofsQuery = query(collection(db, PROOFS_COLLECTION), orderBy('submittedAt', 'desc'));
    }

    const unsubscribeProofs = onSnapshot(
      proofsQuery,
      (snapshot) => {
        const proofs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestamps(doc.data()),
        })) as ProofOfWork[];
        set({ proofs });
      },
      (error) => {
        console.error('[ProjectStore] Error fetching proofs:', error);
      }
    );

    set({
      unsubscribeProjects,
      unsubscribeDrawings,
      unsubscribeTimeEntries,
      unsubscribeProofs,
    });
  },

  cleanup: () => {
    const state = get();
    if (state.unsubscribeProjects) state.unsubscribeProjects();
    if (state.unsubscribeDrawings) state.unsubscribeDrawings();
    if (state.unsubscribeTimeEntries) state.unsubscribeTimeEntries();
    if (state.unsubscribeProofs) state.unsubscribeProofs();
    set({
      unsubscribeProjects: null,
      unsubscribeDrawings: null,
      unsubscribeTimeEntries: null,
      unsubscribeProofs: null,
    });
  },

  setProjects: (projects) => set({ projects }),

  setCurrentProject: (project) => set({ currentProject: project }),

  createProject: async (projectData) => {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase not configured');
    }

    set({ isLoading: true });

    try {
      const newProject = {
        name: projectData.name!,
        description: projectData.description || '',
        clientId: projectData.clientId!,
        freelancerId: projectData.freelancerId,
        status: 'draft' as ProjectStatus,
        hoursAllocated: projectData.hoursAllocated || 1,
        hoursUsed: 0,
        budget: projectData.budget || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deadline: projectData.deadline,
        thumbnail: projectData.thumbnail,
        address: projectData.address,
        projectType: projectData.projectType || 'residential',
        drawings: [],
        milestones: projectData.milestones || [],
        comments: [],
        referenceNumber: projectData.referenceNumber,
        teamMembers: projectData.teamMembers || [],
      };

      const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), newProject);

      const createdProject: Project = {
        id: docRef.id,
        ...newProject,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft',
        drawings: [],
        milestones: projectData.milestones || [],
        comments: [],
      } as Project;

      set({ isLoading: false });
      return createdProject;
    } catch (error) {
      console.error('[ProjectStore] Error creating project:', error);
      set({ error: 'Failed to create project', isLoading: false });
      throw error;
    }
  },

  updateProject: async (id, updates) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const projectRef = doc(db, PROJECTS_COLLECTION, id);
      await updateDoc(projectRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[ProjectStore] Error updating project:', error);
      set({ error: 'Failed to update project' });
      throw error;
    }
  },

  deleteProject: async (id) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      // Delete associated drawings
      const drawingsQuery = query(collection(db, DRAWINGS_COLLECTION), where('projectId', '==', id));
      const drawingsSnapshot = await getDocs(drawingsQuery);
      for (const drawingDoc of drawingsSnapshot.docs) {
        await deleteDoc(drawingDoc.ref);
      }

      // Delete associated time entries
      const timeEntriesQuery = query(collection(db, TIME_ENTRIES_COLLECTION), where('projectId', '==', id));
      const timeEntriesSnapshot = await getDocs(timeEntriesQuery);
      for (const timeEntryDoc of timeEntriesSnapshot.docs) {
        await deleteDoc(timeEntryDoc.ref);
      }

      // Delete project
      await deleteDoc(doc(db, PROJECTS_COLLECTION, id));
    } catch (error) {
      console.error('[ProjectStore] Error deleting project:', error);
      set({ error: 'Failed to delete project' });
      throw error;
    }
  },

  addDrawing: async (drawingData) => {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase not configured');
    }

    try {
      const newDrawing = {
        projectId: drawingData.projectId!,
        name: drawingData.name!,
        type: drawingData.type || DrawingType.FLOOR_PLAN,
        status: 'pending' as DrawingStatus,
        fileUrl: drawingData.fileUrl!,
        thumbnailUrl: drawingData.thumbnailUrl,
        version: 1,
        uploadedBy: drawingData.uploadedBy!,
        uploadedAt: serverTimestamp(),
        fileSize: drawingData.fileSize || 0,
        dimensions: drawingData.dimensions || { width: 841, height: 594, unit: 'mm' },
        annotations: [],
      };

      const docRef = await addDoc(collection(db, DRAWINGS_COLLECTION), newDrawing);

      const createdDrawing: Drawing = {
        id: docRef.id,
        ...newDrawing,
        uploadedAt: new Date(),
        status: 'pending',
      } as Drawing;

      // Auto-run agent check
      setTimeout(() => {
        void get().runAgentCheck(createdDrawing.id).catch(err =>
          console.error('Agent check failed for new drawing:', err)
        );
      }, 0);

      return createdDrawing;
    } catch (error) {
      console.error('[ProjectStore] Error adding drawing:', error);
      throw error;
    }
  },

  updateDrawing: async (id, updates) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const drawingRef = doc(db, DRAWINGS_COLLECTION, id);
      await updateDoc(drawingRef, updates);
    } catch (error) {
      console.error('[ProjectStore] Error updating drawing:', error);
      set({ error: 'Failed to update drawing' });
      throw error;
    }
  },

  deleteDrawing: async (id) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      await deleteDoc(doc(db, DRAWINGS_COLLECTION, id));
    } catch (error) {
      console.error('[ProjectStore] Error deleting drawing:', error);
      set({ error: 'Failed to delete drawing' });
      throw error;
    }
  },

  addTimeEntry: async (entryData) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const newEntry = {
        projectId: entryData.projectId!,
        freelancerId: entryData.freelancerId!,
        drawingId: entryData.drawingId,
        description: entryData.description!,
        hours: entryData.hours!,
        date: entryData.date || new Date(),
        createdAt: serverTimestamp(),
        invoiced: false,
      };

      await addDoc(collection(db, TIME_ENTRIES_COLLECTION), newEntry);

      // Update project hours used using atomic increment
      const projectRef = doc(db, PROJECTS_COLLECTION, entryData.projectId!);
      await updateDoc(projectRef, {
        hoursUsed: increment(entryData.hours!),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[ProjectStore] Error adding time entry:', error);
      set({ error: 'Failed to add time entry' });
      throw error;
    }
  },

  updateTimeEntry: async (id, updates) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const entryRef = doc(db, TIME_ENTRIES_COLLECTION, id);
      await updateDoc(entryRef, updates);
    } catch (error) {
      console.error('[ProjectStore] Error updating time entry:', error);
      set({ error: 'Failed to update time entry' });
      throw error;
    }
  },

  addMilestone: async (milestoneData) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const project = get().projects.find(p => p.id === milestoneData.projectId);
      if (!project) throw new Error('Project not found');

      const newMilestone: Milestone = {
        id: `ms-${Date.now()}`,
        projectId: milestoneData.projectId!,
        name: milestoneData.name!,
        description: milestoneData.description || '',
        status: 'pending',
        dueDate: milestoneData.dueDate,
        order: milestoneData.order || 0,
      };

      const updatedMilestones = [...project.milestones, newMilestone];

      const projectRef = doc(db, PROJECTS_COLLECTION, milestoneData.projectId!);
      await updateDoc(projectRef, {
        milestones: updatedMilestones,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[ProjectStore] Error adding milestone:', error);
      set({ error: 'Failed to add milestone' });
      throw error;
    }
  },

  updateMilestone: async (id, updates) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const project = get().projects.find(p => p.milestones.some(m => m.id === id));
      if (!project) throw new Error('Project not found');

      const updatedMilestones = project.milestones.map(m =>
        m.id === id ? { ...m, ...updates } : m
      );

      const projectRef = doc(db, PROJECTS_COLLECTION, project.id);
      await updateDoc(projectRef, {
        milestones: updatedMilestones,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[ProjectStore] Error updating milestone:', error);
      set({ error: 'Failed to update milestone' });
      throw error;
    }
  },

  runAgentCheck: async (drawingId) => {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase not configured');
    }

    const drawing = get().drawings.find(d => d.id === drawingId);
    if (!drawing) throw new Error('Drawing not found');

    // Update drawing status to in_review
    await get().updateDrawing(drawingId, { status: 'in_review' });

    // Simulate agent check process
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate random issues based on drawing type
    const issues: AgentIssue[] = [];
    const issueCount = Math.floor(Math.random() * 4);

    const issueTypes: AgentIssue['type'][] = ['compliance', 'dimension', 'scale', 'annotation', 'layer', 'symbol'];
    const severities: AgentIssue['severity'][] = ['critical', 'high', 'medium', 'low'];

    for (let i = 0; i < issueCount; i++) {
      issues.push({
        id: `issue-${Date.now()}-${i}`,
        type: issueTypes[Math.floor(Math.random() * issueTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        description: `Issue detected in ${drawing.type.replace('_', ' ')}`,
        location: { x: Math.random() * 800, y: Math.random() * 600 },
        suggestion: 'Review and correct the identified issue',
        isResolved: false,
      });
    }

    const agentCheck: AgentCheck = {
      id: `check-${Date.now()}`,
      drawingId,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      overallScore: Math.floor(Math.random() * 30) + 70,
      issues,
    };

    // Update drawing with agent check
    await get().updateDrawing(drawingId, {
      agentCheck,
      status: issues.length === 0 ? 'approved' : 'revision_needed'
    });

    return agentCheck;
  },

  overrideAgentCheck: async (checkId, reason) => {
    // This would need to find the drawing with the matching agentCheck and update it
    const drawing = get().drawings.find(d => d.agentCheck?.id === checkId);
    if (!drawing) throw new Error('Drawing not found');

    await get().updateDrawing(drawing.id, {
      agentCheck: {
        ...drawing.agentCheck!,
        status: 'overridden',
        overrideReason: reason,
      },
      status: 'approved',
    });
  },

  resolveIssue: async (checkId, issueId, userId) => {
    const drawing = get().drawings.find(d => d.agentCheck?.id === checkId);
    if (!drawing || !drawing.agentCheck) throw new Error('Drawing or check not found');

    const updatedIssues = drawing.agentCheck.issues.map(i =>
      i.id === issueId
        ? { ...i, isResolved: true, resolvedBy: userId, resolvedAt: new Date() }
        : i
    );

    await get().updateDrawing(drawing.id, {
      agentCheck: {
        ...drawing.agentCheck,
        issues: updatedIssues,
      },
    });
  },

  // Proof of Work Actions
  submitProofOfWork: async (proofData) => {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase not configured');
    }

    set({ isLoading: true });

    try {
      const newProof = {
        taskId: proofData.taskId!,
        freelancerId: proofData.freelancerId!,
        projectId: proofData.projectId!,
        description: proofData.description!,
        attachments: proofData.attachments || [],
        submittedAt: serverTimestamp(),
        verificationStatus: 'pending',
      };

      const docRef = await addDoc(collection(db, PROOFS_COLLECTION), newProof);

      const createdProof: ProofOfWork = {
        id: docRef.id,
        ...newProof,
        submittedAt: new Date().toISOString(),
        verificationStatus: 'pending',
      } as ProofOfWork;

      set({ isLoading: false });
      return createdProof;
    } catch (error) {
      console.error('[ProjectStore] Error submitting proof:', error);
      set({ error: 'Failed to submit proof', isLoading: false });
      throw error;
    }
  },

  verifyProof: async (proofId, approved, reason, verifiedBy) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const proofRef = doc(db, PROOFS_COLLECTION, proofId);
      await updateDoc(proofRef, {
        verificationStatus: approved ? 'approved' : 'rejected',
        verifiedAt: serverTimestamp(),
        verifiedBy: verifiedBy || 'admin',
        rejectionReason: approved ? null : reason,
      });
    } catch (error) {
      console.error('[ProjectStore] Error verifying proof:', error);
      set({ error: 'Failed to verify proof' });
      throw error;
    }
  },

  getProofsByProjectId: (projectId) => {
    return get().proofs.filter(p => p.projectId === projectId);
  },

  getProofsByFreelancerId: (freelancerId) => {
    return get().proofs.filter(p => p.freelancerId === freelancerId);
  },

  getProofById: (proofId) => {
    return get().proofs.find(p => p.id === proofId);
  },
}));
