import { create } from 'zustand';
import { Invoice, HourPackage, TimeEntry, HourAllocation, HourTransaction } from '@/types';
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

interface InvoiceState {
  invoices: Invoice[];
  hourPackages: HourPackage[];
  hourAllocations: HourAllocation[];
  hourTransactions: HourTransaction[];
  isLoading: boolean;
  error: string | null;
  unsubscribeInvoices: Unsubscribe | null;
  unsubscribeHourPackages: Unsubscribe | null;
  unsubscribeHourAllocations: Unsubscribe | null;
  unsubscribeHourTransactions: Unsubscribe | null;

  // Initialization
  initialize: (userId: string, role: string) => void;
  cleanup: () => void;

  // Actions
  createInvoice: (data: Partial<Invoice>) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  markInvoiceAsPaid: (id: string) => Promise<void>;
  markInvoiceAsSent: (id: string) => Promise<void>;
  purchaseHours: (clientId: string, hours: number, pricePerHour: number) => Promise<HourPackage>;
  createAllocation: (data: Partial<HourAllocation>) => Promise<HourAllocation>;
  useHours: (allocationId: string, hours: number, description: string, freelancerId: string, projectId: string, taskId?: string) => Promise<boolean>;
  getClientPackages: (clientId: string) => HourPackage[];
  getClientInvoices: (clientId: string) => Invoice[];
  getFreelancerInvoices: (freelancerId: string) => Invoice[];
  getAllocationsByClientId: (clientId: string) => HourAllocation[];
  getAllocationsByProjectId: (projectId: string) => HourAllocation[];
  getTransactionsByAllocationId: (allocationId: string) => HourTransaction[];
  getAvailableHours: (clientId: string) => number;
  generateInvoiceFromTimeEntries: (timeEntries: TimeEntry[], data: Partial<Invoice>) => Promise<Invoice>;
}

// Collection names
const INVOICES_COLLECTION = 'invoices';
const HOUR_PACKAGES_COLLECTION = 'hourPackages';
const HOUR_ALLOCATIONS_COLLECTION = 'hourAllocations';
const HOUR_TRANSACTIONS_COLLECTION = 'hourTransactions';

// Helper to convert Firestore timestamps to dates
function convertTimestamps(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  const dateFields = ['createdAt', 'dueDate', 'sentAt', 'paidAt', 'purchasedAt', 'expiresAt', 'allocatedAt'];

  for (const field of dateFields) {
    if (result[field] instanceof Timestamp) {
      result[field] = result[field].toDate();
    }
  }
  return result;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  hourPackages: [],
  hourAllocations: [],
  hourTransactions: [],
  isLoading: false,
  error: null,
  unsubscribeInvoices: null,
  unsubscribeHourPackages: null,
  unsubscribeHourAllocations: null,
  unsubscribeHourTransactions: null,

  initialize: (userId: string, role: string) => {
    if (!isFirebaseConfigured() || !db) {
      console.warn('[InvoiceStore] Firebase not configured, using empty arrays');
      return;
    }

    set({ isLoading: true, error: null });

    // Build Invoices Query
    let invoicesQuery;
    if (role === 'admin') {
      invoicesQuery = query(collection(db, INVOICES_COLLECTION), orderBy('createdAt', 'desc'));
    } else if (role === 'client') {
      invoicesQuery = query(collection(db, INVOICES_COLLECTION), where('clientId', '==', userId), orderBy('createdAt', 'desc'));
    } else {
      invoicesQuery = query(collection(db, INVOICES_COLLECTION), where('freelancerId', '==', userId), orderBy('createdAt', 'desc'));
    }

    const unsubscribeInvoices = onSnapshot(
      invoicesQuery,
      (snapshot) => {
        const invoices = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestamps(doc.data()),
        })) as Invoice[];
        set({ invoices, isLoading: false });
      },
      (error) => {
        console.error('[InvoiceStore] Error fetching invoices:', error);
        set({ error: 'Failed to fetch invoices', isLoading: false });
      }
    );

    // Build Hour Packages Query
    let hourPackagesQuery;
    if (role === 'admin') {
      hourPackagesQuery = query(collection(db, HOUR_PACKAGES_COLLECTION), orderBy('purchasedAt', 'desc'));
    } else if (role === 'client') {
      hourPackagesQuery = query(collection(db, HOUR_PACKAGES_COLLECTION), where('clientId', '==', userId), orderBy('purchasedAt', 'desc'));
    } else {
      // Freelancers don't typically see packages?
      hourPackagesQuery = query(collection(db, HOUR_PACKAGES_COLLECTION), orderBy('purchasedAt', 'desc'));
    }

    const unsubscribeHourPackages = onSnapshot(
      hourPackagesQuery,
      (snapshot) => {
        const hourPackages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestamps(doc.data()),
        })) as HourPackage[];
        set({ hourPackages });
      },
      (error) => {
        console.error('[InvoiceStore] Error fetching hour packages:', error);
      }
    );

    // Build Hour Allocations Query
    let hourAllocationsQuery;
    if (role === 'admin') {
      hourAllocationsQuery = query(collection(db, HOUR_ALLOCATIONS_COLLECTION), orderBy('allocatedAt', 'desc'));
    } else if (role === 'client') {
      hourAllocationsQuery = query(collection(db, HOUR_ALLOCATIONS_COLLECTION), where('clientId', '==', userId), orderBy('allocatedAt', 'desc'));
    } else {
      hourAllocationsQuery = query(collection(db, HOUR_ALLOCATIONS_COLLECTION), orderBy('allocatedAt', 'desc'));
    }

    const unsubscribeHourAllocations = onSnapshot(
      hourAllocationsQuery,
      (snapshot) => {
        const hourAllocations = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestamps(doc.data()),
        })) as HourAllocation[];
        set({ hourAllocations });
      },
      (error) => {
        console.error('[InvoiceStore] Error fetching hour allocations:', error);
      }
    );

    // Build Hour Transactions Query
    let hourTransactionsQuery;
    if (role === 'admin') {
      hourTransactionsQuery = query(collection(db, HOUR_TRANSACTIONS_COLLECTION), orderBy('createdAt', 'desc'));
    } else {
      // For now, non-admins see all? (Probably needs tighter filtering)
      hourTransactionsQuery = query(collection(db, HOUR_TRANSACTIONS_COLLECTION), orderBy('createdAt', 'desc'));
    }

    const unsubscribeHourTransactions = onSnapshot(
      hourTransactionsQuery,
      (snapshot) => {
        const hourTransactions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestamps(doc.data()),
        })) as HourTransaction[];
        set({ hourTransactions });
      },
      (error) => {
        console.error('[InvoiceStore] Error fetching hour transactions:', error);
      }
    );

    set({
      unsubscribeInvoices,
      unsubscribeHourPackages,
      unsubscribeHourAllocations,
      unsubscribeHourTransactions,
    });
  },

  cleanup: () => {
    const state = get();
    if (state.unsubscribeInvoices) state.unsubscribeInvoices();
    if (state.unsubscribeHourPackages) state.unsubscribeHourPackages();
    if (state.unsubscribeHourAllocations) state.unsubscribeHourAllocations();
    if (state.unsubscribeHourTransactions) state.unsubscribeHourTransactions();
    set({
      unsubscribeInvoices: null,
      unsubscribeHourPackages: null,
      unsubscribeHourAllocations: null,
      unsubscribeHourTransactions: null,
    });
  },

  createInvoice: async (data) => {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase not configured');
    }

    set({ isLoading: true });

    try {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(get().invoices.length + 1).padStart(3, '0')}`;

      const newInvoice = {
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
        status: 'draft' as const,
        createdAt: serverTimestamp(),
        dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: data.notes,
      };

      const docRef = await addDoc(collection(db, INVOICES_COLLECTION), newInvoice);

      const createdInvoice: Invoice = {
        id: docRef.id,
        ...newInvoice,
        createdAt: new Date(),
        status: 'draft',
      } as Invoice;

      set({ isLoading: false });
      return createdInvoice;
    } catch (error) {
      console.error('[InvoiceStore] Error creating invoice:', error);
      set({ error: 'Failed to create invoice', isLoading: false });
      throw error;
    }
  },

  updateInvoice: async (id, updates) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const invoiceRef = doc(db, INVOICES_COLLECTION, id);
      await updateDoc(invoiceRef, updates);
    } catch (error) {
      console.error('[InvoiceStore] Error updating invoice:', error);
      set({ error: 'Failed to update invoice' });
      throw error;
    }
  },

  deleteInvoice: async (id) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      await deleteDoc(doc(db, INVOICES_COLLECTION, id));
    } catch (error) {
      console.error('[InvoiceStore] Error deleting invoice:', error);
      set({ error: 'Failed to delete invoice' });
      throw error;
    }
  },

  markInvoiceAsPaid: async (id) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const invoiceRef = doc(db, INVOICES_COLLECTION, id);
      await updateDoc(invoiceRef, {
        status: 'paid',
        paidAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[InvoiceStore] Error marking invoice as paid:', error);
      set({ error: 'Failed to mark invoice as paid' });
      throw error;
    }
  },

  markInvoiceAsSent: async (id) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const invoiceRef = doc(db, INVOICES_COLLECTION, id);
      await updateDoc(invoiceRef, {
        status: 'sent',
        sentAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[InvoiceStore] Error marking invoice as sent:', error);
      set({ error: 'Failed to mark invoice as sent' });
      throw error;
    }
  },

  purchaseHours: async (clientId, hours, pricePerHour) => {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase not configured');
    }

    set({ isLoading: true });

    try {
      const newPackage = {
        clientId,
        hours,
        pricePerHour,
        totalPrice: hours * pricePerHour,
        hoursUsed: 0,
        hoursRemaining: hours,
        purchasedAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
        status: 'active' as const,
        paymentStatus: 'completed' as const,
      };

      const docRef = await addDoc(collection(db, HOUR_PACKAGES_COLLECTION), newPackage);

      const createdPackage: HourPackage = {
        id: docRef.id,
        ...newPackage,
        purchasedAt: new Date(),
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      } as HourPackage;

      set({ isLoading: false });
      return createdPackage;
    } catch (error) {
      console.error('[InvoiceStore] Error purchasing hours:', error);
      set({ error: 'Failed to purchase hours', isLoading: false });
      throw error;
    }
  },

  createAllocation: async (data) => {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase not configured');
    }

    const pkg = get().hourPackages.find(p => p.id === data.hourPackageId);
    if (!pkg || pkg.hoursRemaining < (data.allocatedHours || 0)) {
      throw new Error('Insufficient hours in package');
    }

    try {
      const newAllocation = {
        clientId: data.clientId!,
        projectId: data.projectId!,
        hourPackageId: data.hourPackageId!,
        allocatedHours: data.allocatedHours || 0,
        usedHours: 0,
        remainingHours: data.allocatedHours || 0,
        allocatedAt: serverTimestamp(),
        expiresAt: data.expiresAt || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active' as const,
      };

      const docRef = await addDoc(collection(db, HOUR_ALLOCATIONS_COLLECTION), newAllocation);

      // Update the hour package
      const pkgRef = doc(db, HOUR_PACKAGES_COLLECTION, data.hourPackageId!);
      await updateDoc(pkgRef, {
        hoursUsed: pkg.hoursUsed + (data.allocatedHours || 0),
        hoursRemaining: pkg.hoursRemaining - (data.allocatedHours || 0),
        status: pkg.hoursRemaining - (data.allocatedHours || 0) <= 0 ? 'depleted' : 'active',
      });

      const createdAllocation: HourAllocation = {
        id: docRef.id,
        ...newAllocation,
        allocatedAt: new Date().toISOString(),
      } as HourAllocation;

      return createdAllocation;
    } catch (error) {
      console.error('[InvoiceStore] Error creating allocation:', error);
      set({ error: 'Failed to create allocation' });
      throw error;
    }
  },

  useHours: async (allocationId, hours, description, freelancerId, projectId, taskId) => {
    if (!isFirebaseConfigured() || !db) {
      return false;
    }

    const allocation = get().hourAllocations.find(a => a.id === allocationId);
    if (!allocation || allocation.remainingHours < hours) {
      return false;
    }

    try {
      const newTransaction = {
        allocationId,
        projectId,
        taskId,
        freelancerId,
        hours,
        description,
        createdAt: serverTimestamp(),
        status: 'pending' as const,
      };

      await addDoc(collection(db, HOUR_TRANSACTIONS_COLLECTION), newTransaction);

      // Update allocation
      const allocRef = doc(db, HOUR_ALLOCATIONS_COLLECTION, allocationId);
      await updateDoc(allocRef, {
        usedHours: allocation.usedHours + hours,
        remainingHours: allocation.remainingHours - hours,
        status: allocation.remainingHours - hours <= 0 ? 'exhausted' : 'active',
      });

      return true;
    } catch (error) {
      console.error('[InvoiceStore] Error using hours:', error);
      set({ error: 'Failed to use hours' });
      return false;
    }
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
