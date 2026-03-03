import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useProjectStore, useNotificationStore, useSettingsStore } from '@/store';
import { Project, Notification } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  MessageSquare,
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Search,
  Clock,
  CheckCheck,
  Check,
  Building2,
  Users,
  Bell,
  Filter,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Plus,
  FolderKanban,
  Bot,
  FileText,
  Trash2,
} from 'lucide-react';

// Notification type options for filtering
const notificationTypes = [
  { value: 'all', label: 'All Types', icon: Bell },
  { value: 'project_update', label: 'Project Updates', icon: FolderKanban },
  { value: 'drawing_status', label: 'Drawing Status', icon: CheckCircle2 },
  { value: 'agent_check', label: 'Agent Checks', icon: Bot },
  { value: 'invoice', label: 'Invoices', icon: FileText },
  { value: 'message', label: 'Messages', icon: MessageSquare },
  { value: 'system', label: 'System', icon: Info },
];

// Get icon for notification type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'project_update': return FolderKanban;
    case 'drawing_status': return CheckCircle2;
    case 'agent_check': return Bot;
    case 'invoice': return FileText;
    case 'message': return MessageSquare;
    case 'system': return Info;
    default: return Bell;
  }
};

// Get color for notification type
const getNotificationColor = (type: string) => {
  switch (type) {
    case 'project_update': return 'bg-blue-500';
    case 'drawing_status': return 'bg-green-500';
    case 'agent_check': return 'bg-purple-500';
    case 'invoice': return 'bg-orange-500';
    case 'message': return 'bg-indigo-500';
    case 'system': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
};

// Get badge variant for notification type
const getNotificationBadgeVariant = (type: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (type) {
    case 'project_update': return 'default';
    case 'drawing_status': return 'secondary';
    case 'agent_check': return 'default';
    case 'invoice': return 'destructive';
    case 'message': return 'secondary';
    case 'system': return 'outline';
    default: return 'secondary';
  }
};

export function AdminMessages() {
  const { currentUser } = useAuthStore();
  const notifications = useNotificationStore(state => state.notifications);
  const chatMessages = useNotificationStore(state => state.chatMessages);
  const sendMessage = useNotificationStore(state => state.sendMessage);
  const markAsRead = useNotificationStore(state => state.markAsRead);
  const markAllAsRead = useNotificationStore(state => state.markAllAsRead);
  const deleteNotification = useNotificationStore(state => state.deleteNotification);
  const getUserNotifications = useNotificationStore(state => state.getUserNotifications);
  const allProjects = useProjectStore(state => state.projects);
  const users = useSettingsStore(state => state.users);

  const userId = currentUser?.id || '';

  // Chats state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [notificationFilter, setNotificationFilter] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Get admin notifications
  const adminNotifications = useMemo(() => {
    const filtered = getUserNotifications(userId);
    if (notificationFilter === 'all') return filtered;
    return filtered.filter(n => n.type === notificationFilter);
  }, [getUserNotifications, userId, notificationFilter]);

  const filteredNotifications = useMemo(() => {
    if (showUnreadOnly) {
      return adminNotifications.filter(n => !n.read);
    }
    return adminNotifications;
  }, [adminNotifications, showUnreadOnly]);

  const unreadCount = adminNotifications.filter(n => !n.read).length;

  // Get all projects with recent chat activity
  const projectsWithChats = useMemo(() => {
    // Get unique project IDs from chat messages
    const projectIdsWithMessages = new Set(chatMessages.map(m => m.projectId));

    // Filter projects that have messages
    return allProjects.filter(p => projectIdsWithMessages.has(p.id));
  }, [allProjects, chatMessages]);

  // Filter projects based on search
  const filteredProjects = useMemo(() => {
    if (!chatSearchQuery.trim()) return projectsWithChats;

    const query = chatSearchQuery.toLowerCase();
    return projectsWithChats.filter(p => {
      const client = getUserInfo(p.clientId);
      const freelancer = p.freelancerId ? getUserInfo(p.freelancerId) : null;

      return (
        (p.name || '').toLowerCase().includes(query) ||
        (client.name || '').toLowerCase().includes(query) ||
        (freelancer && (freelancer.name || '').toLowerCase().includes(query))
      );
    });
  }, [projectsWithChats, chatSearchQuery]);

  // Get messages for selected project
  const projectMessages = useMemo(() => {
    if (!selectedProject) return [];
    return chatMessages
      .filter(m => m.projectId === selectedProject.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [chatMessages, selectedProject]);

  // Get user info helper
  const getUserInfo = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user || { name: 'Unknown User', avatar: '', id: userId };
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [projectMessages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedProject) return;

    sendMessage({
      projectId: selectedProject.id,
      senderId: currentUser?.id || '',
      content: messageInput,
    });

    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead(userId);
    toast.success('All notifications marked as read');
  };

  const handleDeleteNotification = (id: string) => {
    deleteNotification(id);
    toast.success('Notification deleted');
  };

  const handleMarkNotificationAsRead = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  // Get last message preview for a project
  const getLastMessagePreview = (projectId: string) => {
    const messages = chatMessages
      .filter(m => m.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (messages.length === 0) return null;
    return messages[0];
  };

  // Get unread count for a project
  const getProjectUnreadCount = (projectId: string) => {
    return chatMessages.filter(
      m => m.projectId === projectId && !m.readBy.includes(userId) && m.senderId !== userId
    ).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Messages & Notifications</h1>
        <p className="text-muted-foreground mt-1">
          Manage communications and stay updated with system notifications.
        </p>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="chats" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="chats" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Chats
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Chats Tab */}
        <TabsContent value="chats" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-320px)]">
            {/* Conversations List */}
            <Card className="lg:col-span-1 flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Conversations
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNewMessageDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-[calc(100%-20px)]">
                  <div className="space-y-1 p-4 pt-0">
                    {filteredProjects.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground text-sm">
                          {chatSearchQuery ? 'No conversations found' : 'No active conversations'}
                        </p>
                      </div>
                    ) : (
                      filteredProjects.map((project) => {
                        const client = getUserInfo(project.clientId);
                        const freelancer = project.freelancerId ? getUserInfo(project.freelancerId) : null;
                        const lastMessage = getLastMessagePreview(project.id);
                        const unreadCount = getProjectUnreadCount(project.id);

                        return (
                          <button
                            key={project.id}
                            onClick={() => setSelectedProject(project)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${selectedProject?.id === project.id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                              }`}
                          >
                            <div className="relative">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={client.avatar} />
                                <AvatarFallback>{(client.name || '?').charAt(0)}</AvatarFallback>
                              </Avatar>
                              {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{client.name}</p>
                                {lastMessage && (
                                  <span className={`text-xs ${selectedProject?.id === project.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                    {new Date(lastMessage.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs truncate ${selectedProject?.id === project.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {project.name}
                              </p>
                              {lastMessage && (
                                <p className={`text-xs truncate mt-0.5 ${selectedProject?.id === project.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                  {lastMessage.content.substring(0, 30)}
                                  {lastMessage.content.length > 30 ? '...' : ''}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-2 flex flex-col">
              {selectedProject ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getUserInfo(selectedProject.clientId).avatar} />
                          <AvatarFallback>
                            {(getUserInfo(selectedProject.clientId).name || '?').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {getUserInfo(selectedProject.clientId).name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <CardDescription className="text-xs">
                              {selectedProject.name}
                            </CardDescription>
                            <Badge variant="outline" className="text-xs">
                              {selectedProject.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedProject.freelancerId && (
                          <div className="flex items-center gap-2 mr-4">
                            <span className="text-xs text-muted-foreground">Freelancer:</span>
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={getUserInfo(selectedProject.freelancerId).avatar} />
                              <AvatarFallback className="text-xs">
                                {(getUserInfo(selectedProject.freelancerId).name || '?').charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                        <Button variant="ghost" size="icon">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Video className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-[calc(100%-140px)] p-4">
                      <div className="space-y-4">
                        <AnimatePresence>
                          {projectMessages.map((message) => {
                            const isMe = message.senderId === currentUser?.id;
                            const sender = getUserInfo(message.senderId);

                            return (
                              <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
                                  {!isMe && (
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={sender.avatar} />
                                      <AvatarFallback>{(sender.name || '?').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                  )}
                                  <div
                                    className={`px-4 py-2 rounded-2xl ${isMe
                                        ? 'bg-primary text-primary-foreground rounded-br-none'
                                        : 'bg-muted rounded-bl-none'
                                      }`}
                                  >
                                    {!isMe && (
                                      <p className={`text-xs font-medium mb-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                        {sender.name}
                                      </p>
                                    )}
                                    <p className="text-sm">{message.content}</p>
                                    <p className={`text-xs mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      {isMe && (
                                        <span className="ml-2">
                                          {message.readBy.length > 1 ? (
                                            <CheckCheck className="w-3 h-3 inline" />
                                          ) : (
                                            <Check className="w-3 h-3 inline" />
                                          )}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </CardContent>

                  {/* Input Area */}
                  <CardContent className="border-t p-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Paperclip className="w-5 h-5" />
                      </Button>
                      <Input
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                      />
                      <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <MessageSquare className="w-12 h-12" />
                      </EmptyMedia>
                      <EmptyTitle>No conversation selected</EmptyTitle>
                      <EmptyDescription>Select a conversation from the list to view messages</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </CardContent>
              )}
            </Card>
          </div>

          {/* New Message Dialog */}
          {showNewMessageDialog && (
            <Card className="fixed inset-0 z-50 m-auto h-fit w-full max-w-md max-h-[80vh] overflow-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Start New Conversation</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowNewMessageDialog(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>Select a project to start messaging</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {allProjects.map((project) => {
                      const client = getUserInfo(project.clientId);
                      return (
                        <button
                          key={project.id}
                          onClick={() => {
                            setSelectedProject(project);
                            setShowNewMessageDialog(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={client.avatar} />
                            <AvatarFallback>{(client.name || '?').charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{project.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Client: {client.name}
                            </p>
                          </div>
                          <Badge variant="outline">{project.status}</Badge>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Center
                  </CardTitle>
                  <CardDescription>
                    {unreadCount > 0
                      ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                      : 'All caught up! No unread notifications'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark All as Read
                    </Button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Select value={notificationFilter} onValueChange={setNotificationFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant={showUnreadOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                >
                  {showUnreadOnly ? 'Showing Unread Only' : 'Show All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredNotifications.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Bell className="w-12 h-12" />
                    </EmptyMedia>
                    <EmptyTitle>No notifications</EmptyTitle>
                    <EmptyDescription>
                      {showUnreadOnly
                        ? "You don't have any unread notifications"
                        : notificationFilter !== 'all'
                          ? `No ${notificationTypes.find(t => t.value === notificationFilter)?.label.toLowerCase()} notifications`
                          : "You don't have any notifications yet"}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    <AnimatePresence>
                      {filteredNotifications.map((notification, index) => {
                        const Icon = getNotificationIcon(notification.type);
                        const colorClass = getNotificationColor(notification.type);

                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className={`group flex items-start gap-3 p-4 rounded-lg border transition-colors ${notification.read
                                ? 'bg-background hover:bg-muted/50'
                                : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                              }`}
                          >
                            <div className={`p-2 rounded-lg shrink-0 ${colorClass}`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className={`font-medium text-sm ${!notification.read ? 'text-foreground' : ''}`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                                      {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <Badge variant={getNotificationBadgeVariant(notification.type)} className="text-xs">
                                      {notification.type.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!notification.read && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleMarkNotificationAsRead(notification)}
                                      title="Mark as read"
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteNotification(notification.id)}
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
