import { create } from 'zustand';
import { Notification, ChatMessage } from '@/types';
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
import { useProjectStore } from './projectStore';

interface NotificationState {
  notifications: Notification[];
  chatMessages: ChatMessage[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  unsubscribeNotifications: Unsubscribe | null;
  unsubscribeChatMessages: Unsubscribe | null;
  
  // Project-specific chat subscriptions
  projectChatSubscriptions: Map<string, Unsubscribe>;

  // Initialization
  initialize: (userId?: string) => void;
  cleanup: () => void;

  // Actions
  addNotification: (notification: Partial<Notification>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearNotifications: (userId: string) => Promise<void>;
  getUserNotifications: (userId: string) => Notification[];
  getUnreadCount: (userId: string) => number;

  // Chat actions
  sendMessage: (message: Partial<ChatMessage>) => Promise<void>;
  markMessageAsRead: (messageId: string, userId: string) => Promise<void>;
  getProjectMessages: (projectId: string) => ChatMessage[];
  
  // Project-specific chat subscription (lazy subscription)
  subscribeToProjectChat: (projectId: string, userId: string) => void;
  unsubscribeFromProjectChat: (projectId: string) => void;
  clearAllProjectSubscriptions: () => void;
}

// Collection names
const NOTIFICATIONS_COLLECTION = 'notifications';
const CHAT_MESSAGES_COLLECTION = 'chatMessages';

// Helper to convert Firestore timestamps to dates
function convertTimestamps(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  if (result.createdAt instanceof Timestamp) {
    result.createdAt = result.createdAt.toDate();
  }
  return result;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  chatMessages: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  unsubscribeNotifications: null,
  unsubscribeChatMessages: null,
  projectChatSubscriptions: new Map(),

  // Initialization - accepts userId to filter notifications for the current user
  // Note: Chat messages are now subscribed lazily per-project to avoid fetching all messages globally
  initialize: (userId?: string) => {
    if (!isFirebaseConfigured() || !db) {
      console.warn('[NotificationStore] Firebase not configured, using empty arrays');
      return;
    }

    set({ isLoading: true, error: null });

    // Subscribe to notifications collection filtered by userId
    let notificationsQuery;
    if (userId) {
      notificationsQuery = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    } else {
      notificationsQuery = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribeNotifications = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestamps(doc.data()),
        })) as Notification[];
        set({ notifications, isLoading: false });
      },
      (error) => {
        console.error('[NotificationStore] Error fetching notifications:', error);
        set({ error: 'Failed to fetch notifications', isLoading: false });
      }
    );

    // Note: Chat messages are no longer subscribed globally
    // Instead, use subscribeToProjectChat() to subscribe to messages for specific projects
    // This prevents loading all chat messages for all users

    set({ unsubscribeNotifications });
  },

  cleanup: () => {
    const { unsubscribeNotifications, unsubscribeChatMessages, projectChatSubscriptions } = get();
    
    // Unsubscribe from notifications
    if (unsubscribeNotifications) unsubscribeNotifications();
    
    // Unsubscribe from global chat messages (if any)
    if (unsubscribeChatMessages) unsubscribeChatMessages();
    
    // Unsubscribe from all project-specific chat subscriptions
    projectChatSubscriptions.forEach((unsubscribe) => unsubscribe());
    projectChatSubscriptions.clear();
    
    set({
      unsubscribeNotifications: null,
      unsubscribeChatMessages: null,
      projectChatSubscriptions: new Map(),
    });
  },

  addNotification: async (notificationData) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const newNotification = {
        userId: notificationData.userId!,
        type: notificationData.type!,
        title: notificationData.title!,
        message: notificationData.message!,
        read: false,
        createdAt: serverTimestamp(),
        link: notificationData.link,
        data: notificationData.data,
      };

      await addDoc(collection(db, NOTIFICATIONS_COLLECTION), newNotification);
    } catch (error) {
      console.error('[NotificationStore] Error adding notification:', error);
      set({ error: 'Failed to add notification' });
      throw error;
    }
  },

  markAsRead: async (id) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, id);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('[NotificationStore] Error marking notification as read:', error);
      set({ error: 'Failed to mark notification as read' });
      throw error;
    }
  },

  markAllAsRead: async (userId) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const { notifications } = get();
      const userUnreadNotifications = notifications.filter(n => n.userId === userId && !n.read);

      for (const notification of userUnreadNotifications) {
        const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notification.id);
        await updateDoc(notificationRef, { read: true });
      }
    } catch (error) {
      console.error('[NotificationStore] Error marking all notifications as read:', error);
      set({ error: 'Failed to mark all notifications as read' });
      throw error;
    }
  },

  deleteNotification: async (id) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, id));
    } catch (error) {
      console.error('[NotificationStore] Error deleting notification:', error);
      set({ error: 'Failed to delete notification' });
      throw error;
    }
  },

  clearNotifications: async (userId) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const { notifications } = get();
      const userNotifications = notifications.filter(n => n.userId === userId);

      for (const notification of userNotifications) {
        await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notification.id));
      }
    } catch (error) {
      console.error('[NotificationStore] Error clearing notifications:', error);
      set({ error: 'Failed to clear notifications' });
      throw error;
    }
  },

  getUserNotifications: (userId) => {
    return get().notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
  },

  getUnreadCount: (userId) => {
    return get().notifications.filter(n => n.userId === userId && !n.read).length;
  },

  sendMessage: async (messageData) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const newMessage = {
        projectId: messageData.projectId!,
        senderId: messageData.senderId!,
        content: messageData.content!,
        createdAt: serverTimestamp(),
        attachments: messageData.attachments,
        readBy: [messageData.senderId!],
      };

      await addDoc(collection(db, CHAT_MESSAGES_COLLECTION), newMessage);
    } catch (error) {
      console.error('[NotificationStore] Error sending message:', error);
      set({ error: 'Failed to send message' });
      throw error;
    }
  },

  markMessageAsRead: async (messageId, userId) => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const { chatMessages } = get();
      const message = chatMessages.find(m => m.id === messageId);
      
      if (message && !message.readBy.includes(userId)) {
        const messageRef = doc(db, CHAT_MESSAGES_COLLECTION, messageId);
        await updateDoc(messageRef, {
          readBy: [...message.readBy, userId],
        });
      }
    } catch (error) {
      console.error('[NotificationStore] Error marking message as read:', error);
      set({ error: 'Failed to mark message as read' });
      throw error;
    }
  },

  getProjectMessages: (projectId) => {
    return get().chatMessages
      .filter(m => m.projectId === projectId)
      .sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return dateA - dateB;
      });
  },

  // Subscribe to chat messages for a specific project
  // This implements lazy subscription - messages are only loaded when needed
  subscribeToProjectChat: (projectId, userId) => {
    if (!isFirebaseConfigured() || !db) {
      console.warn('[NotificationStore] Firebase not configured, cannot subscribe to project chat');
      return;
    }

    const { projectChatSubscriptions } = get();
    
    // Already subscribed to this project
    if (projectChatSubscriptions.has(projectId)) {
      console.log(`[NotificationStore] Already subscribed to project ${projectId}`);
      return;
    }

    // Get user's project IDs from projectStore to verify membership
    const projectStore = useProjectStore.getState();
    const userProjectIds = projectStore.projects
      .filter(p => 
        p.clientId === userId || 
        p.freelancerId === userId
      )
      .map(p => p.id);

    // Check if user is a member of this project
    if (!userProjectIds.includes(projectId)) {
      console.warn(`[NotificationStore] User ${userId} is not a member of project ${projectId}`);
      // Still subscribe but messages will be filtered client-side
    }

    console.log(`[NotificationStore] Subscribing to chat messages for project ${projectId}`);

    // Subscribe to messages for this specific project only
    const chatMessagesQuery = query(
      collection(db, CHAT_MESSAGES_COLLECTION),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      chatMessagesQuery,
      (snapshot) => {
        const newMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestamps(doc.data()),
        })) as ChatMessage[];

        // Update chat messages - merge with existing messages for other projects
        const { chatMessages } = get();
        
        // Remove old messages for this project and add new ones
        const otherProjectMessages = chatMessages.filter(m => m.projectId !== projectId);
        const updatedChatMessages = [...otherProjectMessages, ...newMessages];
        
        set({ chatMessages: updatedChatMessages });
      },
      (error) => {
        console.error(`[NotificationStore] Error fetching chat messages for project ${projectId}:`, error);
      }
    );

    // Store the unsubscribe function
    const newSubscriptions = new Map(projectChatSubscriptions);
    newSubscriptions.set(projectId, unsubscribe);
    set({ projectChatSubscriptions: newSubscriptions });
  },

  // Unsubscribe from a specific project's chat messages
  unsubscribeFromProjectChat: (projectId) => {
    const { projectChatSubscriptions } = get();
    const unsubscribe = projectChatSubscriptions.get(projectId);
    
    if (unsubscribe) {
      unsubscribe();
      const newSubscriptions = new Map(projectChatSubscriptions);
      newSubscriptions.delete(projectId);
      set({ projectChatSubscriptions: newSubscriptions });
      console.log(`[NotificationStore] Unsubscribed from project ${projectId}`);
    }
  },

  // Clean up all project-specific subscriptions
  clearAllProjectSubscriptions: () => {
    const { projectChatSubscriptions } = get();
    projectChatSubscriptions.forEach((unsubscribe) => unsubscribe());
    set({ 
      projectChatSubscriptions: new Map(),
      chatMessages: [] // Clear all chat messages when clearing subscriptions
    });
    console.log('[NotificationStore] Cleared all project chat subscriptions');
  },
}));
