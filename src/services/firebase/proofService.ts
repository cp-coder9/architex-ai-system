/**
 * Proof of Work Service
 *
 * Handles CRUD operations for proof of work submissions.
 *
 * Collections:
 * - proofs: Proof of work submissions by freelancers
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
  _Timestamp,
  _serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ProofOfWork } from '@/types';

const PROOFS_COLLECTION = 'proofs';

/**
 * Submit proof of work
 */
export async function submitProof(
  proof: Omit<ProofOfWork, 'id' | 'submittedAt' | 'verificationStatus'>
): Promise<ProofOfWork> {
  try {
    const proofRef = doc(collection(db!, PROOFS_COLLECTION));
    const now = new Date();

    const newProof: ProofOfWork = {
      ...proof,
      id: proofRef.id,
      submittedAt: now.toISOString(),
      verificationStatus: 'pending',
    };

    await setDoc(proofRef, newProof);

    return newProof;
  } catch (error) {
    console.error('[ProofService] Error submitting proof:', error);
    throw new Error('Failed to submit proof of work');
  }
}

/**
 * Get proof by ID
 */
export async function getProofById(proofId: string): Promise<ProofOfWork | null> {
  try {
    const proofRef = doc(db!, PROOFS_COLLECTION, proofId);
    const proofSnap = await getDoc(proofRef);

    if (proofSnap.exists()) {
      return { id: proofSnap.id, ...proofSnap.data() } as ProofOfWork;
    }

    return null;
  } catch (error) {
    console.error('[ProofService] Error fetching proof:', error);
    throw new Error('Failed to fetch proof');
  }
}

/**
 * Update proof
 */
export async function updateProof(
  proofId: string,
  updates: Partial<Omit<ProofOfWork, 'id' | 'submittedAt'>>
): Promise<void> {
  try {
    const proofRef = doc(db!, PROOFS_COLLECTION, proofId);
    await updateDoc(proofRef, updates);
  } catch (error) {
    console.error('[ProofService] Error updating proof:', error);
    throw new Error('Failed to update proof');
  }
}

/**
 * Delete proof
 */
export async function deleteProof(proofId: string): Promise<void> {
  try {
    const proofRef = doc(db!, PROOFS_COLLECTION, proofId);
    await deleteDoc(proofRef);
  } catch (error) {
    console.error('[ProofService] Error deleting proof:', error);
    throw new Error('Failed to delete proof');
  }
}

/**
 * Get proofs by task
 */
export async function getProofsByTask(taskId: string): Promise<ProofOfWork[]> {
  try {
    const proofsRef = collection(db!, PROOFS_COLLECTION);
    const q = query(
      proofsRef,
      where('taskId', '==', taskId),
      orderBy('submittedAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ProofOfWork);
  } catch (error) {
    console.error('[ProofService] Error fetching task proofs:', error);
    throw new Error('Failed to fetch proofs');
  }
}

/**
 * Get proofs by freelancer
 */
export async function getProofsByFreelancer(freelancerId: string): Promise<ProofOfWork[]> {
  try {
    const proofsRef = collection(db!, PROOFS_COLLECTION);
    const q = query(
      proofsRef,
      where('freelancerId', '==', freelancerId),
      orderBy('submittedAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ProofOfWork);
  } catch (error) {
    console.error('[ProofService] Error fetching freelancer proofs:', error);
    throw new Error('Failed to fetch proofs');
  }
}

/**
 * Get proofs by project
 */
export async function getProofsByProject(projectId: string): Promise<ProofOfWork[]> {
  try {
    const proofsRef = collection(db!, PROOFS_COLLECTION);
    const q = query(
      proofsRef,
      where('projectId', '==', projectId),
      orderBy('submittedAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ProofOfWork);
  } catch (error) {
    console.error('[ProofService] Error fetching project proofs:', error);
    throw new Error('Failed to fetch proofs');
  }
}

/**
 * Get pending verification proofs
 */
export async function getPendingProofs(limitCount: number = 100): Promise<ProofOfWork[]> {
  try {
    const proofsRef = collection(db!, PROOFS_COLLECTION);
    const q = query(
      proofsRef,
      where('verificationStatus', '==', 'pending'),
      orderBy('submittedAt', 'desc'),
      limit(limitCount)
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ProofOfWork);
  } catch (error) {
    console.error('[ProofService] Error fetching pending proofs:', error);
    throw new Error('Failed to fetch pending proofs');
  }
}

/**
 * Approve proof
 */
export async function approveProof(proofId: string, verifiedBy: string): Promise<void> {
  try {
    const proofRef = doc(db!, PROOFS_COLLECTION, proofId);
    await updateDoc(proofRef, {
      verificationStatus: 'approved',
      verifiedBy,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ProofService] Error approving proof:', error);
    throw new Error('Failed to approve proof');
  }
}

/**
 * Reject proof
 */
export async function rejectProof(
  proofId: string,
  verifiedBy: string,
  rejectionReason: string
): Promise<void> {
  try {
    const proofRef = doc(db!, PROOFS_COLLECTION, proofId);
    await updateDoc(proofRef, {
      verificationStatus: 'rejected',
      verifiedBy,
      verifiedAt: new Date().toISOString(),
      rejectionReason,
    });
  } catch (error) {
    console.error('[ProofService] Error rejecting proof:', error);
    throw new Error('Failed to reject proof');
  }
}

// ==================== Real-time Subscriptions ====================

/**
 * Subscribe to task proofs (real-time)
 */
export function subscribeToTaskProofs(
  taskId: string,
  callback: (proofs: ProofOfWork[]) => void
): Unsubscribe {
  const proofsRef = collection(db!, PROOFS_COLLECTION);
  const q = query(
    proofsRef,
    where('taskId', '==', taskId),
    orderBy('submittedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const proofs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ProofOfWork);
      callback(proofs);
    },
    (error) => {
      console.error('[ProofService] Error subscribing to task proofs:', error);
      callback([]);
    }
  );
}

/**
 * Subscribe to freelancer proofs (real-time)
 */
export function subscribeToFreelancerProofs(
  freelancerId: string,
  callback: (proofs: ProofOfWork[]) => void
): Unsubscribe {
  const proofsRef = collection(db!, PROOFS_COLLECTION);
  const q = query(
    proofsRef,
    where('freelancerId', '==', freelancerId),
    orderBy('submittedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const proofs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ProofOfWork);
      callback(proofs);
    },
    (error) => {
      console.error('[ProofService] Error subscribing to freelancer proofs:', error);
      callback([]);
    }
  );
}
