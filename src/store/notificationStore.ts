import { create } from 'zustand';
import { Notification, ChatMessage } from '@/types';

interface NotificationState {
  notifications: Notification[];
  chatMessages: ChatMessage[];
  unreadCount: number;
  
  // Actions
  addNotification: (notification: Partial<Notification>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (userId: string) => void;
  deleteNotification: (id: string) => void;
  clearNotifications: (userId: string) => void;
  getUserNotifications: (userId: string) => Notification[];
  getUnreadCount: (userId: string) => number;
  
  // Chat actions
  sendMessage: (message: Partial<ChatMessage>) => void;
  markMessageAsRead: (messageId: string, userId: string) => void;
  getProjectMessages: (projectId: string) => ChatMessage[];
}

// Generate mock notifications
const generateMockNotifications = (): Notification[] => [
  {
    id: 'notif-1',
    userId: 'admin-1',
    type: 'project_update',
    title: 'New Project Created',
    message: 'A new project "Modern Villa Renovation" has been created.',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    link: '/admin/projects/proj-1',
  },
  {
    id: 'notif-2',
    userId: 'client-1',
    type: 'drawing_status',
    title: 'Drawing Approved',
    message: 'Ground Floor Plan has been approved by the agent.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    link: '/client/projects/proj-1',
  },
  {
    id: 'notif-3',
    userId: 'freelancer-1',
    type: 'agent_check',
    title: 'Agent Check Complete',
    message: 'First Floor Plan check completed with 2 issues found.',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    link: '/freelancer/projects/proj-1',
  },
  {
    id: 'notif-4',
    userId: 'client-1',
    type: 'invoice',
    title: 'New Invoice',
    message: 'Invoice INV-2024-002 for $495 has been generated.',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    link: '/client/invoices',
  },
  {
    id: 'notif-5',
    userId: 'admin-1',
    type: 'system',
    title: 'System Update',
    message: 'Architex Axis has been updated to version 2.0.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
  },
];

// Generate mock chat messages
const generateMockChatMessages = (): ChatMessage[] => [
  {
    id: 'msg-1',
    projectId: 'proj-1',
    senderId: 'client-1',
    content: 'Hi Sarah, can you please update the kitchen layout in the ground floor plan?',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    readBy: ['freelancer-1'],
  },
  {
    id: 'msg-2',
    projectId: 'proj-1',
    senderId: 'freelancer-1',
    content: 'Hi John, sure! I\'ll work on that today and have it ready by tomorrow.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23),
    readBy: ['client-1'],
  },
  {
    id: 'msg-3',
    projectId: 'proj-1',
    senderId: 'freelancer-1',
    content: 'I\'ve uploaded the revised ground floor plan. Please take a look and let me know your thoughts.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
    readBy: ['client-1'],
  },
  {
    id: 'msg-4',
    projectId: 'proj-1',
    senderId: 'client-1',
    content: 'Looks great! The kitchen layout is much better now. Approved!',
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    readBy: [],
  },
];

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: generateMockNotifications(),
  chatMessages: generateMockChatMessages(),
  unreadCount: 0,

  addNotification: (notificationData) => {
    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      userId: notificationData.userId!,
      type: notificationData.type!,
      title: notificationData.title!,
      message: notificationData.message!,
      read: false,
      createdAt: new Date(),
      link: notificationData.link,
      data: notificationData.data,
    };
    
    set(state => ({ 
      notifications: [newNotification, ...state.notifications] 
    }));
  },

  markAsRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllAsRead: (userId) => {
    set(state => ({
      notifications: state.notifications.map(n => 
        n.userId === userId ? { ...n, read: true } : n
      ),
    }));
  },

  deleteNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },

  clearNotifications: (userId) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.userId !== userId),
    }));
  },

  getUserNotifications: (userId) => {
    return get().notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  getUnreadCount: (userId) => {
    return get().notifications.filter(n => n.userId === userId && !n.read).length;
  },

  sendMessage: (messageData) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      projectId: messageData.projectId!,
      senderId: messageData.senderId!,
      content: messageData.content!,
      createdAt: new Date(),
      attachments: messageData.attachments,
      readBy: [messageData.senderId!],
    };
    
    set(state => ({ 
      chatMessages: [...state.chatMessages, newMessage] 
    }));
  },

  markMessageAsRead: (messageId, userId) => {
    set(state => ({
      chatMessages: state.chatMessages.map(m => 
        m.id === messageId && !m.readBy.includes(userId)
          ? { ...m, readBy: [...m.readBy, userId] }
          : m
      ),
    }));
  },

  getProjectMessages: (projectId) => {
    return get().chatMessages
      .filter(m => m.projectId === projectId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  },
}));
