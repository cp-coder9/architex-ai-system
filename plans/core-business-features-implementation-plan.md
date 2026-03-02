# Core Business Features Implementation Plan

## Executive Summary

This document outlines a comprehensive implementation plan for three core business logic features: Hour Allocation, Proof of Work, and Freelancer Marketplace. The plan follows existing architectural patterns identified in the codebase, including Zustand stores, TypeScript interfaces, and shadcn/ui component conventions.

---

## Identified Codebase Patterns

### Type Definitions (`src/types/index.ts`)
- Interfaces use `id: string` as primary identifier
- Timestamps use `Date` type with `createdAt`/`updatedAt` fields
- Status types use string literal unions (e.g., `'draft' | 'active' | 'completed'`)
- Related entities use string arrays of IDs (e.g., `timeEntries: string[]`)

### Store Patterns (`src/store/*.ts`)
- Zustand state management with `create<State>()`
- Mock data generation functions for development
- Async actions use `setTimeout` with `await new Promise(resolve => setTimeout(resolve, delay))`
- State updates use functional updates: `set(state => ({ ... }))`
- Exports follow pattern: `export { useXxxStore } from './xxxStore';`

### UI Component Patterns (`src/sections/*/`)
- Header with motion animation using `framer-motion`
- Stats cards using `Card`, `CardContent` with grid layout
- Data display using `Table` or `ScrollArea` with mapped items
- Dialogs for detail views using shadcn `Dialog` components
- Toast notifications via `sonner` for user feedback
- Icons from `lucide-react`

---

## Feature 1: Hour Allocation

### 1.1 Data Model Extensions

#### New Types to Add to `src/types/index.ts`

```typescript
// Hour Allocation Status
export type HourAllocationStatus = 'allocated' | 'partially_used' | 'fully_used' | 'expired';

// Hour Allocation - tracks hours allocated from packages to projects
export interface HourAllocation {
  id: string;
  packageId: string;
  projectId: string;
  clientId: string;
  hoursAllocated: number;
  hoursUsed: number;
  hoursRemaining: number;
  allocatedAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  status: HourAllocationStatus;
}

// Hour Allocation Transaction - audit trail for hour usage
export type HourTransactionType = 'allocation' | 'usage' | 'adjustment' | 'expiration';

export interface HourTransaction {
  id: string;
  allocationId: string;
  packageId: string;
  projectId: string;
  freelancerId?: string;
  type: HourTransactionType;
  hours: number;
  balanceAfter: number;
  description: string;
  createdAt: Date;
  createdBy: string;
}
```

#### Update Existing Types

Extend `HourPackage` in `src/types/index.ts`:
```typescript
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
  allocations?: string[]; // NEW: Array of allocation IDs
}
```

### 1.2 Store Updates

#### Option A: Extend `invoiceStore.ts`

Add to `InvoiceState` interface in `src/store/invoiceStore.ts`:

```typescript
interface InvoiceState {
  // ... existing properties
  allocations: HourAllocation[];
  transactions: HourTransaction[];
  
  // New actions
  allocateHours: (packageId: string, projectId: string, hours: number, clientId: string) => Promise<HourAllocation>;
  useHours: (allocationId: string, projectId: string, freelancerId: string, hours: number, description: string) => Promise<HourTransaction>;
  getProjectAllocations: (projectId: string) => HourAllocation[];
  getClientAllocations: (clientId: string) => HourAllocation[];
  getAllocationTransactions: (allocationId: string) => HourTransaction[];
}
```

#### Store Actions Implementation

Add mock data generation for allocations and transactions:

```typescript
// Generate mock allocations
const generateMockAllocations = (): HourAllocation[] => [
  {
    id: 'alloc-1',
    packageId: 'pkg-1',
    projectId: 'proj-1',
    clientId: 'client-1',
    hoursAllocated: 100,
    hoursUsed: 65,
    hoursRemaining: 35,
    allocatedAt: new Date('2024-01-20'),
    lastUsedAt: new Date('2024-03-01'),
    expiresAt: new Date('2024-07-15'),
    status: 'partially_used',
  },
];

// Generate mock transactions
const generateMockTransactions = (): HourTransaction[] => [
  {
    id: 'txn-1',
    allocationId: 'alloc-1',
    packageId: 'pkg-1',
    projectId: 'proj-1',
    freelancerId: 'freelancer-1',
    type: 'usage',
    hours: 8,
    balanceAfter: 92,
    description: 'Ground floor plan creation',
    createdAt: new Date('2024-01-25'),
    createdBy: 'freelancer-1',
  },
];
```

### 1.3 UI Components in ProjectOversight.tsx

#### New Hour Allocation Panel

Add to `src/sections/admin/ProjectOversight.tsx`:

1. **Hour Allocation Stats Card** (in the stats grid):
   - Total hours allocated across all projects
   - Hours used vs remaining
   - Active allocations count

2. **Project Hour Details** (in `ProjectDetailDialog`):
   - Display allocated hours from each package
   - Show hours used and remaining
   - Progress bar visualization

3. **New Component: HourAllocationDialog**
   - Select client and available hour package
   - Choose project to allocate to
   - Input hours to allocate
   - Preview allocation summary

#### Component Structure

```typescript
// New component: HourAllocationDialog.tsx
function HourAllocationDialog({ 
  open, 
  onOpenChange, 
  onAllocate 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllocate: (data: AllocationData) => void;
}) {
  // Client package selector
  // Project selector
  // Hours input with validation
  // Allocation preview
}
```

### 1.4 Integration Points with HourPackage

- **Allocation Creation**: Validates package has sufficient `hoursRemaining`
- **Usage Tracking**: Updates both allocation and package `hoursUsed`/`hoursRemaining`
- **Expiration Handling**: Checks `expiresAt` date, marks as 'expired' when passed
- **Transaction Audit**: Every hour movement creates a `HourTransaction` record

---

## Feature 2: Proof of Work

### 2.1 New Type Definitions

Add to `src/types/index.ts`:

```typescript
// Proof of Work Status
export type ProofOfWorkStatus = 'pending' | 'verified' | 'rejected' | 'requires_revision';

// Verification level
export type VerificationLevel = 'automatic' | 'manual' | 'admin_approved';

// Proof of Work - evidence of work completion
export interface ProofOfWork {
  id: string;
  taskId?: string; // Optional - for marketplace tasks
  projectId: string;
  drawingId?: string; // Optional - for drawing-related proofs
  freelancerId: string;
  title: string;
  description: string;
  attachments: ProofAttachment[];
  hoursClaimed: number;
  submittedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  status: ProofOfWorkStatus;
  verificationLevel?: VerificationLevel;
  adminNotes?: string;
  clientApproved: boolean;
  clientApprovedAt?: Date;
}

// Proof Attachment - file or image as evidence
export type AttachmentType = 'image' | 'document' | 'video' | 'link';

export interface ProofAttachment {
  id: string;
  proofOfWorkId: string;
  type: AttachmentType;
  name: string;
  url: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: Date;
  description?: string;
}
```

### 2.2 Update Existing Drawing Type

Extend `Drawing` interface in `src/types/index.ts`:

```typescript
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
  // NEW FIELDS
  proofOfWorkId?: string;
  workDescription?: string;
  verificationBadge?: VerificationLevel;
}
```

### 2.3 Store Updates

Add to `ProjectState` in `src/store/projectStore.ts`:

```typescript
interface ProjectState {
  // ... existing properties
  proofsOfWork: ProofOfWork[];
  
  // New actions
  submitProofOfWork: (data: Partial<ProofOfWork>) => Promise<ProofOfWork>;
  addProofAttachment: (proofId: string, attachment: Partial<ProofAttachment>) => Promise<ProofAttachment>;
  verifyProofOfWork: (proofId: string, status: ProofOfWorkStatus, adminNotes?: string) => void;
  approveProofByClient: (proofId: string) => void;
  getFreelancerProofs: (freelancerId: string) => ProofOfWork[];
  getProjectProofs: (projectId: string) => ProofOfWork[];
}
```

### 2.4 Extensions to DrawingSubmission.tsx

#### UI Changes to `src/sections/freelancer/DrawingSubmission.tsx`

1. **Enhanced Upload Zone**:
   - Add description field for work being submitted
   - Multiple file upload with attachment type indicators
   - Drag-and-drop support for images and documents

2. **New Proof Submission Section**:
   - Add "Submit Proof of Work" button/dialog
   - Work description textarea
   - Attachment upload with preview
   - Hours claimed input

3. **Drawing Status Enhancement**:
   - Add verification badge indicator
   - Show proof of work status on drawing cards
   - Color-coded status indicators

#### New Component: ProofOfWorkDialog

```typescript
// New component: ProofOfWorkDialog.tsx
function ProofOfWorkDialog({
  open,
  onOpenChange,
  projectId,
  drawingId,
  onSubmit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  drawingId?: string;
  onSubmit: (data: ProofOfWorkData) => void;
}) {
  // Project context
  // Work description textarea
  // Attachment upload zone
  // Hours claimed input
  // Submit/Cancel buttons
}
```

### 2.5 File Upload Handling

Follow existing file upload pattern from `DrawingSubmission.tsx`:

```typescript
// Use existing UploadZone component pattern
// Store attachments with:
// - id: generated
// - type: inferred from mime type
// - url: blob URL or uploaded file URL
// - fileSize: from file object
// - mimeType: from file object
```

---

## Feature 3: Freelancer Marketplace

### 3.1 New Type Definitions

Add to `src/types/index.ts`:

```typescript
// Task Status
export type TaskStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';

// Task Category
export type TaskCategory = 
  | 'floor_plan' 
  | 'elevation' 
  | 'section' 
  | 'site_plan' 
  | 'drainage' 
  | 'fire_layout' 
  | 'electrical' 
  | 'structural' 
  | '3d_rendering'
  | 'consultation'
  | 'other';

// Task Priority
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Application Status
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

// Task - job posting in marketplace
export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  projectId?: string;
  clientId: string;
  assignedFreelancerId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  budget: number;
  budgetType: 'fixed' | 'hourly';
  hourlyRate?: number;
  estimatedHours?: number;
  requiredSkills: string[];
  attachments?: string[];
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  tags?: string[];
  viewCount: number;
}

// Task Application - freelancer's response to a task
export interface TaskApplication {
  id: string;
  taskId: string;
  freelancerId: string;
  coverLetter: string;
  proposedRate: number;
  estimatedDuration: number;
  attachments?: string[];
  status: ApplicationStatus;
  appliedAt: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
}

// Task Milestone - for complex tasks
export interface TaskMilestone {
  id: string;
  taskId: string;
  title: string;
  description: string;
  dueDate?: Date;
  payment: number;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  completedAt?: Date;
}
```

### 3.2 New Task Store

Create `src/store/taskStore.ts`:

```typescript
import { create } from 'zustand';
import { Task, TaskApplication, TaskMilestone, TaskStatus, ApplicationStatus } from '@/types';

interface TaskState {
  tasks: Task[];
  applications: TaskApplication[];
  isLoading: boolean;
  
  // Task CRUD
  createTask: (data: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getTask: (id: string) => Task | undefined;
  
  // Task queries
  getOpenTasks: () => Task[];
  getClientTasks: (clientId: string) => Task[];
  getFreelancerTasks: (freelancerId: string) => Task[];
  getTasksByCategory: (category: string) => Task[];
  
  // Application actions
  applyToTask: (data: Partial<TaskApplication>) => Promise<TaskApplication>;
  acceptApplication: (applicationId: string) => void;
  rejectApplication: (applicationId: string, reason: string) => void;
  withdrawApplication: (applicationId: string) => void;
  getTaskApplications: (taskId: string) => TaskApplication[];
  getFreelancerApplications: (freelancerId: string) => TaskApplication[];
  
  // Task actions
  startTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  cancelTask: (taskId: string) => void;
}

// Generate mock tasks
const generateMockTasks = (): Task[] => [
  {
    id: 'task-1',
    title: 'Create Modern Villa Floor Plans',
    description: 'Need detailed floor plans for a 3-story modern residential villa including basement parking.',
    category: 'floor_plan',
    clientId: 'client-1',
    status: 'open',
    priority: 'high',
    budget: 2500,
    budgetType: 'fixed',
    requiredSkills: ['AutoCAD', 'Residential Design', 'SANS 10400'],
    deadline: new Date('2024-04-30'),
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
    viewCount: 45,
  },
  {
    id: 'task-2',
    title: 'Fire Evacuation Plan Review',
    description: 'Review and certify existing fire evacuation plan for commercial office building.',
    category: 'fire_layout',
    clientId: 'client-1',
    status: 'open',
    priority: 'medium',
    budget: 800,
    budgetType: 'hourly',
    hourlyRate: 100,
    requiredSkills: ['SANS 10400-F', 'Fire Safety', 'Evacuation Planning'],
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-05'),
    viewCount: 28,
  },
];

// Generate mock applications
const generateMockApplications = (): TaskApplication[] => [
  {
    id: 'app-1',
    taskId: 'task-1',
    freelancerId: 'freelancer-1',
    coverLetter: 'I have 8 years of experience in residential floor plan design...',
    proposedRate: 2200,
    estimatedDuration: 40,
    status: 'pending',
    appliedAt: new Date('2024-03-02'),
  },
];

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: generateMockTasks(),
  applications: generateMockApplications(),
  isLoading: false,

  createTask: async (data) => {
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: data.title!,
      description: data.description || '',
      category: data.category || 'other',
      clientId: data.clientId!,
      status: 'open',
      priority: data.priority || 'medium',
      budget: data.budget || 0,
      budgetType: data.budgetType || 'fixed',
      requiredSkills: data.requiredSkills || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
    };
    
    set(state => ({ 
      tasks: [...state.tasks, newTask],
      isLoading: false 
    }));
    
    return newTask;
  },

  updateTask: (id, updates) => {
    set(state => ({
      tasks: state.tasks.map(t => 
        t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
      ),
    }));
  },

  deleteTask: (id) => {
    set(state => ({
      tasks: state.tasks.filter(t => t.id !== id),
    }));
  },

  getTask: (id) => get().tasks.find(t => t.id === id),

  getOpenTasks: () => get().tasks.filter(t => t.status === 'open'),

  getClientTasks: (clientId) => get().tasks.filter(t => t.clientId === clientId),

  getFreelancerTasks: (freelancerId) => 
    get().tasks.filter(t => t.assignedFreelancerId === freelancerId),

  getTasksByCategory: (category) => 
    get().tasks.filter(t => t.category === category),

  applyToTask: async (data) => {
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newApplication: TaskApplication = {
      id: `app-${Date.now()}`,
      taskId: data.taskId!,
      freelancerId: data.freelancerId!,
      coverLetter: data.coverLetter || '',
      proposedRate: data.proposedRate || 0,
      estimatedDuration: data.estimatedDuration || 0,
      status: 'pending',
      appliedAt: new Date(),
    };
    
    set(state => ({ 
      applications: [...state.applications, newApplication],
      isLoading: false 
    }));
    
    return newApplication;
  },

  acceptApplication: (applicationId) => {
    const application = get().applications.find(a => a.id === applicationId);
    if (!application) return;
    
    set(state => ({
      applications: state.applications.map(a =>
        a.id === applicationId ? { ...a, status: 'accepted', reviewedAt: new Date() } : a
      ),
      tasks: state.tasks.map(t =>
        t.id === application.taskId
          ? { ...t, assignedFreelancerId: application.freelancerId, status: 'in_progress', startedAt: new Date() }
          : t
      ),
    }));
  },

  rejectApplication: (applicationId, reason) => {
    set(state => ({
      applications: state.applications.map(a =>
        a.id === applicationId 
          ? { ...a, status: 'rejected', reviewedAt: new Date(), rejectionReason: reason } 
          : a
      ),
    }));
  },

  withdrawApplication: (applicationId) => {
    set(state => ({
      applications: state.applications.map(a =>
        a.id === applicationId ? { ...a, status: 'withdrawn' } : a
      ),
    }));
  },

  getTaskApplications: (taskId) => 
    get().applications.filter(a => a.taskId === taskId),

  getFreelancerApplications: (freelancerId) => 
    get().applications.filter(a => a.freelancerId === freelancerId),

  startTask: (taskId) => {
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, status: 'in_progress', startedAt: new Date() } : t
      ),
    }));
  },

  completeTask: (taskId) => {
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, status: 'completed', completedAt: new Date() } : t
      ),
    }));
  },

  cancelTask: (taskId) => {
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, status: 'cancelled' } : t
      ),
    }));
  },
}));
```

### 3.3 Update Store Index

Add to `src/store/index.ts`:

```typescript
export { useAuthStore } from './authStore';
export { useProjectStore } from './projectStore';
export { useInvoiceStore } from './invoiceStore';
export { useNotificationStore } from './notificationStore';
export { useSettingsStore } from './settingsStore';
export { useProjectRequestStore } from './projectRequestStore';
export { useTaskStore } from './taskStore';
```

### 3.4 New Admin Component: FreelancerMarketplace

Create `src/sections/admin/FreelancerMarketplace.tsx`:

```typescript
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTaskStore } from '@/store';
import { Task, TaskCategory, TaskStatus, TaskPriority } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Briefcase,
  Search,
  Plus,
  Filter,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// Task Card Component
function TaskCard({ task, onView, onEdit }: { 
  task: Task; 
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
}) {
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'open': return <Briefcase className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {getStatusIcon(task.status)}
          <div>
            <h3 className="font-medium">{task.title}</h3>
            <p className="text-sm text-muted-foreground capitalize">{task.category.replace('_', ' ')}</p>
          </div>
        </div>
        <Badge className={`${getPriorityColor(task.priority)} text-white`}>
          {task.priority}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {task.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            {task.budgetType === 'fixed' ? `R${task.budget}` : `R${task.hourlyRate}/hr`}
          </span>
          {task.deadline && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onView(task)}>
            View
          </Button>
          <Button size="sm" onClick={() => onEdit(task)}>
            Edit
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function FreelancerMarketplace() {
  const { tasks, applications, updateTask, deleteTask } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Calculate stats
  const stats = useMemo(() => ({
    totalTasks: tasks.length,
    openTasks: tasks.filter(t => t.status === 'open').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
  }), [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tasks, searchQuery, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Freelancer Marketplace</h1>
        <p className="text-muted-foreground mt-1">
          Manage tasks and connect freelancers with opportunities.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-3xl font-bold">{stats.totalTasks}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-3xl font-bold">{stats.openTasks}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold">{stats.inProgressTasks}</p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold">{stats.completedTasks}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>All Tasks</CardTitle>
              <CardDescription>View and manage marketplace tasks</CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[200px]"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                {/* Category filter select */}
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                {/* Status filter select */}
              </Select>
              
              <Button className="gap-2" onClick={() => setIsNewTaskOpen(true)}>
                <Plus className="w-4 h-4" />
                New Task
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  onView={(task) => setSelectedTask(task)}
                  onEdit={(task) => setEditingTask(task)}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3.5 Enhancements to MyWork.tsx

Add new tab for marketplace tasks in `src/sections/freelancer/MyWork.tsx`:

```typescript
// Add new tab content
<TabsContent value="marketplace" className="space-y-4">
  <div className="flex justify-between items-center">
    <h2 className="text-lg font-semibold">Browse Tasks</h2>
    <Button className="gap-2">
      <Search className="w-4 h-4" />
      Search Tasks
    </Button>
  </div>

  <ScrollArea className="h-[500px]">
    <div className="space-y-4">
      {openTasks.map((task) => (
        <MarketplaceTaskCard 
          key={task.id} 
          task={task}
          onApply={() => handleApplyToTask(task.id)}
        />
      ))}
    </div>
  </ScrollArea>
</TabsContent>
```

### 3.6 Admin Task Posting UI Design

Create `src/sections/admin/TaskPostingDialog.tsx`:

```typescript
function TaskPostingDialog({ open, onOpenChange, onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('floor_plan');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [budget, setBudget] = useState(0);
  const [budgetType, setBudgetType] = useState<'fixed' | 'hourly'>('fixed');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [deadline, setDeadline] = useState<Date | undefined>();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Post New Task</DialogTitle>
          <DialogDescription>
            Create a new task for freelancers to apply
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Task Title</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task in detail"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
                {/* Category options */}
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                {/* Priority options */}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Budget</Label>
              <Input 
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Budget Type</Label>
              <Select value={budgetType} onValueChange={(v) => setBudgetType(v as 'fixed' | 'hourly')}>
                <SelectItem value="fixed">Fixed Price</SelectItem>
                <SelectItem value="hourly">Hourly Rate</SelectItem>
              </Select>
            </div>
          </div>

          <div>
            <Label>Required Skills</Label>
            <Input 
              value={requiredSkills.join(', ')}
              onChange={(e) => setRequiredSkills(e.target.value.split(', '))}
              placeholder="Enter skills separated by commas"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit({ /* data */ })}>
            Post Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Implementation Order and Dependencies

### Recommended Implementation Sequence

```
Phase 1: Foundation (Types + Core Store)
├── 1.1 Add Hour Allocation types to src/types/index.ts
├── 1.2 Add Proof of Work types to src/types/index.ts  
├── 1.3 Add Task/Application types to src/types/index.ts
└── 1.4 Create taskStore.ts with full CRUD

Phase 2: Hour Allocation Feature
├── 2.1 Update invoiceStore with allocation actions
├── 2.2 Add mock allocation/transaction data
├── 2.3 Create HourAllocationDialog component
└── 2.4 Update ProjectOversight.tsx with allocation UI

Phase 3: Proof of Work Feature
├── 3.1 Update projectStore with proof actions
├── 3.2 Create ProofOfWorkDialog component
├── 3.3 Update DrawingSubmission.tsx with proof UI
└── 3.4 Add verification badges to Drawing type

Phase 4: Freelancer Marketplace
├── 4.1 Create FreelancerMarketplace.tsx (admin)
├── 4.2 Create TaskPostingDialog.tsx
├── 4.3 Update MyWork.tsx with marketplace tab
└── 4.4 Add new task tab to FreelancerDashboard

Phase 5: Integration
├── 5.1 Update store/index.ts exports
├── 5.2 Add routing for new sections
└── 5.3 Update sidebar navigation
```

### Dependency Analysis

| Feature | Dependencies | Can Build In Parallel |
|---------|--------------|----------------------|
| Hour Allocation | Types (Phase 1) | Proof of Work, Marketplace |
| Proof of Work | Types (Phase 1) | Hour Allocation, Marketplace |
| Freelancer Marketplace | taskStore (Phase 1) | Hour Allocation, Proof of Work |

### Critical Path

1. **Types must be defined first** - All features depend on type definitions
2. **taskStore must exist before Marketplace UI** - Marketplace depends on taskStore
3. **invoiceStore update before Hour Allocation UI** - Allocation UI needs store actions
4. **projectStore update before Proof of Work UI** - Proof UI needs store actions

---

## File Changes Summary

### Files to Modify

| File | Changes |
|------|---------|
| `src/types/index.ts` | Add HourAllocation, HourTransaction, ProofOfWork, ProofAttachment, Task, TaskApplication, TaskMilestone types; extend Drawing and HourPackage |
| `src/store/index.ts` | Add export for useTaskStore |
| `src/store/invoiceStore.ts` | Add allocations array, transactions array, allocation/usage actions |
| `src/store/projectStore.ts` | Add proofsOfWork array, proof submission/verification actions |
| `src/sections/admin/ProjectOversight.tsx` | Add hour allocation panel and stats |

### Files to Create

| File | Description |
|------|-------------|
| `src/store/taskStore.ts` | New task store with full CRUD for marketplace |
| `src/sections/admin/FreelancerMarketplace.tsx` | Admin marketplace management UI |
| `src/sections/admin/TaskPostingDialog.tsx` | New task creation dialog |
| `src/sections/freelancer/ProofOfWorkDialog.tsx` | Proof submission dialog |
| `src/sections/freelancer/HourAllocationDialog.tsx` | Hour allocation dialog |

### Optional Component Files

| File | Description |
|------|-------------|
| `src/components/marketplace/TaskCard.tsx` | Reusable task card component |
| `src/components/marketplace/ApplicationCard.tsx` | Application display component |
| `src/components/proof/AttachmentList.tsx` | Proof attachment list component |
| `src/components/hours/AllocationList.tsx` | Hour allocation list component |

---

## Implementation Notes

### Testing Strategy
- Unit tests for store actions
- Component tests for new UI elements
- Integration tests for cross-feature workflows

### Performance Considerations
- Use `useMemo` for filtered task lists (already in plan)
- Implement pagination for large task lists
- Lazy load marketplace components

### Future Enhancements
- Real-time notifications for new applications
- Payment integration for marketplace tasks
- Freelancer ratings and reviews
- Task matching algorithm
