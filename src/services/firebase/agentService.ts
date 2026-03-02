/**
 * Agent Service
 * 
 * Handles storage and retrieval of AI agent information for memory/persistence.
 * Stores agent configurations, learned patterns, compliance rules, and execution history.
 * 
 * Collections:
 * - agent_configs: Agent configurations and settings
 * - agent_memory: Agent memory/state for ongoing tasks
 * - agent_logs: Execution logs and audit trail
 * - agent_rules: Learned compliance rules and patterns
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
  addDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { AgentLog } from '@/types';

// Collection names
const AGENT_CONFIGS_COLLECTION = 'agent_configs';
const AGENT_MEMORY_COLLECTION = 'agent_memory';
const AGENT_LOGS_COLLECTION = 'agent_logs';
const AGENT_RULES_COLLECTION = 'agent_rules';

/**
 * Agent Configuration Type
 */
export interface AgentConfig {
  id: string;
  agentId: string;
  agentName: string;
  agentType: string;
  version: string;
  settings: Record<string, unknown>;
  capabilities: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Agent Memory Type
 * Stores state for ongoing or resumed tasks
 */
export interface AgentMemory {
  id: string;
  agentId: string;
  projectId?: string;
  drawingId?: string;
  sessionId: string;
  memoryData: Record<string, unknown>;
  context: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

/**
 * Agent Rule Type
 * Stores learned patterns and compliance rules
 */
export interface AgentRule {
  id: string;
  agentId: string;
  ruleType: 'compliance' | 'pattern' | 'validation' | 'custom';
  name: string;
  description: string;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  priority: number;
  isActive: boolean;
  successRate: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

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

// ==================== Agent Configurations ====================

/**
 * Create or update agent configuration
 */
export async function saveAgentConfig(
  config: Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AgentConfig> {
  try {
    const configRef = doc(collection(db!, AGENT_CONFIGS_COLLECTION));
    const now = new Date();

    const newConfig: AgentConfig = {
      ...config,
      id: configRef.id,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(configRef, serializeData(newConfig as unknown as Record<string, unknown>));

    return newConfig;
  } catch (error) {
    console.error('[AgentService] Error saving agent config:', error);
    throw new Error('Failed to save agent configuration');
  }
}

/**
 * Get agent configuration by agent ID
 */
export async function getAgentConfig(agentId: string): Promise<AgentConfig | null> {
  try {
    const configsRef = collection(db!, AGENT_CONFIGS_COLLECTION);
    const q = query(
      configsRef,
      where('agentId', '==', agentId),
      orderBy('updatedAt', 'desc'),
      limit(1)
    );

    const querySnap = await getDocs(q);

    if (!querySnap.empty) {
      const doc = querySnap.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: timestampToDate(data.createdAt as Timestamp),
        updatedAt: timestampToDate(data.updatedAt as Timestamp),
      } as AgentConfig;
    }

    return null;
  } catch (error) {
    console.error('[AgentService] Error fetching agent config:', error);
    throw new Error('Failed to fetch agent configuration');
  }
}

/**
 * Update agent configuration
 */
export async function updateAgentConfig(
  configId: string,
  updates: Partial<Omit<AgentConfig, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const configRef = doc(db!, AGENT_CONFIGS_COLLECTION, configId);
    await updateDoc(configRef, {
      ...serializeData(updates as Record<string, unknown>),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[AgentService] Error updating agent config:', error);
    throw new Error('Failed to update agent configuration');
  }
}

// ==================== Agent Memory ====================

/**
 * Save agent memory/state
 */
export async function saveAgentMemory(
  memory: Omit<AgentMemory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AgentMemory> {
  try {
    const memoryRef = doc(collection(db!, AGENT_MEMORY_COLLECTION));
    const now = new Date();

    const newMemory: AgentMemory = {
      ...memory,
      id: memoryRef.id,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(memoryRef, serializeData(newMemory as unknown as Record<string, unknown>));

    return newMemory;
  } catch (error) {
    console.error('[AgentService] Error saving agent memory:', error);
    throw new Error('Failed to save agent memory');
  }
}

/**
 * Get agent memory by agent ID and session
 */
export async function getAgentMemory(
  agentId: string,
  sessionId: string
): Promise<AgentMemory | null> {
  try {
    const memoryRef = collection(db!, AGENT_MEMORY_COLLECTION);
    const q = query(
      memoryRef,
      where('agentId', '==', agentId),
      where('sessionId', '==', sessionId),
      limit(1)
    );

    const querySnap = await getDocs(q);

    if (!querySnap.empty) {
      const doc = querySnap.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: timestampToDate(data.createdAt as Timestamp),
        updatedAt: timestampToDate(data.updatedAt as Timestamp),
        expiresAt: data.expiresAt ? timestampToDate(data.expiresAt as Timestamp) : undefined,
      } as AgentMemory;
    }

    return null;
  } catch (error) {
    console.error('[AgentService] Error fetching agent memory:', error);
    throw new Error('Failed to fetch agent memory');
  }
}

/**
 * Update agent memory
 */
export async function updateAgentMemory(
  memoryId: string,
  updates: Partial<Omit<AgentMemory, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const memoryRef = doc(db!, AGENT_MEMORY_COLLECTION, memoryId);
    await updateDoc(memoryRef, {
      ...serializeData(updates as Record<string, unknown>),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[AgentService] Error updating agent memory:', error);
    throw new Error('Failed to update agent memory');
  }
}

/**
 * Delete agent memory
 */
export async function deleteAgentMemory(memoryId: string): Promise<void> {
  try {
    const memoryRef = doc(db!, AGENT_MEMORY_COLLECTION, memoryId);
    await deleteDoc(memoryRef);
  } catch (error) {
    console.error('[AgentService] Error deleting agent memory:', error);
    throw new Error('Failed to delete agent memory');
  }
}

// ==================== Agent Logs ====================

/**
 * Log agent action
 */
export async function logAgentAction(
  log: Omit<AgentLog, 'id' | 'timestamp'>
): Promise<AgentLog> {
  try {
    const logsRef = collection(db!, AGENT_LOGS_COLLECTION);
    const now = new Date();

    const newLog: AgentLog = {
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
    console.error('[AgentService] Error logging agent action:', error);
    throw new Error('Failed to log agent action');
  }
}

/**
 * Get agent logs
 */
export async function getAgentLogs(
  agentId: string,
  limitCount: number = 100
): Promise<AgentLog[]> {
  try {
    const logsRef = collection(db!, AGENT_LOGS_COLLECTION);
    const q = query(
      logsRef,
      where('agentId', '==', agentId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: timestampToDate(data.timestamp as Timestamp),
      } as AgentLog;
    });
  } catch (error) {
    console.error('[AgentService] Error fetching agent logs:', error);
    throw new Error('Failed to fetch agent logs');
  }
}

/**
 * Get logs for a specific project
 */
export async function getProjectAgentLogs(
  projectId: string,
  limitCount: number = 100
): Promise<AgentLog[]> {
  try {
    const logsRef = collection(db!, AGENT_LOGS_COLLECTION);
    const q = query(
      logsRef,
      where('projectId', '==', projectId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: timestampToDate(data.timestamp as Timestamp),
      } as AgentLog;
    });
  } catch (error) {
    console.error('[AgentService] Error fetching project agent logs:', error);
    throw new Error('Failed to fetch project agent logs');
  }
}

// ==================== Agent Rules ====================

/**
 * Save a learned rule
 */
export async function saveAgentRule(
  rule: Omit<AgentRule, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>
): Promise<AgentRule> {
  try {
    const rulesRef = doc(collection(db!, AGENT_RULES_COLLECTION));
    const now = new Date();

    const newRule: AgentRule = {
      ...rule,
      id: rulesRef.id,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(rulesRef, serializeData(newRule as unknown as Record<string, unknown>));

    return newRule;
  } catch (error) {
    console.error('[AgentService] Error saving agent rule:', error);
    throw new Error('Failed to save agent rule');
  }
}

/**
 * Get active rules for an agent
 */
export async function getAgentRules(
  agentId: string,
  ruleType?: AgentRule['ruleType']
): Promise<AgentRule[]> {
  try {
    const rulesRef = collection(db!, AGENT_RULES_COLLECTION);
    let q = query(
      rulesRef,
      where('agentId', '==', agentId),
      where('isActive', '==', true),
      orderBy('priority', 'desc')
    );

    if (ruleType) {
      q = query(q, where('ruleType', '==', ruleType));
    }

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: timestampToDate(data.createdAt as Timestamp),
        updatedAt: timestampToDate(data.updatedAt as Timestamp),
        lastUsedAt: data.lastUsedAt ? timestampToDate(data.lastUsedAt as Timestamp) : undefined,
      } as AgentRule;
    });
  } catch (error) {
    console.error('[AgentService] Error fetching agent rules:', error);
    throw new Error('Failed to fetch agent rules');
  }
}

/**
 * Update rule usage statistics
 */
export async function updateRuleUsage(
  ruleId: string,
  success: boolean
): Promise<void> {
  try {
    const ruleRef = doc(db!, AGENT_RULES_COLLECTION, ruleId);
    const ruleSnap = await getDoc(ruleRef);

    if (ruleSnap.exists()) {
      const data = ruleSnap.data();
      const currentCount = (data.usageCount as number) || 0;
      const currentSuccessRate = (data.successRate as number) || 0;

      // Calculate new success rate using weighted average
      const newSuccessRate =
        (currentSuccessRate * currentCount + (success ? 1 : 0)) /
        (currentCount + 1);

      await updateDoc(ruleRef, {
        usageCount: currentCount + 1,
        successRate: newSuccessRate,
        lastUsedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('[AgentService] Error updating rule usage:', error);
    throw new Error('Failed to update rule usage');
  }
}
