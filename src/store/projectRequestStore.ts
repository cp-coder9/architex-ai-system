import { create } from 'zustand';
import { ProjectRequest, ProjectRequestStatus } from '@/types';

interface ProjectRequestState {
  projectRequests: ProjectRequest[];
  isLoading: boolean;
  
  // Actions
  setProjectRequests: (requests: ProjectRequest[]) => void;
  createRequest: (request: Partial<ProjectRequest>) => Promise<ProjectRequest>;
  updateRequest: (id: string, updates: Partial<ProjectRequest>) => void;
  deleteRequest: (id: string) => void;
  approveRequest: (id: string, approvedBy: string) => void;
  rejectRequest: (id: string, rejectedBy: string, reason: string) => void;
  convertToProject: (id: string, projectId: string) => void;
  getRequestById: (id: string) => ProjectRequest | undefined;
  getRequestsByStatus: (status: ProjectRequestStatus) => ProjectRequest[];
}

// Generate mock project requests
const generateMockProjectRequests = (): ProjectRequest[] => [
  {
    id: 'pr-1',
    clientId: 'client-1',
    clientName: 'Sarah Johnson',
    clientEmail: 'sarah.johnson@techcorp.com',
    freelancerId: 'freelancer-1',
    freelancerName: 'Michael Chen',
    projectName: 'TechCorp Office Expansion',
    description: 'Complete renovation of 3-floor office building including new meeting rooms, open workspace redesign, and smart building integration.',
    projectType: 'commercial',
    hoursRequested: 150,
    budget: 25000,
    status: 'pending',
    address: '500 Tech Park Drive, San Francisco, CA',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: 'pr-2',
    clientId: 'client-2',
    clientName: 'Robert Williams',
    clientEmail: 'r.williams@residential.com',
    projectName: 'Modern Villa Design',
    description: 'New construction of a 4-bedroom modern villa with pool, home theater, and landscape architecture.',
    projectType: 'residential',
    hoursRequested: 200,
    budget: 35000,
    status: 'pending',
    address: '123 Ocean View Lane, Malibu, CA',
    createdAt: new Date('2024-02-18'),
    updatedAt: new Date('2024-02-18'),
  },
  {
    id: 'pr-3',
    clientId: 'client-3',
    clientName: 'Emily Davis',
    clientEmail: 'emily@greenbuild.com',
    freelancerId: 'freelancer-2',
    freelancerName: 'Lisa Anderson',
    projectName: 'Eco-Friendly Warehouse',
    description: 'Design of sustainable warehouse facility with solar panels, rainwater harvesting, and green roof system.',
    projectType: 'industrial',
    hoursRequested: 300,
    budget: 55000,
    status: 'approved',
    address: '800 Industrial Blvd, Austin, TX',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-12'),
    approvedBy: 'admin-1',
    approvedAt: new Date('2024-02-12'),
  },
  {
    id: 'pr-4',
    clientId: 'client-4',
    clientName: 'James Miller',
    clientEmail: 'j.miller@citydev.com',
    projectName: 'Downtown Mixed-Use Development',
    description: 'Large-scale mixed-use development with retail, office, and residential spaces across 5 towers.',
    projectType: 'commercial',
    hoursRequested: 500,
    budget: 150000,
    status: 'approved',
    address: '100 Main Street, Downtown District',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-08'),
    approvedBy: 'admin-1',
    approvedAt: new Date('2024-02-08'),
  },
  {
    id: 'pr-5',
    clientId: 'client-5',
    clientName: 'Amanda Brown',
    clientEmail: 'amanda.brown@homestyle.com',
    projectName: 'Suburban Home Renovation',
    description: 'Complete renovation of 1950s home with modern additions while preserving historical character.',
    projectType: 'residential',
    hoursRequested: 80,
    budget: 12000,
    status: 'rejected',
    address: '45 Heritage Lane, Boston, MA',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-03'),
    rejectedBy: 'admin-1',
    rejectedAt: new Date('2024-02-03'),
    rejectionReason: 'Scope too small for minimum project requirements. Client should consider direct freelancer engagement.',
  },
  {
    id: 'pr-6',
    clientId: 'client-1',
    clientName: 'Sarah Johnson',
    clientEmail: 'sarah.johnson@techcorp.com',
    freelancerId: 'freelancer-1',
    freelancerName: 'Michael Chen',
    projectName: 'TechCorp HQ Phase 2',
    description: 'Phase 2 of TechCorp headquarters expansion including rooftop garden and fitness center.',
    projectType: 'commercial',
    hoursRequested: 180,
    budget: 32000,
    status: 'converted',
    address: '500 Tech Park Drive, San Francisco, CA',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-25'),
    approvedBy: 'admin-1',
    approvedAt: new Date('2024-01-22'),
    convertedToProjectId: 'proj-3',
    convertedAt: new Date('2024-01-25'),
  },
  {
    id: 'pr-7',
    clientId: 'client-6',
    clientName: 'David Wilson',
    clientEmail: 'd.wilson@parkserv.com',
    projectName: 'Community Park Master Plan',
    description: 'Comprehensive master plan for 50-acre community park including trails, recreational facilities, and environmental restoration.',
    projectType: 'landscape',
    hoursRequested: 120,
    budget: 18000,
    status: 'pending',
    address: '1500 Parkside Avenue, Denver, CO',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
  },
  {
    id: 'pr-8',
    clientId: 'client-7',
    clientName: 'Michelle Taylor',
    clientEmail: 'm.taylor@medcenter.org',
    projectName: 'Medical Clinic Expansion',
    description: 'Addition of new patient wing and renovation of existing facilities to meet growing community healthcare needs.',
    projectType: 'commercial',
    hoursRequested: 250,
    budget: 45000,
    status: 'pending',
    address: '200 Health Center Drive, Seattle, WA',
    createdAt: new Date('2024-02-22'),
    updatedAt: new Date('2024-02-22'),
  },
];

export const useProjectRequestStore = create<ProjectRequestState>((set, get) => ({
  projectRequests: generateMockProjectRequests(),
  isLoading: false,

  setProjectRequests: (requests) => set({ projectRequests: requests }),
  
  createRequest: async (requestData) => {
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newRequest: ProjectRequest = {
      id: `pr-${Date.now()}`,
      clientId: requestData.clientId!,
      clientName: requestData.clientName!,
      clientEmail: requestData.clientEmail!,
      freelancerId: requestData.freelancerId,
      freelancerName: requestData.freelancerName,
      projectName: requestData.projectName!,
      description: requestData.description || '',
      projectType: requestData.projectType || 'residential',
      hoursRequested: requestData.hoursRequested || 0,
      budget: requestData.budget || 0,
      status: 'pending',
      address: requestData.address,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set(state => ({ 
      projectRequests: [...state.projectRequests, newRequest],
      isLoading: false 
    }));
    
    return newRequest;
  },

  updateRequest: (id, updates) => {
    set(state => ({
      projectRequests: state.projectRequests.map(pr => 
        pr.id === id ? { ...pr, ...updates, updatedAt: new Date() } : pr
      ),
    }));
  },

  deleteRequest: (id) => {
    set(state => ({
      projectRequests: state.projectRequests.filter(pr => pr.id !== id),
    }));
  },

  approveRequest: (id, approvedBy) => {
    set(state => ({
      projectRequests: state.projectRequests.map(pr => 
        pr.id === id 
          ? { 
              ...pr, 
              status: 'approved' as ProjectRequestStatus, 
              approvedBy, 
              approvedAt: new Date(),
              updatedAt: new Date() 
            } 
          : pr
      ),
    }));
  },

  rejectRequest: (id, rejectedBy, reason) => {
    set(state => ({
      projectRequests: state.projectRequests.map(pr => 
        pr.id === id 
          ? { 
              ...pr, 
              status: 'rejected' as ProjectRequestStatus, 
              rejectedBy, 
              rejectedAt: new Date(),
              rejectionReason: reason,
              updatedAt: new Date() 
            } 
          : pr
      ),
    }));
  },

  convertToProject: (id, projectId) => {
    set(state => ({
      projectRequests: state.projectRequests.map(pr => 
        pr.id === id 
          ? { 
              ...pr, 
              status: 'converted' as ProjectRequestStatus, 
              convertedToProjectId: projectId,
              convertedAt: new Date(),
              updatedAt: new Date() 
            } 
          : pr
      ),
    }));
  },

  getRequestById: (id) => {
    return get().projectRequests.find(pr => pr.id === id);
  },

  getRequestsByStatus: (status) => {
    return get().projectRequests.filter(pr => pr.status === status);
  },
}));
