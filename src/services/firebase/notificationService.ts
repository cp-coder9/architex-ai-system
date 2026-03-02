/**
 * Notification Service
 *
 * Handles CRUD operations for user notifications and project chat messages.
 *
 * Collections:
 * - notifications: User notification documents
 * - chatMessages: Project chat message documents
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
  onSnapshot,
  Unsubscribe,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Notification, ChatMessage } from '@/types';

const NOTIFICATIONS_COLLECTION = 'notifications';
const CHAT_MESSAGES_COLLECTION = 'chatMessages';

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

function deserializeNotification(data: Record<string, unknown>, id: string): Notification {
  return {
    id,
    ...data,
    createdAt: timestampToDate(data.createdAt as Timestamp),
  } as Notification;
}

function deserializeChatMessage(data: Record<string, unknown>, id: string): ChatMessage {
  return {
    id,
    ...data,
    createdAt: timestampToDate(data.createdAt as Timestamp),
  } as ChatMessage;
}

// ==================== Notifications ====================

/**
 * Create a notification
 */
export async function createNotification(
  notification: Omit<Notification, 'id' | 'createdAt' | 'read'>
): Promise<Notification> {
  try {
    const notifRef = doc(collection(db!, NOTIFICATIONS_COLLECTION));
    const now = new Date();

    const newNotification: Notification = {
      ...notification,
      id: notifRef.id,
      read: false,
      createdAt: now,
    };

    await setDoc(notifRef, serializeData(newNotification as unknown as Record<string, unknown>));

    return newNotification;
  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
}

/**
 * Get notification by ID
 */
export async function getNotificationById(notificationId: string): Promise<Notification | null> {
  try {
    const notifRef = doc(db!, NOTIFICATIONS_COLLECTION, notificationId);
    const notifSnap = await getDoc(notifRef);

    if (notifSnap.exists()) {
      return deserializeNotification(notifSnap.data(), notifSnap.id);
    }

    return null;
  } catch (error) {
    console.error('[NotificationService] Error fetching notification:', error);
    throw new Error('Failed to fetch notification');
  }
}

/**
 * Get notifications for a user
 */
export async function getNotificationsByUser(
  userId: string,
  limitCount: number = 50
): Promise<Notification[]> {
  try {
    const notifsRef = collection(db!, NOTIFICATIONS_COLLECTION);
    const q = query(
      notifsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => deserializeNotification(doc.data(), doc.id));
  } catch (error) {
    console.error('[NotificationService] Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  try {
    const notifsRef = collection(db!, NOTIFICATIONS_COLLECTION);
    const q = query(
      notifsRef,
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => deserializeNotification(doc.data(), doc.id));
  } catch (error) {
    console.error('[NotificationService] Error fetching unread notifications:', error);
    throw new Error('Failed to fetch unread notifications');
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notifRef = doc(db!, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notifRef, {
      read: true,
    });
  } catch (error) {
    console.error('[NotificationService] Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const notifsRef = collection(db!, NOTIFICATIONS_COLLECTION);
    const q = query(
      notifsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnap = await getDocs(q);

    const updatePromises = querySnap.docs.map((doc) =>
      updateDoc(doc.ref, { read: true })
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('[NotificationService] Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const notifRef = doc(db!, NOTIFICATIONS_COLLECTION, notificationId);
    await deleteDoc(notifRef);
  } catch (error) {
    console.error('[NotificationService] Error deleting notification:', error);
    throw new Error('Failed to delete notification');
  }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string): Promise<void> {
  try {
    const notifsRef = collection(db!, NOTIFICATIONS_COLLECTION);
    const q = query(notifsRef, where('userId', '==', userId));

    const querySnap = await getDocs(q);

    const deletePromises = querySnap.docs.map((doc) => deleteDoc(doc.ref));

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('[NotificationService] Error deleting all notifications:', error);
    throw new Error('Failed to delete all notifications');
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const notifsRef = collection(db!, NOTIFICATIONS_COLLECTION);
    const q = query(
      notifsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnap = await getDocs(q);

    return querySnap.size;
  } catch (error) {
    console.error('[NotificationService] Error counting unread notifications:', error);
    throw new Error('Failed to count unread notifications');
  }
}

// ==================== Chat Messages ====================

/**
 * Send a chat message
 */
export async function sendChatMessage(
  message: Omit<ChatMessage, 'id' | 'createdAt' | 'readBy'>
): Promise<ChatMessage> {
  try {
    const messagesRef = collection(db!, CHAT_MESSAGES_COLLECTION);
    const now = new Date();

    const newMessage: ChatMessage = {
      ...message,
      id: '', // Will be set after creation
      readBy: [message.senderId], // Sender has implicitly read it
      createdAt: now,
    };

    const docRef = await addDoc(messagesRef, {
      ...serializeData(newMessage as unknown as Record<string, unknown>),
      createdAt: serverTimestamp(),
    });

    return {
      ...newMessage,
      id: docRef.id,
    };
  } catch (error) {
    console.error('[NotificationService] Error sending chat message:', error);
    throw new Error('Failed to send chat message');
  }
}

/**
 * Get chat message by ID
 */
export async function getChatMessageById(messageId: string): Promise<ChatMessage | null> {
  try {
    const msgRef = doc(db!, CHAT_MESSAGES_COLLECTION, messageId);
    const msgSnap = await getDoc(msgRef);

    if (msgSnap.exists()) {
      return deserializeChatMessage(msgSnap.data(), msgSnap.id);
    }

    return null;
  } catch (error) {
    console.error('[NotificationService] Error fetching chat message:', error);
    throw new Error('Failed to fetch chat message');
  }
}

/**
 * Get chat messages for a project
 */
export async function getChatMessagesByProject(
  projectId: string,
  limitCount: number = 100
): Promise<ChatMessage[]> {
  try {
    const messagesRef = collection(db!, CHAT_MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('projectId', '==', projectId),
      orderBy('createdAt', 'asc'),
      limit(limitCount)
    );

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => deserializeChatMessage(doc.data(), doc.id));
  } catch (error) {
    console.error('[NotificationService] Error fetching chat messages:', error);
    throw new Error('Failed to fetch chat messages');
  }
}

/**
 * Mark chat message as read by user
 */
export async function markChatMessageAsRead(messageId: string, userId: string): Promise<void> {
  try {
    const msgRef = doc(db!, CHAT_MESSAGES_COLLECTION, messageId);
    const msgSnap = await getDoc(msgRef);

    if (msgSnap.exists()) {
      const data = msgSnap.data();
      const readBy = (data.readBy as string[]) || [];
      if (!readBy.includes(userId)) {
        await updateDoc(msgRef, {
          readBy: [...readBy, userId],
        });
      }
    }
  } catch (error) {
    console.error('[NotificationService] Error marking chat message as read:', error);
    throw new Error('Failed to mark chat message as read');
  }
}

/**
 * Delete chat message
 */
export async function deleteChatMessage(messageId: string): Promise<void> {
  try {
    const msgRef = doc(db!, CHAT_MESSAGES_COLLECTION, messageId);
    await deleteDoc(msgRef);
  } catch (error) {
    console.error('[NotificationService] Error deleting chat message:', error);
    throw new Error('Failed to delete chat message');
  }
}

// ==================== Real-time Subscriptions ====================

/**
 * Subscribe to user's notifications (real-time)
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe {
  const notifsRef = collection(db!, NOTIFICATIONS_COLLECTION);
  const q = query(
    notifsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((doc) =>
        deserializeNotification(doc.data() as Record<string, unknown>, doc.id)
      );
      callback(notifications);
    },
    (error) => {
      console.error('[NotificationService] Error subscribing to notifications:', error);
      callback([]);
    }
  );
}

/**
 * Subscribe to project chat messages (real-time)
 */
export function subscribeToChatMessages(
  projectId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe {
  const messagesRef = collection(db!, CHAT_MESSAGES_COLLECTION);
  const q = query(
    messagesRef,
    where('projectId', '==', projectId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((doc) =>
        deserializeChatMessage(doc.data() as Record<string, unknown>, doc.id)
      );
      callback(messages);
    },
    (error) => {
      console.error('[NotificationService] Error subscribing to chat messages:', error);
      callback([]);
    }
  );
}
