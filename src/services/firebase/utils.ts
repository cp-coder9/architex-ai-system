/**
 * Firebase Utilities
 * 
 * Common helper functions for Firebase operations.
 * Provides error handling, data serialization, and other utilities.
 */

import { FirebaseError } from 'firebase/app';
import { Timestamp } from 'firebase/firestore';

/**
 * Firebase Auth Error Codes
 */
export const AUTH_ERROR_CODES = {
  // Email/Password Errors
  EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  INVALID_EMAIL: 'auth/invalid-email',
  WEAK_PASSWORD: 'auth/weak-password',
  WRONG_PASSWORD: 'auth/wrong-password',
  USER_NOT_FOUND: 'auth/user-not-found',
  USER_DISABLED: 'auth/user-disabled',

  // Operation Errors
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  NETWORK_REQUEST_FAILED: 'auth/network-request-failed',
  INVALID_CREDENTIAL: 'auth/invalid-credential',
  INVALID_VERIFICATION_CODE: 'auth/invalid-verification-code',
  INVALID_VERIFICATION_ID: 'auth/invalid-verification-id',

  // Token Errors
  REQUIRES_RECENT_LOGIN: 'auth/requires-recent-login',
  CREDENTIAL_TOO_OLD_LOGIN_AGAIN: 'auth/credential-too-old-login-again',

  // Configuration Errors
  INVALID_API_KEY: 'auth/invalid-api-key',
  APP_NOT_AUTHORIZED: 'auth/app-not-authorized',
  INVALID_CONTINUE_URI: 'auth/invalid-continue-uri',
  UNAUTHORIZED_CONTINUE_URI: 'auth/unauthorized-continue-uri',

  // Popup/Redirect Errors
  POPUP_BLOCKED: 'auth/popup-blocked',
  POPUP_CLOSED_BY_USER: 'auth/popup-closed-by-user',
  UNAUTHORIZED_DOMAIN: 'auth/unauthorized-domain',
} as const;

/**
 * Get user-friendly error message from Firebase error
 */
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE:
        return 'This email is already registered. Please use a different email or sign in.';
      case AUTH_ERROR_CODES.INVALID_EMAIL:
        return 'Please enter a valid email address.';
      case AUTH_ERROR_CODES.WEAK_PASSWORD:
        return 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.';
      case AUTH_ERROR_CODES.WRONG_PASSWORD:
        return 'Incorrect password. Please try again.';
      case AUTH_ERROR_CODES.USER_NOT_FOUND:
        return 'No account found with this email. Please check your email or register.';
      case AUTH_ERROR_CODES.USER_DISABLED:
        return 'This account has been disabled. Please contact support.';
      case AUTH_ERROR_CODES.TOO_MANY_REQUESTS:
        return 'Too many failed attempts. Please try again later.';
      case AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED:
        return 'Network error. Please check your internet connection.';
      case AUTH_ERROR_CODES.INVALID_CREDENTIAL:
        return 'Invalid login credentials. Please try again.';
      case AUTH_ERROR_CODES.REQUIRES_RECENT_LOGIN:
        return 'Please sign in again to complete this action.';
      case AUTH_ERROR_CODES.POPUP_BLOCKED:
        return 'Popup was blocked. Please allow popups for this site.';
      case AUTH_ERROR_CODES.POPUP_CLOSED_BY_USER:
        return 'Sign in was cancelled. Please try again.';
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is a specific Firebase auth error
 */
export function isAuthError(error: unknown, code: string): boolean {
  return error instanceof FirebaseError && error.code === code;
}

/**
 * Serialize data for Firestore
 * Converts Date objects to Firestore Timestamps and removes undefined values
 */
export function serializeForFirestore<T extends Record<string, unknown>>(
  data: T
): Record<string, unknown> {
  const serialized: Record<string, unknown> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      if (value instanceof Date) {
        serialized[key] = Timestamp.fromDate(value);
      } else if (Array.isArray(value)) {
        serialized[key] = value.map((item) =>
          item instanceof Date ? Timestamp.fromDate(item) : item
        );
      } else if (value !== null && typeof value === 'object') {
        serialized[key] = serializeForFirestore(value as Record<string, unknown>);
      } else {
        serialized[key] = value;
      }
    }
  });

  return serialized;
}

/**
 * Deserialize data from Firestore
 * Converts Firestore Timestamps to Date objects
 */
export function deserializeFromFirestore<T>(data: Record<string, unknown>): T {
  const deserialized: Record<string, unknown> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof Timestamp) {
      deserialized[key] = value.toDate();
    } else if (Array.isArray(value)) {
      deserialized[key] = value.map((item) =>
        item instanceof Timestamp ? item.toDate() : item
      );
    } else if (value !== null && typeof value === 'object' && !(value instanceof Timestamp)) {
      deserialized[key] = deserializeFromFirestore(value as Record<string, unknown>);
    } else {
      deserialized[key] = value;
    }
  });

  return deserialized as T;
}

/**
 * Convert Timestamp to Date
 */
export function timestampToDate(timestamp: Timestamp | Date | undefined | null): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp || new Date();
}

/**
 * Create a Firestore-compatible document ID
 * Generates a unique ID similar to Firestore's auto-generated IDs
 */
export function generateDocumentId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 20; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Batch operation helper
 * Splits an array of operations into chunks to avoid batch size limits
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Retry operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on certain errors
      if (error instanceof FirebaseError) {
        if (
          error.code === AUTH_ERROR_CODES.USER_NOT_FOUND ||
          error.code === AUTH_ERROR_CODES.WRONG_PASSWORD ||
          error.code === AUTH_ERROR_CODES.USER_DISABLED ||
          error.code === AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE
        ) {
          throw error;
        }
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Debounce function for Firebase operations
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for Firebase operations
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Collection paths for Firestore
 */
export const COLLECTIONS = {
  USERS: 'users',
  PROJECTS: 'projects',
  DRAWINGS: 'drawings',
  TIME_ENTRIES: 'timeEntries',
  INVOICES: 'invoices',
  COMMENTS: 'comments',
  MILESTONES: 'milestones',
  NOTIFICATIONS: 'notifications',
  CHAT_MESSAGES: 'chatMessages',
  AGENT_CONFIGS: 'agent_configs',
  AGENT_MEMORY: 'agent_memory',
  AGENT_LOGS: 'agent_logs',
  AGENT_RULES: 'agent_rules',
  SETTINGS: 'settings',
  AUDIT_LOGS: 'audit_logs',
  SECURITY_EVENTS: 'security_events',
  PROJECT_REQUESTS: 'projectRequests',
  TASKS: 'tasks',
  TASK_APPLICATIONS: 'taskApplications',
  HOUR_PACKAGES: 'hourPackages',
  HOUR_ALLOCATIONS: 'hourAllocations',
  HOUR_TRANSACTIONS: 'hourTransactions',
  PROOFS: 'proofs',
} as const;

/**
 * Storage paths for Firebase Storage
 */
export const STORAGE_PATHS = {
  DRAWINGS: 'drawings',
  AVATARS: 'avatars',
  ATTACHMENTS: 'attachments',
  EXPORTS: 'exports',
  TEMP: 'temp',
} as const;

/**
 * Validation helpers
 */
export const validators = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPassword: (password: string): boolean => {
    // At least 6 characters
    return password.length >= 6;
  },

  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-+()]+$/;
    return phoneRegex.test(phone) && phone.length >= 10;
  },
};
