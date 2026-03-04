import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useProjectStore, useNotificationStore, useSettingsStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  CheckCheck,
  Check,
} from 'lucide-react';

export function ClientMessages() {
  const { currentUser } = useAuthStore();
  const { chatMessages, sendMessage, subscribeToProjectChat, unsubscribeFromProjectChat } = useNotificationStore();
  const allProjects = useProjectStore(state => state.projects);
  const getUserById = useSettingsStore(state => state.getUserById);
  const projects = useMemo(() => allProjects.filter(p => p.clientId === currentUser?.id), [allProjects, currentUser?.id]);

  const userId = currentUser?.id || '';

  const [selectedProject, setSelectedProject] = useState(projects[0]);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get messages for selected project
  const projectMessages = chatMessages.filter(m => m.projectId === selectedProject?.id);

  // Get freelancer info for the selected project
  const freelancerInfo = useMemo(() => {
    if (!selectedProject?.freelancerId) return null;
    return getUserById(selectedProject.freelancerId);
  }, [selectedProject, getUserById]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [projectMessages]);

  // Subscribe to project chat
  useEffect(() => {
    if (selectedProject?.id) {
      subscribeToProjectChat(selectedProject.id, userId);
    }
    return () => {
      if (selectedProject?.id) {
        unsubscribeFromProjectChat(selectedProject.id);
      }
    };
  }, [selectedProject?.id, userId, subscribeToProjectChat, unsubscribeFromProjectChat]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-1">
          Communicate with your project team.
        </p>
      </motion.div>

      {/* Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        {/* Projects List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Projects
            </CardTitle>
            <CardDescription>Select a project to chat</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100%-80px)]">
              <div className="space-y-1 p-4">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${selectedProject?.id === project.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                      }`}
                  >
                     <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                       <span className="font-bold text-sm">
                         {(project.name || '?').charAt(0)}
                       </span>
                     </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{project.name}</p>
                      <p className="text-xs opacity-70 truncate">
                        {project.freelancerId ? 'Active conversation' : 'No messages yet'}
                      </p>
                    </div>
                  </button>
                ))}
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
                         <AvatarImage src={freelancerInfo?.avatar || ''} />
                         <AvatarFallback>{(freelancerInfo?.name || 'F').charAt(0)}</AvatarFallback>
                       </Avatar>
                    <div>
                      <CardTitle className="text-base">{freelancerInfo?.name || 'Unassigned'}</CardTitle>
                      <CardDescription className="text-xs">
                        {selectedProject.name}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                                  <AvatarImage src={freelancerInfo?.avatar || ''} />
                                  <AvatarFallback>{(freelancerInfo?.name || 'F').charAt(0)}</AvatarFallback>
                                </Avatar>
                              )}
                              <div
                                className={`px-4 py-2 rounded-2xl ${isMe
                                    ? 'bg-primary text-primary-foreground rounded-br-none'
                                    : 'bg-muted rounded-bl-none'
                                  }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <p className={`text-xs mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {isMe && (
                                    <span className="ml-2">
                                      {message.readBy.length > 1 ? <CheckCheck className="w-3 h-3 inline" /> : <Check className="w-3 h-3 inline" />}
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
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a project to start chatting</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
