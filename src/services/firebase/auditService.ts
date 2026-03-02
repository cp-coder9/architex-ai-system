/**
 * Audit Service
 *
 * Handles CRUD operations for audit logs and security events.
 *
 * Collections:
 * - audit_logs: Audit log entries
 * - security_events: Security event entries
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { AuditLog, SecurityEvent } from '@/types';

const AUDIT_LOGS_COLLECTION = 'audit_logs';
const SECURITY_EVENTS_COLLECTION = 'security_events';

// Helper functions
function timestampToDate(timestamp: Timestamp | Date | undefined): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp || new Date();
}

function serializeData(data: Record<string, unknown>): Record<string, unknown> {
  const serialized: Record<string, unknown> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      if (value instanceof Date) {
        serialized[key] = Timestamp.fromDate(value);
      } else {
        serialized[key] = value;
      }
    }
  });

  return serialized;
}

function deserializeAuditLog(data: Record<string, unknown>, id: string): AuditLog {
  return {
    id,
    ...data,
    timestamp: timestampToDate(data.timestamp as Timestamp),
  } as AuditLog;
}

function deserializeSecurityEvent(data: Record<string, unknown>, id: string): SecurityEvent {
  return {
    id,
    ...data,
    timestamp: timestampToDate(data.timestamp as Timestamp),
    resolvedAt: data.resolvedAt ? timestampToDate(data.resolvedAt as Timestamp) : undefined,
  } as SecurityEvent;
}

// ==================== Audit Logs ====================

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  log: Omit<AuditLog, 'id' | 'timestamp'>
): Promise<AuditLog> {
  try {
    const logsRef = collection(db!, AUDIT_LOGS_COLLECTION);
    const now = new Date();

    const newLog: AuditLog = {
      ...log,
      id: '', // Will be set after creation
      timestamp: now,
    };

    const docRef = await addDoc(logsRef, {
      ...serializeData(newLog as unknown as Record<string, unknown>),
      timestamp: serverTimestamp(),
    });

    return {
      ...newLog,
      id: docRef.id,
    };
  } catch (error) {
    console.error('[AuditService] Error creating audit log:', error);
    throw new Error('Failed to create audit log');
  }
}

/**
 * Get audit log by ID
 */
export async function getAuditLogById(logId: string): Promise<AuditLog | null> {
  try {
    const logRef = doc(db!, AUDIT_LOGS_COLLECTION, logId);
    const logSnap = await getDoc(logRef);

    if (logSnap.exists()) {
      return deserializeAuditLog(logSnap.data(), logSnap.id);
    }

    return null;
  } catch (error) {
    console.error('[AuditService] Error fetching audit log:', error);
    throw new Error('Failed to fetch audit log');
  }
}

/**
 * Get audit logs by actor
 */
export async function getAuditLogsByActor(
  actorId: string,
  limitCount: number = 100
): Promise<AuditLog[]> {
  try {
    const logsRef = collection(db!, AUDIT_LOGS_COLLECTION);
    const q = query(
      logsRef,
      where('actorId', '==', actorId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => deserializeAuditLog(doc.data(), doc.id));
  } catch (error) {
    console.error('[AuditService] Error fetching actor audit logs:', error);
    throw new Error('Failed to fetch audit logs');
  }
}

/**
 * Get audit logs by category
 */
export async function getAuditLogsByCategory(
  category: AuditLog['category'],
  limitCount: number = 100
): Promise<AuditLog[]> {
  try {
    const logsRef = collection(db!, AUDIT_LOGS_COLLECTION);
    const q = query(
      logsRef,
      where('category', '==', category),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => deserializeAuditLog(doc.data(), doc.id));
  } catch (error) {
    console.error('[AuditService] Error fetching category audit logs:', error);
    throw new Error('Failed to fetch audit logs');
  }
}

/**
 * Get audit logs by severity
 */
export async function getAuditLogsBySeverity(
  severity: AuditLog['severity'],
  limitCount: number = 100
): Promise<AuditLog[]> {
  try {
    const logsRef = collection(db!, AUDIT_LOGS_COLLECTION);
    const q = query(
      logsRef,
      where('severity', '==', severity),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => deserializeAuditLog(doc.data(), doc.id));
  } catch (error) {
    console.error('[AuditService] Error fetching severity audit logs:', error);
    throw new Error('Failed to fetch audit logs');
  }
}

/**
 * Get all audit logs
 */
export async function getAllAuditLogs(limitCount: number = 100): Promise<AuditLog[]> {
  try {
    const logsRef = collection(db!, AUDIT_LOGS_COLLECTION);
    const q = query(
      logsRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => deserializeAuditLog(doc.data(), doc.id));
  } catch (error) {
    console.error('[AuditService] Error fetching all audit logs:', error);
    throw new Error('Failed to fetch audit logs');
  }
}

/**
 * Get audit logs by related entity
 */
export async function getAuditLogsByEntity(
  entityType: string,
  entityId: string,
  limitCount: number = 100
): Promise<AuditLog[]> {
  try {
    const logsRef = collection(db!, AUDIT_LOGS_COLLECTION);
    const q = query(
      logsRef,
      where('relatedEntityType', '==', entityType),
      where('relatedEntityId', '==', entityId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => deserializeAuditLog(doc.data(), doc.id));
  } catch (error) {
    console.error('[AuditService] Error fetching entity audit logs:', error);
    throw new Error('Failed to fetch audit logs');
  }
}

// ==================== Security Events ====================

/**
 * Create a security event
 */
export async function createSecurityEvent(
  event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>
): Promise<SecurityEvent> {
  try {
    const eventsRef = collection(db!, SECURITY_EVENTS_COLLECTION);
    const now = new Date();

    const newEvent: SecurityEvent = {
      ...event,
      id: '', // Will be set after creation
      timestamp: now,
      resolved: false,
    };

    const docRef = await addDoc(eventsRef, {
      ...serializeData(newEvent as unknown as Record<string, unknown>),
      timestamp: serverTimestamp(),
    });

    return {
      ...newEvent,
      id: docRef.id,
    };
  } catch (error) {
    console.error('[AuditService] Error creating security event:', error);
    throw new Error('Failed to create security event');
  }
}

/**
 * Get security event by ID
 */
export async function getSecurityEventById(eventId: string): Promise<SecurityEvent | null> {
  try {
    const eventRef = doc(db!, SECURITY_EVENTS_COLLECTION, eventId);
    const eventSnap = await getDoc(eventRef);

    if (eventSnap.exists()) {
      return deserializeSecurityEvent(eventSnap.data(), eventSnap.id);
    }

    return null;
  } catch (error) {
    console.error('[AuditService] Error fetching security event:', error);
    throw new Error('Failed to fetch security event');
  }
}

/**
 * Get security events by user
 */
export async function getSecurityEventsByUser(
  userId: string,
  limitCount: number = 100
): Promise<SecurityEvent[]> {
  try {
    const eventsRef = collection(db!, SECURITY_EVENTS_COLLECTION);
    const q = query(
      eventsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => deserializeSecurityEvent(doc.data(), doc.id));
  } catch (error) {
    console.error('[AuditService] Error fetching user security events:', error);
    throw new Error('Failed to fetch security events');
  }
}

/**
 * Get security events by severity
 */
export async function getSecurityEventsBySeverity(
  severity: SecurityEvent['severity'],
  limitCount: number = 100
): Promise<SecurityEvent[]> {
  try {
    const eventsRef = collection(db!, SECURITY_EVENTS_COLLECTION);
    const q = query(
      eventsRef,
      where('severity', '==', severity),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => deserializeSecurityEvent(doc.data(), doc.id));
  } catch (error) {
    console.error('[AuditService] Error fetching severity security events:', error);
    throw new Error('Failed to fetch security events');
  }
}

/**
 * Get unresolved security events
 */
export async function getUnresolvedSecurityEvents(limitCount: number = 100): Promise<SecurityEvent[]> {
  try {
    const eventsRef = collection(db!, SECURITY_EVENTS_COLLECTION);
    const q = query(
      eventsRef,
      where('resolved', '==', false),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => deserializeSecurityEvent(doc.data(), doc.id));
  } catch (error) {
    console.error('[AuditService] Error fetching unresolved security events:', error);
    throw new Error('Failed to fetch security events');
  }
}

/**
 * Resolve security event
 */
export async function resolveSecurityEvent(
  eventId: string,
  resolvedBy: string
): Promise<void> {
  try {
    const eventRef = doc(db!, SECURITY_EVENTS_COLLECTION, eventId);
    await updateDoc(eventRef, {
      resolved: true,
      resolvedBy,
      resolvedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[AuditService] Error resolving security event:', error);
    throw new Error('Failed to resolve security event');
  }
}

/**
 * Get all security events
 */
export async function getAllSecurityEvents(limitCount: number = 100): Promise<SecurityEvent[]> {
  try {
    const eventsRef = collection(db!, SECURITY_EVENTS_COLLECTION);
    const q = query(
      eventsRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => deserializeSecurityEvent(doc.data(), doc.id));
  } catch (error) {
    console.error('[AuditService] Error fetching all security events:', error);
    throw new Error('Failed to fetch security events');
  }
}

// ==================== Real-time Subscriptions ====================

/**
 * Subscribe to security events (real-time)
 */
export function subscribeToSecurityEvents(
  callback: (events: SecurityEvent[]) => void
): Unsubscribe {
  const eventsRef = collection(db!, SECURITY_EVENTS_COLLECTION);
  const q = query(
    eventsRef,
    orderBy('timestamp', 'desc'),
    limit(100)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const events = snapshot.docs.map((doc) =>
        deserializeSecurityEvent(doc.data() as Record<string, unknown>, doc.id)
      );
      callback(events);
    },
    (error) => {
      console.error('[AuditService] Error subscribing to security events:', error);
      callback([]);
    }
  );
}

/**
 * Subscribe to unresolved security events (real-time)
 */
export function subscribeToUnresolvedSecurityEvents(
  callback: (events: SecurityEvent[]) => void
): Unsubscribe {
  const eventsRef = collection(db!, SECURITY_EVENTS_COLLECTION);
  const q = query(
    eventsRef,
    where('resolved', '==', false),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const events = snapshot.docs.map((doc) =>
        deserializeSecurityEvent(doc.data() as Record<string, unknown>, doc.id)
      );
      callback(events);
    },
    (error) => {
      console.error('[AuditService] Error subscribing to unresolved security events:', error);
      callback([]);
    }
  );
}

/**
 * Subscribe to audit logs (real-time)
 */
export function subscribeToAuditLogs(
  callback: (logs: AuditLog[]) => void
): Unsubscribe {
  const logsRef = collection(db!, AUDIT_LOGS_COLLECTION);
  const q = query(
    logsRef,
    orderBy('timestamp', 'desc'),
    limit(100)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((doc) =>
        deserializeAuditLog(doc.data() as Record<string, unknown>, doc.id)
      );
      callback(logs);
    },
    (error) => {
      console.error('[AuditService] Error subscribing to audit logs:', error);
      callback([]);
    }
  );
}
