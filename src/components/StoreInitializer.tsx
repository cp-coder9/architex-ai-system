import { useEffect } from 'react';
import { useAuthStore, useProjectStore, useNotificationStore, useTaskStore, useProjectRequestStore, useInvoiceStore, useSettingsStore } from '@/store';

/**
 * StoreInitializer Component
 * 
 * Initializes all feature stores after authentication succeeds.
 * This ensures Firebase real-time listeners are set up only when
 * the user is authenticated, and are cleaned up on unmount.
 * 
 * Each store's initialize() method sets up Firestore onSnapshot listeners
 * that stream real-time data to the frontend.
 */
export function StoreInitializer() {
  const { isAuthenticated, currentUser } = useAuthStore();

  useEffect(() => {
    // Only initialize stores when user is authenticated
    if (!isAuthenticated || !currentUser) {
      return;
    }

    const userId = currentUser.id;
    const userRole = currentUser.role;

    console.log('[StoreInitializer] Initializing stores for user:', userId, 'role:', userRole);

    // Initialize all feature stores
    // These set up Firestore onSnapshot listeners for real-time data
    useProjectStore.getState().initialize(userId, userRole);
    useSettingsStore.getState().initialize(userId, userRole);
    useProjectRequestStore.getState().initialize(userId, userRole);
    useInvoiceStore.getState().initialize(userId, userRole);
    useTaskStore.getState().initialize(userId, userRole);

    // Initialize notification store with userId filter for security
    // This ensures users only receive their own notifications
    useNotificationStore.getState().initialize(userId);

    // Cleanup function - called on unmount
    return () => {
      console.log('[StoreInitializer] Cleaning up stores');

      useProjectStore.getState().cleanup();
      useSettingsStore.getState().cleanup();
      useProjectRequestStore.getState().cleanup();
      useInvoiceStore.getState().cleanup();
      useTaskStore.getState().cleanup();
      useNotificationStore.getState().cleanup();
    };
  }, [isAuthenticated, currentUser?.id, currentUser?.role]);

  // This component doesn't render anything
  // It just manages side effects (initializing/cleaning up stores)
  return null;
}
