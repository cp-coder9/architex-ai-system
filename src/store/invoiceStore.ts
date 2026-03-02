import { create } from 'zustand';
import { Invoice, HourPackage, TimeEntry, HourAllocation, HourTransaction } from '@/types';

interface InvoiceState {
  invoices: Invoice[];
  hourPackages: HourPackage[];
  hourAllocations: HourAllocation[];
  hourTransactions: HourTransaction[];
  isLoading: boolean;
  
  // Actions
  createInvoice: (data: Partial<Invoice>) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  markInvoiceAsPaid: (id: string) => void;
  markInvoiceAsSent: (id: string) => void;
  purchaseHours: (clientId: string, hours: number, pricePerHour: number) => Promise<HourPackage>;
  createAllocation: (data: Partial<HourAllocation>) => HourAllocation;
  useHours: (allocationId: string, hours: number, description: string, freelancerId: string, projectId: string, taskId?: string) => boolean;
  getClientPackages: (clientId: string) => HourPackage[];
  getClientInvoices: (clientId: string) => Invoice[];
  getFreelancerInvoices: (freelancerId: string) => Invoice[];
  getAllocationsByClientId: (clientId: string) => HourAllocation[];
  getAllocationsByProjectId: (projectId: string) => HourAllocation[];
  getTransactionsByAllocationId: (allocationId: string) => HourTransaction[];
  getAvailableHours: (clientId: string) => number;
  generateInvoiceFromTimeEntries: (timeEntries: TimeEntry[], data: Partial<Invoice>) => Promise<Invoice>;
}

// Generate mock invoices
const generateMockInvoices = (): Invoice[] => [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2024-001',
    clientId: 'client-1',
    projectId: 'proj-1',
    freelancerId: 'freelancer-1',
    timeEntries: ['te-1', 'te-2'],
    hoursTotal: 12,
    hourlyRate: 75,
    subtotal: 900,
    taxRate: 0.10,
    taxAmount: 90,
    total: 990,
    status: 'paid',
    createdAt: new Date('2024-02-20'),
    sentAt: new Date('2024-02-21'),
    paidAt: new Date('2024-02-25'),
    dueDate: new Date('2024-03-20'),
    notes: 'Payment for ground floor plan work',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2024-002',
    clientId: 'client-1',
    projectId: 'proj-1',
    freelancerId: 'freelancer-1',
    timeEntries: ['te-3'],
    hoursTotal: 6,
    hourlyRate: 75,
    subtotal: 450,
    taxRate: 0.10,
    taxAmount: 45,
    total: 495,
    status: 'sent',
    createdAt: new Date('2024-02-26'),
    sentAt: new Date('2024-02-27'),
    dueDate: new Date('2024-03-26'),
    notes: 'First floor plan creation',
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2024-003',
    clientId: 'client-1',
    projectId: 'proj-2',
    freelancerId: 'freelancer-1',
    timeEntries: ['te-5'],
    hoursTotal: 12,
    hourlyRate: 75,
    subtotal: 900,
    taxRate: 0.10,
    taxAmount: 90,
    total: 990,
    status: 'draft',
    createdAt: new Date('2024-03-06'),
    dueDate: new Date('2024-04-05'),
    notes: 'Site analysis and planning',
  },
];

// Generate mock hour packages
const generateMockHourPackages = (): HourPackage[] => [
  {
    id: 'pkg-1',
    clientId: 'client-1',
    hours: 100,
    pricePerHour: 70,
    totalPrice: 7000,
    hoursUsed: 65,
    hoursRemaining: 35,
    purchasedAt: new Date('2024-01-15'),
    expiresAt: new Date('2024-07-15'),
    status: 'active',
    paymentStatus: 'completed',
  },
  {
    id: 'pkg-2',
    clientId: 'client-1',
    hours: 200,
    pricePerHour: 65,
    totalPrice: 13000,
    hoursUsed: 80,
    hoursRemaining: 120,
    purchasedAt: new Date('2024-02-01'),
    expiresAt: new Date('2024-08-01'),
    status: 'active',
    paymentStatus: 'completed',
  },
];

// Generate mock hour allocations
const generateMockHourAllocations = (): HourAllocation[] => [
  {
    id: 'alloc-1',
    clientId: 'client-1',
    projectId: 'proj-1',
    hourPackageId: 'pkg-1',
    allocatedHours: 50,
    usedHours: 30,
    remainingHours: 20,
    allocatedAt: '2024-01-20T10:00:00Z',
    expiresAt: '2024-07-20T10:00:00Z',
    status: 'active',
  },
  {
    id: 'alloc-2',
    clientId: 'client-1',
    projectId: 'proj-2',
    hourPackageId: 'pkg-2',
    allocatedHours: 80,
    usedHours: 45,
    remainingHours: 35,
    allocatedAt: '2024-02-15T14:30:00Z',
    expiresAt: '2024-08-15T14:30:00Z',
    status: 'active',
  },
  {
    id: 'alloc-3',
    clientId: 'client-1',
    projectId: 'proj-3',
    hourPackageId: 'pkg-1',
    allocatedHours: 15,
    usedHours: 15,
    remainingHours: 0,
    allocatedAt: '2024-02-01T09:00:00Z',
    expiresAt: '2024-06-01T09:00:00Z',
    status: 'exhausted',
  },
];

// Generate mock hour transactions
const generateMockHourTransactions = (): HourTransaction[] => [
  {
    id: 'txn-1',
    allocationId: 'alloc-1',
    projectId: 'proj-1',
    freelancerId: 'freelancer-1',
    hours: 8,
    description: 'Ground floor plan initial drafting',
    createdAt: '2024-01-22T10:00:00Z',
    status: 'approved',
  },
  {
    id: 'txn-2',
    allocationId: 'alloc-1',
    projectId: 'proj-1',
    freelancerId: 'freelancer-1',
    hours: 6,
    description: 'Ground floor plan revisions',
    createdAt: '2024-01-25T14:00:00Z',
    status: 'approved',
  },
  {
    id: 'txn-3',
    allocationId: 'alloc-1',
    projectId: 'proj-1',
    freelancerId: 'freelancer-1',
    hours: 10,
    description: 'Floor plan compliance checking',
    createdAt: '2024-01-28T09:30:00Z',
    status: 'approved',
  },
  {
    id: 'txn-4',
    allocationId: 'alloc-1',
    projectId: 'proj-1',
    freelancerId: 'freelancer-1',
    hours: 6,
    description: 'First floor plan drafting',
    createdAt: '2024-02-05T11:00:00Z',
    status: 'approved',
  },
  {
    id: 'txn-5',
    allocationId: 'alloc-2',
    projectId: 'proj-2',
    freelancerId: 'freelancer-1',
    hours: 12,
    description: 'Site analysis and layout planning',
    createdAt: '2024-02-18T08:00:00Z',
    status: 'approved',
  },
  {
    id: 'txn-6',
    allocationId: 'alloc-2',
    projectId: 'proj-2',
    freelancerId: 'freelancer-1',
    hours: 8,
    description: 'Elevation drawings preparation',
    createdAt: '2024-02-22T13:00:00Z',
    status: 'approved',
  },
  {
    id: 'txn-7',
    allocationId: 'alloc-2',
    projectId: 'proj-2',
    freelancerId: 'freelancer-1',
    hours: 15,
    description: 'Structural elements planning',
    createdAt: '2024-02-28T10:00:00Z',
    status: 'approved',
  },
  {
    id: 'txn-8',
    allocationId: 'alloc-2',
    projectId: 'proj-2',
    freelancerId: 'freelancer-1',
    hours: 10,
    description: 'Municipal submission documents',
    createdAt: '2024-03-05T15:00:00Z',
    status: 'pending',
  },
  {
    id: 'txn-9',
    allocationId: 'alloc-3',
    projectId: 'proj-3',
    freelancerId: 'freelancer-1',
    hours: 15,
    description: 'Landscape design work',
    createdAt: '2024-02-05T09:00:00Z',
    status: 'approved',
  },
];

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: generateMockInvoices(),
  hourPackages: generateMockHourPackages(),
  hourAllocations: generateMockHourAllocations(),
  hourTransactions: generateMockHourTransactions(),
  isLoading: false,

  createInvoice: async (data) => {
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(get().invoices.length + 1).padStart(3, '0')}`;
    
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      clientId: data.clientId!,
      projectId: data.projectId!,
      freelancerId: data.freelancerId!,
      timeEntries: data.timeEntries || [],
      hoursTotal: data.hoursTotal || 0,
      hourlyRate: data.hourlyRate || 75,
      subtotal: data.subtotal || 0,
      taxRate: data.taxRate || 0.10,
      taxAmount: data.taxAmount || 0,
      total: data.total || 0,
      status: 'draft',
      createdAt: new Date(),
      dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: data.notes,
    };
    
    set(state => ({ 
      invoices: [...state.invoices, newInvoice],
      isLoading: false 
    }));
    
    return newInvoice;
  },

  updateInvoice: (id, updates) => {
    set(state => ({
      invoices: state.invoices.map(inv => 
        inv.id === id ? { ...inv, ...updates } : inv
      ),
    }));
  },

  deleteInvoice: (id) => {
    set(state => ({
      invoices: state.invoices.filter(inv => inv.id !== id),
    }));
  },

  markInvoiceAsPaid: (id) => {
    set(state => ({
      invoices: state.invoices.map(inv => 
        inv.id === id 
          ? { ...inv, status: 'paid', paidAt: new Date() }
          : inv
      ),
    }));
  },

  markInvoiceAsSent: (id) => {
    set(state => ({
      invoices: state.invoices.map(inv => 
        inv.id === id 
          ? { ...inv, status: 'sent', sentAt: new Date() }
          : inv
      ),
    }));
  },

  purchaseHours: async (clientId, hours, pricePerHour) => {
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newPackage: HourPackage = {
      id: `pkg-${Date.now()}`,
      clientId,
      hours,
      pricePerHour,
      totalPrice: hours * pricePerHour,
      hoursUsed: 0,
      hoursRemaining: hours,
      purchasedAt: new Date(),
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
      status: 'active',
      paymentStatus: 'completed',
    };
    
    set(state => ({ 
      hourPackages: [...state.hourPackages, newPackage],
      isLoading: false 
    }));
    
    return newPackage;
  },

  createAllocation: (data) => {
    const pkg = get().hourPackages.find(p => p.id === data.hourPackageId);
    if (!pkg || pkg.hoursRemaining < (data.allocatedHours || 0)) {
      throw new Error('Insufficient hours in package');
    }
    
    const expiresAt = data.expiresAt || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
    const newAllocation: HourAllocation = {
      id: `alloc-${Date.now()}`,
      clientId: data.clientId!,
      projectId: data.projectId!,
      hourPackageId: data.hourPackageId!,
      allocatedHours: data.allocatedHours || 0,
      usedHours: 0,
      remainingHours: data.allocatedHours || 0,
      allocatedAt: data.allocatedAt || new Date().toISOString(),
      expiresAt,
      status: 'active',
    };
    
    // Update the hour package
    set(state => ({
      hourPackages: state.hourPackages.map(p => 
        p.id === data.hourPackageId 
          ? { 
              ...p, 
              hoursUsed: p.hoursUsed + (data.allocatedHours || 0),
              hoursRemaining: p.hoursRemaining - (data.allocatedHours || 0),
              status: p.hoursRemaining - (data.allocatedHours || 0) <= 0 ? 'depleted' : 'active'
            }
          : p
      ),
      hourAllocations: [...state.hourAllocations, newAllocation],
    }));
    
    return newAllocation;
  },

  useHours: (allocationId, hours, description, freelancerId, projectId, taskId) => {
    const allocation = get().hourAllocations.find(a => a.id === allocationId);
    if (!allocation || allocation.remainingHours < hours) {
      return false;
    }
    
    const newTransaction: HourTransaction = {
      id: `txn-${Date.now()}`,
      allocationId,
      projectId,
      taskId,
      freelancerId,
      hours,
      description,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    
    set(state => ({
      hourAllocations: state.hourAllocations.map(a => 
        a.id === allocationId 
          ? { 
              ...a, 
              usedHours: a.usedHours + hours,
              remainingHours: a.remainingHours - hours,
              status: a.remainingHours - hours <= 0 ? 'exhausted' : 'active'
            }
          : a
      ),
      hourTransactions: [...state.hourTransactions, newTransaction],
    }));
    
    return true;
  },

  getClientPackages: (clientId) => {
    return get().hourPackages.filter(pkg => pkg.clientId === clientId);
  },

  getAllocationsByClientId: (clientId) => {
    return get().hourAllocations.filter(alloc => alloc.clientId === clientId);
  },

  getAllocationsByProjectId: (projectId) => {
    return get().hourAllocations.filter(alloc => alloc.projectId === projectId);
  },

  getTransactionsByAllocationId: (allocationId) => {
    return get().hourTransactions.filter(txn => txn.allocationId === allocationId);
  },

  getAvailableHours: (clientId) => {
    const packages = get().hourPackages.filter(pkg => pkg.clientId === clientId);
    return packages.reduce((total, pkg) => total + pkg.hoursRemaining, 0);
  },

  getClientInvoices: (clientId) => {
    return get().invoices.filter(inv => inv.clientId === clientId);
  },

  getFreelancerInvoices: (freelancerId) => {
    return get().invoices.filter(inv => inv.freelancerId === freelancerId);
  },

  generateInvoiceFromTimeEntries: async (timeEntries, data) => {
    const hoursTotal = timeEntries.reduce((sum, te) => sum + te.hours, 0);
    const hourlyRate = data.hourlyRate || 75;
    const subtotal = hoursTotal * hourlyRate;
    const taxRate = data.taxRate || 0.10;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    
    const invoice = await get().createInvoice({
      ...data,
      timeEntries: timeEntries.map(te => te.id),
      hoursTotal,
      hourlyRate,
      subtotal,
      taxRate,
      taxAmount,
      total,
    });
    
    return invoice;
  },
}));
