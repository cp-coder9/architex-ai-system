import { DrawingType as AgentDrawingType } from './agent';

export type UserRole = 'admin' | 'client' | 'freelancer';

// DrawingType is re-exported at the end of this file

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  phone?: string;
  company?: string;
  address?: string;
}

export interface Client extends User {
  role: 'client';
  totalHoursPurchased: number;
  totalHoursUsed: number;
  projects: string[];
  paymentMethods: PaymentMethod[];
}

export interface Freelancer extends User {
  role: 'freelancer';
  hourlyRate: number;
  skills: string[];
  totalHoursWorked: number;
  totalEarnings: number;
  rating: number;
  availability: 'available' | 'busy' | 'unavailable';
  currentProjects: string[];
  certifications: string[];
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
  lastLogin: Date;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'paypal';
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type DrawingStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'revision_needed';

// Re-export DrawingType enum from agent.ts as the single source of truth
export { AgentDrawingType as DrawingType };

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  freelancerId?: string;
  status: ProjectStatus;
  hoursAllocated: number;
  hoursUsed: number;
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  budget: number;
  drawings: Drawing[];
  milestones: Milestone[];
  comments: Comment[];
  thumbnail?: string;
  address?: string;
  projectType: 'residential' | 'commercial' | 'industrial' | 'landscape';
  referenceNumber?: string;
  teamMembers?: string[];
}

export interface Drawing {
  id: string;
  projectId: string;
  name: string;
  type: AgentDrawingType;
  status: DrawingStatus;
  fileUrl: string;
  thumbnailUrl?: string;
  version: number;
  uploadedBy: string;
  uploadedAt: Date;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
    unit: 'mm' | 'cm' | 'm' | 'ft' | 'in';
  };
  agentCheck?: AgentCheck;
  annotations: Annotation[];
  previousVersions?: string[];
}

export interface AgentCheck {
  id: string;
  drawingId: string;
  status: 'pending' | 'checking' | 'completed' | 'overridden';
  startedAt: Date;
  completedAt?: Date;
  issues: AgentIssue[];
  overallScore: number;
  checkedBy?: string;
  overrideReason?: string;
}

export interface AgentIssue {
  id: string;
  type: 'compliance' | 'dimension' | 'scale' | 'annotation' | 'layer' | 'symbol' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location?: {
    x: number;
    y: number;
    page?: number;
  };
  suggestion?: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface Annotation {
  id: string;
  drawingId: string;
  type: 'comment' | 'markup' | 'measurement';
  content: string;
  position: {
    x: number;
    y: number;
  };
  createdBy: string;
  createdAt: Date;
  resolved: boolean;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: Date;
  completedAt?: Date;
  order: number;
}

export interface Comment {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  createdAt: Date;
  attachments?: string[];
}

export interface TimeEntry {
  id: string;
  projectId: string;
  freelancerId: string;
  drawingId?: string;
  description: string;
  hours: number;
  date: Date;
  createdAt: Date;
  invoiced: boolean;
  invoiceId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  projectId: string;
  freelancerId: string;
  timeEntries: string[];
  hoursTotal: number;
  hourlyRate: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdAt: Date;
  sentAt?: Date;
  paidAt?: Date;
  dueDate: Date;
  notes?: string;
}

export interface HourPackage {
  id: string;
  clientId: string;
  hours: number;
  pricePerHour: number;
  totalPrice: number;
  hoursUsed: number;
  hoursRemaining: number;
  purchasedAt: Date;
  expiresAt?: Date;
  status: 'active' | 'expired' | 'depleted';
  paymentStatus: 'pending' | 'completed' | 'failed';
}

export interface Notification {
  id: string;
  userId: string;
  type: 'project_update' | 'drawing_status' | 'agent_check' | 'invoice' | 'message' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
  data?: Record<string, any>;
}

export interface AgentLog {
  id: string;
  agentId: string;
  action: string;
  details: string;
  timestamp: Date;
  projectId?: string;
  drawingId?: string;
}

export interface Settings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  emailNotifications: {
    projectUpdates: boolean;
    drawingStatus: boolean;
    agentChecks: boolean;
    invoices: boolean;
    messages: boolean;
    marketing: boolean;
  };
  pushNotifications: {
    enabled: boolean;
    projectUpdates: boolean;
    drawingStatus: boolean;
    messages: boolean;
  };
}

export interface ChatMessage {
  id: string;
  projectId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  attachments?: string[];
  readBy: string[];
}

export interface Analytics {
  projectId: string;
  totalDrawings: number;
  drawingsByStatus: Record<DrawingStatus, number>;
  totalHours: number;
  hoursByWeek: { week: string; hours: number }[];
  agentChecksCompleted: number;
  issuesFound: number;
  issuesResolved: number;
  averageDrawingScore: number;
}

export type ProjectRequestStatus = 'pending' | 'approved' | 'rejected' | 'converted';

export interface ProjectRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  freelancerId?: string;
  freelancerName?: string;
  projectName: string;
  description: string;
  projectType: 'residential' | 'commercial' | 'industrial' | 'landscape';
  hoursRequested: number;
  budget: number;
  status: ProjectRequestStatus;
  address?: string;
  propertyDetails?: {
    identifierType: 'erf' | 'stand';
    identifierNumber: string;
    physicalAddress: {
      street: string;
      suburb: string;
      city: string;
      province: string;
      postalCode: string;
    };
  };
  serviceDetails?: {
    serviceType: string;
    customDescription?: string;
    urgency: string;
  };
  attachments?: {
    id: string;
    name: string;
    url?: string;
    file?: File; // For newly uploaded files
    preview?: string;
    type: string;
    size: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  convertedToProjectId?: string;
  convertedAt?: Date;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: string;
  category: 'user' | 'project' | 'drawing' | 'invoice' | 'system' | 'security';
  severity: 'info' | 'warning' | 'critical';
  status: 'success' | 'failed' | 'pending';
  details: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export interface SecurityEvent {
  id: string;
  eventType: 'login' | 'logout' | 'failed_login' | 'permission_denied' | 'data_access' | 'configuration_change' | 'threat_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  userName: string;
  description: string;
  ipAddress: string;
  timestamp: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

// ============================================
// Hour Allocation Types (Feature 1)
// ============================================

// Track allocation of hours from HourPackage to specific projects/tasks
export interface HourAllocation {
  id: string;
  clientId: string;
  projectId: string;
  hourPackageId: string;
  allocatedHours: number;
  usedHours: number;
  remainingHours: number;
  allocatedAt: string;
  expiresAt: string;
  status: 'active' | 'exhausted' | 'expired';
}

// Track individual hour transactions
export interface HourTransaction {
  id: string;
  allocationId: string;
  projectId: string;
  taskId?: string;
  freelancerId: string;
  hours: number;
  description: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

// ============================================
// Proof of Work Types (Feature 2)
// ============================================

// Individual attachment for proof of work
export interface ProofAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: 'image' | 'document' | 'drawing' | 'other';
  uploadedAt: string;
}

// Proof of work submission
export interface ProofOfWork {
  id: string;
  taskId: string;
  freelancerId: string;
  projectId: string;
  description: string;
  attachments: ProofAttachment[];
  submittedAt: string;
  verifiedAt?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verifiedBy?: string;
  rejectionReason?: string;
}

// ============================================
// Freelancer Marketplace Types (Feature 3)
// ============================================

// Task milestone for tracking progress
export interface TaskMilestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  hoursRequired: number;
}

// Marketplace task posted by admin
export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  requiredSkills: string[];
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  estimatedHours: number;
  hourlyRate: number;
  budget: number;
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  postedBy: string;
  postedAt: string;
  deadline: string;
  milestones: TaskMilestone[];
  assignedTo?: string;
  selectedApplicationId?: string;
}

// Freelancer's application to a task
export interface TaskApplication {
  id: string;
  taskId: string;
  freelancerId: string;
  coverLetter: string;
  proposedRate: number;
  estimatedDuration: number;
  proposedStartDate: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  appliedAt: string;
  respondedAt?: string;
  adminNotes?: string;
}
