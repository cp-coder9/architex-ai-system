import { create } from 'zustand';
import { Project, Drawing, Milestone, TimeEntry, ProjectStatus, DrawingStatus, AgentCheck, AgentIssue, ProofOfWork, ProofAttachment } from '@/types';
import { DrawingType } from '@/types/agent';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  drawings: Drawing[];
  timeEntries: TimeEntry[];
  proofs: ProofOfWork[];
  isLoading: boolean;
  
  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  createProject: (project: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addDrawing: (drawing: Partial<Drawing>) => Promise<Drawing>;
  updateDrawing: (id: string, updates: Partial<Drawing>) => void;
  deleteDrawing: (id: string) => void;
  addTimeEntry: (entry: Partial<TimeEntry>) => void;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
  addMilestone: (milestone: Partial<Milestone>) => void;
  updateMilestone: (id: string, updates: Partial<Milestone>) => void;
  runAgentCheck: (drawingId: string) => Promise<AgentCheck>;
  overrideAgentCheck: (checkId: string, reason: string) => void;
  resolveIssue: (checkId: string, issueId: string, userId: string) => void;
  // Proof of Work Actions
  submitProofOfWork: (proofData: Partial<ProofOfWork>) => Promise<ProofOfWork>;
  verifyProof: (proofId: string, approved: boolean, reason?: string, verifiedBy?: string) => void;
  getProofsByProjectId: (projectId: string) => ProofOfWork[];
  getProofsByFreelancerId: (freelancerId: string) => ProofOfWork[];
  getProofById: (proofId: string) => ProofOfWork | undefined;
}

// Generate mock projects
const generateMockProjects = (): Project[] => [
  {
    id: 'proj-1',
    name: 'Modern Villa Renovation',
    description: 'Complete renovation of a 3-bedroom modern villa with pool and landscape redesign.',
    clientId: 'client-1',
    freelancerId: 'freelancer-1',
    status: 'active',
    hoursAllocated: 200,
    hoursUsed: 145,
    budget: 15000,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date(),
    deadline: new Date('2024-06-30'),
    thumbnail: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400',
    address: '123 Ocean Drive, Miami, FL',
    projectType: 'residential',
    drawings: [],
    milestones: [
      { id: 'ms-1', projectId: 'proj-1', name: 'Concept Approval', description: 'Initial design concept approved', status: 'completed', dueDate: new Date('2024-02-01'), completedAt: new Date('2024-01-28'), order: 1 },
      { id: 'ms-2', projectId: 'proj-1', name: 'Schematic Design', description: 'Detailed schematic drawings', status: 'completed', dueDate: new Date('2024-03-01'), completedAt: new Date('2024-02-25'), order: 2 },
      { id: 'ms-3', projectId: 'proj-1', name: 'Design Development', description: 'Developed design with material specifications', status: 'in_progress', dueDate: new Date('2024-04-15'), order: 3 },
      { id: 'ms-4', projectId: 'proj-1', name: 'Construction Documents', description: 'Final construction drawings', status: 'pending', dueDate: new Date('2024-05-30'), order: 4 },
    ],
    comments: [],
  },
  {
    id: 'proj-2',
    name: 'Commercial Office Building',
    description: 'New 5-story commercial office building in downtown district.',
    clientId: 'client-1',
    freelancerId: 'freelancer-1',
    status: 'active',
    hoursAllocated: 500,
    hoursUsed: 175,
    budget: 45000,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date(),
    deadline: new Date('2024-12-31'),
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
    address: '456 Business Ave, New York, NY',
    projectType: 'commercial',
    drawings: [],
    milestones: [
      { id: 'ms-5', projectId: 'proj-2', name: 'Site Analysis', description: 'Complete site analysis and survey', status: 'completed', dueDate: new Date('2024-03-01'), completedAt: new Date('2024-02-28'), order: 1 },
      { id: 'ms-6', projectId: 'proj-2', name: 'Preliminary Design', description: 'Preliminary architectural design', status: 'in_progress', dueDate: new Date('2024-04-30'), order: 2 },
    ],
    comments: [],
  },
];

// Generate mock drawings
const generateMockDrawings = (): Drawing[] => [
  {
    id: 'draw-1',
    projectId: 'proj-1',
    name: 'Ground Floor Plan',
    type: DrawingType.FLOOR_PLAN,
    status: 'approved',
    fileUrl: '/drawings/ground-floor.pdf',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300',
    version: 3,
    uploadedBy: 'freelancer-1',
    uploadedAt: new Date('2024-02-20'),
    fileSize: 2500000,
    dimensions: { width: 841, height: 594, unit: 'mm' },
    annotations: [],
    agentCheck: {
      id: 'check-1',
      drawingId: 'draw-1',
      status: 'completed',
      startedAt: new Date('2024-02-20T10:00:00'),
      completedAt: new Date('2024-02-20T10:05:00'),
      overallScore: 95,
      issues: [],
    },
  },
  {
    id: 'draw-2',
    projectId: 'proj-1',
    name: 'First Floor Plan',
    type: DrawingType.FLOOR_PLAN,
    status: 'in_review',
    fileUrl: '/drawings/first-floor.pdf',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300',
    version: 2,
    uploadedBy: 'freelancer-1',
    uploadedAt: new Date('2024-02-25'),
    fileSize: 2200000,
    dimensions: { width: 841, height: 594, unit: 'mm' },
    annotations: [],
    agentCheck: {
      id: 'check-2',
      drawingId: 'draw-2',
      status: 'completed',
      startedAt: new Date('2024-02-25T14:00:00'),
      completedAt: new Date('2024-02-25T14:04:00'),
      overallScore: 78,
      issues: [
        {
          id: 'issue-1',
          type: 'dimension',
          severity: 'high',
          description: 'Missing dimension line for bedroom wall',
          location: { x: 450, y: 320 },
          suggestion: 'Add dimension line showing full wall length',
          isResolved: false,
        },
        {
          id: 'issue-2',
          type: 'annotation',
          severity: 'medium',
          description: 'Door swing direction not indicated',
          location: { x: 380, y: 280 },
          suggestion: 'Add door swing arc symbol',
          isResolved: true,
          resolvedBy: 'freelancer-1',
          resolvedAt: new Date('2024-02-26'),
        },
      ],
    },
  },
  {
    id: 'draw-3',
    projectId: 'proj-1',
    name: 'Front Elevation',
    type: DrawingType.ELEVATION,
    status: 'pending',
    fileUrl: '/drawings/front-elevation.pdf',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300',
    version: 1,
    uploadedBy: 'freelancer-1',
    uploadedAt: new Date('2024-03-01'),
    fileSize: 1800000,
    dimensions: { width: 594, height: 841, unit: 'mm' },
    annotations: [],
  },
  {
    id: 'draw-4',
    projectId: 'proj-2',
    name: 'Site Plan',
    type: DrawingType.SITE_PLAN,
    status: 'approved',
    fileUrl: '/drawings/site-plan.pdf',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300',
    version: 2,
    uploadedBy: 'freelancer-1',
    uploadedAt: new Date('2024-03-05'),
    fileSize: 3200000,
    dimensions: { width: 841, height: 594, unit: 'mm' },
    annotations: [],
    agentCheck: {
      id: 'check-3',
      drawingId: 'draw-4',
      status: 'completed',
      startedAt: new Date('2024-03-05T09:00:00'),
      completedAt: new Date('2024-03-05T09:06:00'),
      overallScore: 92,
      issues: [],
    },
  },
];

// Generate mock time entries
const generateMockTimeEntries = (): TimeEntry[] => [
  { id: 'te-1', projectId: 'proj-1', freelancerId: 'freelancer-1', drawingId: 'draw-1', description: 'Created ground floor plan layout', hours: 8, date: new Date('2024-02-15'), createdAt: new Date('2024-02-15'), invoiced: true, invoiceId: 'inv-1' },
  { id: 'te-2', projectId: 'proj-1', freelancerId: 'freelancer-1', drawingId: 'draw-1', description: 'Revised ground floor plan per client feedback', hours: 4, date: new Date('2024-02-18'), createdAt: new Date('2024-02-18'), invoiced: true, invoiceId: 'inv-1' },
  { id: 'te-3', projectId: 'proj-1', freelancerId: 'freelancer-1', drawingId: 'draw-2', description: 'Created first floor plan', hours: 6, date: new Date('2024-02-22'), createdAt: new Date('2024-02-22'), invoiced: true, invoiceId: 'inv-2' },
  { id: 'te-4', projectId: 'proj-1', freelancerId: 'freelancer-1', drawingId: 'draw-2', description: 'Fixed dimension and annotation issues', hours: 2, date: new Date('2024-02-26'), createdAt: new Date('2024-02-26'), invoiced: false },
  { id: 'te-5', projectId: 'proj-2', freelancerId: 'freelancer-1', drawingId: 'draw-4', description: 'Site analysis and planning', hours: 12, date: new Date('2024-02-20'), createdAt: new Date('2024-02-20'), invoiced: true, invoiceId: 'inv-3' },
  { id: 'te-6', projectId: 'proj-2', freelancerId: 'freelancer-1', description: 'Client meeting and requirements gathering', hours: 3, date: new Date('2024-02-25'), createdAt: new Date('2024-02-25'), invoiced: false },
];

// Generate mock proofs of work
const generateMockProofs = (): ProofOfWork[] => [
  {
    id: 'proof-1',
    taskId: 'task-1',
    freelancerId: 'freelancer-1',
    projectId: 'proj-1',
    description: 'Completed ground floor plan with all required dimensions and annotations. Included kitchen layout, living room, and entrance foyer as per client requirements.',
    attachments: [
      { id: 'attach-1', fileName: 'ground-floor-v3.pdf', fileUrl: '/drawings/ground-floor-v3.pdf', fileType: 'drawing', uploadedAt: '2024-02-20T10:00:00Z' },
      { id: 'attach-2', fileName: 'ground-floor-screenshot.png', fileUrl: '/screenshots/ground-floor-screenshot.png', fileType: 'image', uploadedAt: '2024-02-20T10:05:00Z' },
    ],
    submittedAt: '2024-02-20T10:10:00Z',
    verifiedAt: '2024-02-21T14:30:00Z',
    verificationStatus: 'approved',
    verifiedBy: 'admin-1',
  },
  {
    id: 'proof-2',
    taskId: 'task-2',
    freelancerId: 'freelancer-1',
    projectId: 'proj-1',
    description: 'Completed first floor plan with 3 bedrooms, 2 bathrooms, and a balcony. All room dimensions verified against client specifications.',
    attachments: [
      { id: 'attach-3', fileName: 'first-floor-v2.pdf', fileUrl: '/drawings/first-floor-v2.pdf', fileType: 'drawing', uploadedAt: '2024-02-25T14:00:00Z' },
    ],
    submittedAt: '2024-02-25T14:15:00Z',
    verifiedAt: '2024-02-26T09:00:00Z',
    verificationStatus: 'rejected',
    verifiedBy: 'admin-1',
    rejectionReason: 'Missing dimension lines for master bedroom. Please add all dimension lines and resubmit.',
  },
  {
    id: 'proof-3',
    taskId: 'task-3',
    freelancerId: 'freelancer-1',
    projectId: 'proj-2',
    description: 'Completed site analysis survey with boundary lines, existing structures, and vegetation marked. Included elevation data and drainage considerations.',
    attachments: [
      { id: 'attach-4', fileName: 'site-analysis.pdf', fileUrl: '/drawings/site-analysis.pdf', fileType: 'drawing', uploadedAt: '2024-02-28T09:00:00Z' },
      { id: 'attach-5', fileName: 'site-photos.zip', fileUrl: '/attachments/site-photos.zip', fileType: 'document', uploadedAt: '2024-02-28T09:05:00Z' },
      { id: 'attach-6', fileName: 'survey-data.xlsx', fileUrl: '/attachments/survey-data.xlsx', fileType: 'document', uploadedAt: '2024-02-28T09:06:00Z' },
    ],
    submittedAt: '2024-02-28T09:10:00Z',
  },
  {
    id: 'proof-4',
    taskId: 'task-4',
    freelancerId: 'freelancer-2',
    projectId: 'proj-1',
    description: 'Front elevation design completed with material specifications and color palette.',
    attachments: [
      { id: 'attach-7', fileName: 'front-elevation.pdf', fileUrl: '/drawings/front-elevation.pdf', fileType: 'drawing', uploadedAt: '2024-03-01T11:00:00Z' },
    ],
    submittedAt: '2024-03-01T11:15:00Z',
    verifiedAt: '2024-03-01T15:00:00Z',
    verificationStatus: 'approved',
    verifiedBy: 'admin-1',
  },
];

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: generateMockProjects(),
  currentProject: null,
  drawings: generateMockDrawings(),
  timeEntries: generateMockTimeEntries(),
  proofs: generateMockProofs(),
  isLoading: false,

  setProjects: (projects) => set({ projects }),
  
  setCurrentProject: (project) => set({ currentProject: project }),

  createProject: async (projectData) => {
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectData.name!,
      description: projectData.description || '',
      clientId: projectData.clientId!,
      freelancerId: projectData.freelancerId,
      status: 'draft',
      hoursAllocated: projectData.hoursAllocated || 1,
      hoursUsed: 0,
      budget: projectData.budget || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    
    set(state => ({ 
      projects: [...state.projects, newProject],
      isLoading: false 
    }));
    
    return newProject;
  },

  updateProject: (id, updates) => {
    set(state => ({
      projects: state.projects.map(p => 
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      ),
      currentProject: state.currentProject?.id === id 
        ? { ...state.currentProject, ...updates, updatedAt: new Date() }
        : state.currentProject,
    }));
  },

  deleteProject: (id) => {
    set(state => ({
      projects: state.projects.filter(p => p.id !== id),
      drawings: state.drawings.filter(d => d.projectId !== id),
    }));
  },

  addDrawing: async (drawingData) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newDrawing: Drawing = {
      id: `draw-${Date.now()}`,
      projectId: drawingData.projectId!,
      name: drawingData.name!,
      type: drawingData.type || DrawingType.FLOOR_PLAN,
      status: 'pending',
      fileUrl: drawingData.fileUrl!,
      thumbnailUrl: drawingData.thumbnailUrl,
      version: 1,
      uploadedBy: drawingData.uploadedBy!,
      uploadedAt: new Date(),
      fileSize: drawingData.fileSize || 0,
      dimensions: drawingData.dimensions || { width: 841, height: 594, unit: 'mm' },
      annotations: [],
    };
    
    set(state => ({ drawings: [...state.drawings, newDrawing] }));
    
    // Auto-run agent check
    void get().runAgentCheck(newDrawing.id).catch(err => 
      console.error('Agent check failed for new drawing:', err)
    );
    
    return newDrawing;
  },

  updateDrawing: (id, updates) => {
    set(state => ({
      drawings: state.drawings.map(d => 
        d.id === id ? { ...d, ...updates } : d
      ),
    }));
  },

  deleteDrawing: (id) => {
    set(state => ({
      drawings: state.drawings.filter(d => d.id !== id),
    }));
  },

  addTimeEntry: (entryData) => {
    const newEntry: TimeEntry = {
      id: `te-${Date.now()}`,
      projectId: entryData.projectId!,
      freelancerId: entryData.freelancerId!,
      drawingId: entryData.drawingId,
      description: entryData.description!,
      hours: entryData.hours!,
      date: entryData.date || new Date(),
      createdAt: new Date(),
      invoiced: false,
    };
    
    set(state => ({ 
      timeEntries: [...state.timeEntries, newEntry] 
    }));
    
    // Update project hours used
    const project = get().projects.find(p => p.id === entryData.projectId);
    if (project) {
      get().updateProject(project.id, { 
        hoursUsed: project.hoursUsed + entryData.hours! 
      });
    }
  },

  updateTimeEntry: (id, updates) => {
    set(state => ({
      timeEntries: state.timeEntries.map(te => 
        te.id === id ? { ...te, ...updates } : te
      ),
    }));
  },

  addMilestone: (milestoneData) => {
    const newMilestone: Milestone = {
      id: `ms-${Date.now()}`,
      projectId: milestoneData.projectId!,
      name: milestoneData.name!,
      description: milestoneData.description || '',
      status: 'pending',
      dueDate: milestoneData.dueDate,
      order: milestoneData.order || 0,
    };
    
    set(state => ({
      projects: state.projects.map(p => 
        p.id === milestoneData.projectId 
          ? { ...p, milestones: [...p.milestones, newMilestone] }
          : p
      ),
    }));
  },

  updateMilestone: (id, updates) => {
    set(state => ({
      projects: state.projects.map(p => ({
        ...p,
        milestones: p.milestones.map(m => 
          m.id === id ? { ...m, ...updates } : m
        ),
      })),
    }));
  },

  runAgentCheck: async (drawingId) => {
    const drawing = get().drawings.find(d => d.id === drawingId);
    if (!drawing) throw new Error('Drawing not found');
    
    // Update drawing status to in_review
    get().updateDrawing(drawingId, { status: 'in_review' });
    
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
    get().updateDrawing(drawingId, { 
      agentCheck,
      status: issues.length === 0 ? 'approved' : 'revision_needed'
    });
    
    return agentCheck;
  },

  overrideAgentCheck: (checkId, reason) => {
    set(state => ({
      drawings: state.drawings.map(d => {
        if (d.agentCheck?.id === checkId) {
          return {
            ...d,
            agentCheck: {
              ...d.agentCheck,
              status: 'overridden',
              overrideReason: reason,
            },
            status: 'approved',
          };
        }
        return d;
      }),
    }));
  },

  resolveIssue: (checkId, issueId, userId) => {
    set(state => ({
      drawings: state.drawings.map(d => {
        if (d.agentCheck?.id === checkId) {
          return {
            ...d,
            agentCheck: {
              ...d.agentCheck,
              issues: d.agentCheck.issues.map(i => 
                i.id === issueId 
                  ? { ...i, isResolved: true, resolvedBy: userId, resolvedAt: new Date() }
                  : i
              ),
            },
          };
        }
        return d;
      }),
    }));
  },

  // Proof of Work Actions
  submitProofOfWork: async (proofData) => {
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newProof: ProofOfWork = {
      id: `proof-${Date.now()}`,
      taskId: proofData.taskId!,
      freelancerId: proofData.freelancerId!,
      projectId: proofData.projectId!,
      description: proofData.description!,
      attachments: proofData.attachments || [],
      submittedAt: new Date().toISOString(),
      verificationStatus: 'pending',
    };
    
    set(state => ({ 
      proofs: [...state.proofs, newProof],
      isLoading: false 
    }));
    
    return newProof;
  },

  verifyProof: (proofId, approved, reason, verifiedBy) => {
    set(state => ({
      proofs: state.proofs.map(p => 
        p.id === proofId 
          ? { 
              ...p, 
              verificationStatus: approved ? 'approved' : 'rejected',
              verifiedAt: new Date().toISOString(),
              verifiedBy: verifiedBy || 'admin',
              rejectionReason: approved ? undefined : reason,
            } 
          : p
      ),
    }));
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
