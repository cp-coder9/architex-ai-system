/**
 * Hour Tracking Service
 *
 * Handles CRUD operations for hour packages, hour allocations, and hour transactions.
 *
 * Collections:
 * - hourPackages: Purchased hour packages by clients
 * - hourAllocations: Hour allocations to projects
 * - hourTransactions: Individual hour usage transactions
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  _deleteDoc,
  collection,
  query,
  where,
  orderBy,
  _limit,
  getDocs,
  _addDoc,
  _Timestamp,
  _serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { HourPackage, HourAllocation, HourTransaction } from '@/types';

const HOUR_PACKAGES_COLLECTION = 'hourPackages';
const HOUR_ALLOCATIONS_COLLECTION = 'hourAllocations';
const HOUR_TRANSACTIONS_COLLECTION = 'hourTransactions';

// ==================== Hour Packages ====================

/**
 * Create a new hour package
 */
export async function createHourPackage(
  hourPackage: Omit<HourPackage, 'id' | 'hoursUsed' | 'hoursRemaining' | 'status'>
): Promise<HourPackage> {
  try {
    const pkgRef = doc(collection(db!, HOUR_PACKAGES_COLLECTION));

    const newPackage: HourPackage = {
      ...hourPackage,
      id: pkgRef.id,
      hoursUsed: 0,
      hoursRemaining: hourPackage.hours,
      status: 'active',
    };

    await setDoc(pkgRef, newPackage);

    return newPackage;
  } catch (error) {
    console.error('[HourTrackingService] Error creating hour package:', error);
    throw new Error('Failed to create hour package');
  }
}

/**
 * Get hour package by ID
 */
export async function getHourPackageById(packageId: string): Promise<HourPackage | null> {
  try {
    const pkgRef = doc(db!, HOUR_PACKAGES_COLLECTION, packageId);
    const pkgSnap = await getDoc(pkgRef);

    if (pkgSnap.exists()) {
      return { id: pkgSnap.id, ...pkgSnap.data() } as HourPackage;
    }

    return null;
  } catch (error) {
    console.error('[HourTrackingService] Error fetching hour package:', error);
    throw new Error('Failed to fetch hour package');
  }
}

/**
 * Get hour packages by client
 */
export async function getHourPackagesByClient(clientId: string): Promise<HourPackage[]> {
  try {
    const pkgsRef = collection(db!, HOUR_PACKAGES_COLLECTION);
    const q = query(
      pkgsRef,
      where('clientId', '==', clientId),
      orderBy('purchasedAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as HourPackage);
  } catch (error) {
    console.error('[HourTrackingService] Error fetching client hour packages:', error);
    throw new Error('Failed to fetch hour packages');
  }
}

/**
 * Get active hour packages for a client
 */
export async function getActiveHourPackages(clientId: string): Promise<HourPackage[]> {
  try {
    const pkgsRef = collection(db!, HOUR_PACKAGES_COLLECTION);
    const q = query(
      pkgsRef,
      where('clientId', '==', clientId),
      where('status', '==', 'active'),
      orderBy('purchasedAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as HourPackage);
  } catch (error) {
    console.error('[HourTrackingService] Error fetching active hour packages:', error);
    throw new Error('Failed to fetch active hour packages');
  }
}

/**
 * Update hour package status
 */
export async function updateHourPackageStatus(
  packageId: string,
  status: HourPackage['status']
): Promise<void> {
  try {
    const pkgRef = doc(db!, HOUR_PACKAGES_COLLECTION, packageId);
    await updateDoc(pkgRef, { status });
  } catch (error) {
    console.error('[HourTrackingService] Error updating hour package status:', error);
    throw new Error('Failed to update hour package status');
  }
}

/**
 * Update hour package payment status
 */
export async function updateHourPackagePaymentStatus(
  packageId: string,
  paymentStatus: HourPackage['paymentStatus']
): Promise<void> {
  try {
    const pkgRef = doc(db!, HOUR_PACKAGES_COLLECTION, packageId);
    await updateDoc(pkgRef, { paymentStatus });
  } catch (error) {
    console.error('[HourTrackingService] Error updating hour package payment status:', error);
    throw new Error('Failed to update hour package payment status');
  }
}

// ==================== Hour Allocations ====================

/**
 * Create an hour allocation to a project
 */
export async function createHourAllocation(
  allocation: Omit<HourAllocation, 'id' | 'usedHours' | 'remainingHours' | 'status'>
): Promise<HourAllocation> {
  try {
    const allocRef = doc(collection(db!, HOUR_ALLOCATIONS_COLLECTION));

    const newAllocation: HourAllocation = {
      ...allocation,
      id: allocRef.id,
      usedHours: 0,
      remainingHours: allocation.allocatedHours,
      status: 'active',
    };

    await setDoc(allocRef, newAllocation);

    // Update hour package hours remaining
    const pkgRef = doc(db!, HOUR_PACKAGES_COLLECTION, allocation.hourPackageId);
    const pkgSnap = await getDoc(pkgRef);
    if (pkgSnap.exists()) {
      const pkgData = pkgSnap.data() as HourPackage;
      await updateDoc(pkgRef, {
        hoursRemaining: pkgData.hoursRemaining - allocation.allocatedHours,
      });
    }

    return newAllocation;
  } catch (error) {
    console.error('[HourTrackingService] Error creating hour allocation:', error);
    throw new Error('Failed to create hour allocation');
  }
}

/**
 * Get hour allocation by ID
 */
export async function getHourAllocationById(allocationId: string): Promise<HourAllocation | null> {
  try {
    const allocRef = doc(db!, HOUR_ALLOCATIONS_COLLECTION, allocationId);
    const allocSnap = await getDoc(allocRef);

    if (allocSnap.exists()) {
      return { id: allocSnap.id, ...allocSnap.data() } as HourAllocation;
    }

    return null;
  } catch (error) {
    console.error('[HourTrackingService] Error fetching hour allocation:', error);
    throw new Error('Failed to fetch hour allocation');
  }
}

/**
 * Get allocations by project
 */
export async function getAllocationsByProject(projectId: string): Promise<HourAllocation[]> {
  try {
    const allocsRef = collection(db!, HOUR_ALLOCATIONS_COLLECTION);
    const q = query(
      allocsRef,
      where('projectId', '==', projectId),
      orderBy('allocatedAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as HourAllocation);
  } catch (error) {
    console.error('[HourTrackingService] Error fetching project allocations:', error);
    throw new Error('Failed to fetch project allocations');
  }
}

/**
 * Get allocations by hour package
 */
export async function getAllocationsByPackage(packageId: string): Promise<HourAllocation[]> {
  try {
    const allocsRef = collection(db!, HOUR_ALLOCATIONS_COLLECTION);
    const q = query(
      allocsRef,
      where('hourPackageId', '==', packageId),
      orderBy('allocatedAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as HourAllocation);
  } catch (error) {
    console.error('[HourTrackingService] Error fetching package allocations:', error);
    throw new Error('Failed to fetch package allocations');
  }
}

/**
 * Update hour allocation status
 */
export async function updateHourAllocationStatus(
  allocationId: string,
  status: HourAllocation['status']
): Promise<void> {
  try {
    const allocRef = doc(db!, HOUR_ALLOCATIONS_COLLECTION, allocationId);
    await updateDoc(allocRef, { status });
  } catch (error) {
    console.error('[HourTrackingService] Error updating allocation status:', error);
    throw new Error('Failed to update allocation status');
  }
}

// ==================== Hour Transactions ====================

/**
 * Create an hour transaction
 */
export async function createHourTransaction(
  transaction: Omit<HourTransaction, 'id' | 'createdAt' | 'status'>
): Promise<HourTransaction> {
  try {
    const transRef = doc(collection(db!, HOUR_TRANSACTIONS_COLLECTION));
    const now = new Date();

    const newTransaction: HourTransaction = {
      ...transaction,
      id: transRef.id,
      status: 'pending',
      createdAt: now.toISOString(),
    };

    await setDoc(transRef, newTransaction);

    return newTransaction;
  } catch (error) {
    console.error('[HourTrackingService] Error creating hour transaction:', error);
    throw new Error('Failed to create hour transaction');
  }
}

/**
 * Get hour transaction by ID
 */
export async function getHourTransactionById(transactionId: string): Promise<HourTransaction | null> {
  try {
    const transRef = doc(db!, HOUR_TRANSACTIONS_COLLECTION, transactionId);
    const transSnap = await getDoc(transRef);

    if (transSnap.exists()) {
      return { id: transSnap.id, ...transSnap.data() } as HourTransaction;
    }

    return null;
  } catch (error) {
    console.error('[HourTrackingService] Error fetching hour transaction:', error);
    throw new Error('Failed to fetch hour transaction');
  }
}

/**
 * Get transactions by allocation
 */
export async function getTransactionsByAllocation(allocationId: string): Promise<HourTransaction[]> {
  try {
    const transRef = collection(db!, HOUR_TRANSACTIONS_COLLECTION);
    const q = query(
      transRef,
      where('allocationId', '==', allocationId),
      orderBy('createdAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as HourTransaction);
  } catch (error) {
    console.error('[HourTrackingService] Error fetching allocation transactions:', error);
    throw new Error('Failed to fetch transactions');
  }
}

/**
 * Get transactions by project
 */
export async function getTransactionsByProject(projectId: string): Promise<HourTransaction[]> {
  try {
    const transRef = collection(db!, HOUR_TRANSACTIONS_COLLECTION);
    const q = query(
      transRef,
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as HourTransaction);
  } catch (error) {
    console.error('[HourTrackingService] Error fetching project transactions:', error);
    throw new Error('Failed to fetch transactions');
  }
}

/**
 * Approve hour transaction
 */
export async function approveHourTransaction(
  transactionId: string,
  allocationId: string,
  hours: number
): Promise<void> {
  try {
    const transRef = doc(db!, HOUR_TRANSACTIONS_COLLECTION, transactionId);
    await updateDoc(transRef, { status: 'approved' });

    // Update allocation hours
    const allocRef = doc(db!, HOUR_ALLOCATIONS_COLLECTION, allocationId);
    const allocSnap = await getDoc(allocRef);
    if (allocSnap.exists()) {
      const allocData = allocSnap.data() as HourAllocation;
      await updateDoc(allocRef, {
        usedHours: allocData.usedHours + hours,
        remainingHours: allocData.remainingHours - hours,
      });
    }
  } catch (error) {
    console.error('[HourTrackingService] Error approving hour transaction:', error);
    throw new Error('Failed to approve hour transaction');
  }
}

/**
 * Reject hour transaction
 */
export async function rejectHourTransaction(transactionId: string): Promise<void> {
  try {
    const transRef = doc(db!, HOUR_TRANSACTIONS_COLLECTION, transactionId);
    await updateDoc(transRef, { status: 'rejected' });
  } catch (error) {
    console.error('[HourTrackingService] Error rejecting hour transaction:', error);
    throw new Error('Failed to reject hour transaction');
  }
}

// ==================== Real-time Subscriptions ====================

/**
 * Subscribe to client's hour packages (real-time)
 */
export function subscribeToHourPackages(
  clientId: string,
  callback: (packages: HourPackage[]) => void
): Unsubscribe {
  const pkgsRef = collection(db!, HOUR_PACKAGES_COLLECTION);
  const q = query(
    pkgsRef,
    where('clientId', '==', clientId),
    orderBy('purchasedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const packages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as HourPackage);
      callback(packages);
    },
    (error) => {
      console.error('[HourTrackingService] Error subscribing to hour packages:', error);
      callback([]);
    }
  );
}

/**
 * Subscribe to project's hour allocations (real-time)
 */
export function subscribeToProjectAllocations(
  projectId: string,
  callback: (allocations: HourAllocation[]) => void
): Unsubscribe {
  const allocsRef = collection(db!, HOUR_ALLOCATIONS_COLLECTION);
  const q = query(
    allocsRef,
    where('projectId', '==', projectId),
    orderBy('allocatedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const allocations = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as HourAllocation);
      callback(allocations);
    },
    (error) => {
      console.error('[HourTrackingService] Error subscribing to allocations:', error);
      callback([]);
    }
  );
}
