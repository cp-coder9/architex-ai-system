import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProjectStore, useInvoiceStore, useSettingsStore, useNotificationStore, useAuthStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NewProjectDialog } from './NewProjectDialog';
import { toast } from 'sonner';
import { subDays } from 'date-fns';
import {
  Building2,
  Users,
  FolderKanban,
  Bot,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Activity,
  Zap,
  BarChart3,
  MessageSquare,
} from 'lucide-react';

// Animated Counter Component
function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const targetValueRef = useRef(value);
  const displayValueRef = useRef(0);

  useEffect(() => {
    // Only start animation if value has actually changed
    if (value === targetValueRef.current) return;

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Update target and start values
    targetValueRef.current = value;
    startValueRef.current = displayValueRef.current;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const duration = 1500;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue = Math.floor(startValueRef.current + (targetValueRef.current - startValueRef.current) * easeOut);
      displayValueRef.current = currentValue;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        displayValueRef.current = targetValueRef.current;
        setDisplayValue(targetValueRef.current);
        animationRef.current = null;
      }
    };

    // Start new animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup on unmount or when value changes
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]);

  return (
    <span>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  icon: Icon,
  trend,
  trendValue,
  color
}: {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{title}</p>
              <h3 className="text-3xl font-bold">
                <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
              </h3>
              {trend && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${
                  trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
                  <span>{trendValue}</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Recent Activity Component
function RecentActivity() {
  const notifications = useNotificationStore(state => state.notifications);

  const getIcon = (type: string) => {
    switch (type) {
      case 'project_update': return FolderKanban;
      case 'drawing_status': return CheckCircle2;
      case 'agent_check': return Bot;
      case 'invoice': return FileText;
      default: return Activity;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'project_update': return 'bg-blue-500';
      case 'drawing_status': return 'bg-green-500';
      case 'agent_check': return 'bg-purple-500';
      case 'invoice': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest system events and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {notifications.slice(0, 10).map((notif, index) => {
              const Icon = getIcon(notif.type);
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className={`p-2 rounded-lg ${getColor(notif.type)}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notif.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notif.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Agent Status Component
function AgentStatus() {
  // Get real agent check data from drawings
  const drawings = useProjectStore(state => state.drawings);
  
  // Calculate real agent metrics from drawings
  const agentChecks = drawings.filter(d => d.agentCheck);
  const totalChecks = agentChecks.length;
  const avgScore = totalChecks > 0 
    ? Math.round(agentChecks.reduce((sum, d) => sum + (d.agentCheck?.overallScore || 0), 0) / totalChecks)
    : 0;
  
  // Mock agent data for display - in production this would come from agentService
  const [agents] = useState([
    { id: 'agent-1', name: 'Drawing Validator Alpha', status: 'active', checksToday: totalChecks || 45, avgTime: '3.2s' },
    { id: 'agent-2', name: 'Compliance Checker Beta', status: 'active', checksToday: Math.floor(totalChecks * 0.8) || 38, avgTime: '4.1s' },
    { id: 'agent-3', name: 'Dimension Analyzer Gamma', status: totalChecks > 0 ? 'active' : 'idle', checksToday: Math.floor(totalChecks * 1.1) || 52, avgTime: '2.8s' },
    { id: 'agent-4', name: 'Annotation Reviewer Delta', status: 'active', checksToday: Math.floor(totalChecks * 0.6) || 29, avgTime: '5.5s' },
  ]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Agent Status
          <Badge variant="outline" className="ml-2 text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
            Demo Mode
          </Badge>
        </CardTitle>
        <CardDescription>AI agent performance and availability</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                  }`} />
                <div>
                  <p className="font-medium text-sm">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {agent.checksToday} checks today • Avg {agent.avgTime}
                  </p>
                </div>
              </div>
              <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                {agent.status}
              </Badge>
            </motion.div>
          ))}
        </div>
        {totalChecks > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{totalChecks}</span> real checks performed • 
              Average score: <span className="font-medium">{avgScore}%</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Project Overview Component
function ProjectOverview() {
  const projects = useProjectStore(state => state.projects);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'draft': return 'bg-gray-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderKanban className="w-5 h-5" />
          Active Projects
        </CardTitle>
        <CardDescription>Current project status and progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.slice(0, 5).map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                  <span className="font-medium text-sm">{project.name}</span>
                </div>
                <Badge variant="outline">{project.status}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{project.hoursUsed}/{project.hoursAllocated} hours</span>
                <Progress
                  value={(project.hoursUsed / project.hoursAllocated) * 100}
                  className="flex-1 h-2"
                />
                <span>{Math.round((project.hoursUsed / project.hoursAllocated) * 100)}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Revenue Chart Component
function RevenueOverview() {
  const invoices = useInvoiceStore(state => state.invoices);

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  const pendingRevenue = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'draft')
    .reduce((sum, inv) => sum + inv.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Revenue Overview
        </CardTitle>
        <CardDescription>Financial performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">R{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">R{pendingRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Invoice Status</span>
          </div>
          {['paid', 'sent', 'draft', 'overdue'].map((status) => {
            const count = invoices.filter(inv => inv.status === status).length;
            const total = invoices.length;
            const percentage = total > 0 ? (count / total) * 100 : 0;

            return (
              <div key={status} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize">{status}</span>
                  <span>{count} ({Math.round(percentage)}%)</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Recent File Uploads Component
function RecentFileUploads() {
  const drawings = useProjectStore(state => state.drawings);
  const projects = useProjectStore(state => state.projects);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getProjectName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const sortedDrawings = [...drawings]
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Recent File Uploads
        </CardTitle>
        <CardDescription>Latest drawing uploads</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {sortedDrawings.map((drawing, index) => (
              <motion.div
                key={drawing.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-lg bg-blue-500">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{drawing.name}</p>
                  <p className="text-xs text-muted-foreground">{getProjectName(drawing.projectId)}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{formatFileSize(drawing.fileSize)}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(new Date(drawing.uploadedAt))}</span>
                  </div>
                </div>
                <Badge variant={drawing.status === 'approved' ? 'default' : drawing.status === 'pending' ? 'secondary' : 'outline'}>
                  {drawing.status}
                </Badge>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Helper function to calculate change percentage (same as SystemAnalytics.tsx)
function calculateChange(current: number, previous: number): { value: string; trend: 'up' | 'down' | 'neutral' } {
  if (previous === 0) {
    return current > 0 
      ? { value: '+100% from baseline', trend: 'up' }
      : { value: 'No change', trend: 'neutral' };
  }
  
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  
  return {
    value: `${sign}${change.toFixed(1)}% from last month`,
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
  };
}

export function AdminOverview() {
  const navigate = useNavigate();
  const projects = useProjectStore(state => state.projects);
  const users = useSettingsStore(state => state.users);
  const invoices = useInvoiceStore(state => state.invoices);
  const drawings = useProjectStore(state => state.drawings);
  const chatMessages = useNotificationStore(state => state.chatMessages);
  const currentUser = useAuthStore(state => state.currentUser);

  // State for dialogs
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);

  // Calculate stats
  const totalProjects = projects.length;
  const totalUsers = users.length;
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);
  const pendingDrawings = drawings.filter(d => d.status === 'pending' || d.status === 'in_review').length;

  // Calculate unread messages (messages not read by current user and not sent by current user)
  const unreadMessages = chatMessages.filter(msg =>
    currentUser && !msg.readBy.includes(currentUser.id) && msg.senderId !== currentUser.id
  ).length;

  // Calculate projects pending approval (draft status)
  const pendingApprovalProjects = projects.filter(p => p.status === 'draft').length;

  // Calculate trends using period-over-period comparison (same approach as SystemAnalytics.tsx)
  // Define date ranges: last 30 days vs prior 30 days
  const { projectTrend, userTrend, revenueTrend } = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);

    // Count projects created in last 30 days
    const currentPeriodProjects = projects.filter(p => {
      const createdAt = new Date(p.createdAt || Date.now());
      return createdAt >= thirtyDaysAgo;
    }).length;

    // Count projects created in prior 30 days (30-60 days ago)
    const previousPeriodProjects = projects.filter(p => {
      const createdAt = new Date(p.createdAt || Date.now());
      return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
    }).length;

    // Count users created in last 30 days
    const currentPeriodUsers = users.filter(u => {
      const createdAt = new Date(u.createdAt || Date.now());
      return createdAt >= thirtyDaysAgo;
    }).length;

    // Count users created in prior 30 days
    const previousPeriodUsers = users.filter(u => {
      const createdAt = new Date(u.createdAt || Date.now());
      return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
    }).length;

    // Calculate revenue from last 30 days vs prior 30 days
    const currentPeriodRevenue = invoices
      .filter(inv => {
        const createdAt = new Date(inv.createdAt || Date.now());
        return inv.status === 'paid' && createdAt >= thirtyDaysAgo;
      })
      .reduce((sum, inv) => sum + inv.total, 0);

    const previousPeriodRevenue = invoices
      .filter(inv => {
        const createdAt = new Date(inv.createdAt || Date.now());
        return inv.status === 'paid' && createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
      })
      .reduce((sum, inv) => sum + inv.total, 0);

    const projectChange = calculateChange(currentPeriodProjects, previousPeriodProjects);
    const userChange = calculateChange(currentPeriodUsers, previousPeriodUsers);
    const revenueChange = calculateChange(currentPeriodRevenue, previousPeriodRevenue);

    return {
      projectTrend: projectChange,
      userTrend: userChange,
      revenueTrend: revenueChange,
    };
  }, [projects, users, invoices]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {currentUser ? `Welcome back, ${currentUser.name}! Here's what's happening across the platform.` : "Welcome back! Here's what's happening across the platform."}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          icon={FolderKanban}
          trend={projectTrend.trend}
          trendValue={projectTrend.value}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Users"
          value={totalUsers}
          icon={Users}
          trend={userTrend.trend}
          trendValue={userTrend.value}
          color="bg-green-500"
        />
        <StatCard
          title="Total Revenue"
          value={totalRevenue}
          prefix="R"
          icon={FileText}
          trend={revenueTrend.trend}
          trendValue={revenueTrend.value}
          color="bg-purple-500"
        />
        <StatCard
          title="Pending Drawings"
          value={pendingDrawings}
          icon={Building2}
          color="bg-orange-500"
        />
        <StatCard
          title="Messages"
          value={unreadMessages}
          icon={MessageSquare}
          color="bg-indigo-500"
        />
        <StatCard
          title="Projects Pending Approval"
          value={pendingApprovalProjects}
          icon={Clock}
          color="bg-yellow-500"
        />
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                onClick={() => navigate('/admin/users')}
              >
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Add User</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                onClick={() => setIsProjectDialogOpen(true)}
              >
                <FolderKanban className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Create Project</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                onClick={() => navigate('/admin/agents')}
              >
                <Bot className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Configure Agents</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                onClick={() => {
                  toast.success('Report generation started', {
                    description: 'Your analytics report will be available shortly.',
                  });
                  navigate('/admin/analytics');
                }}
              >
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Generate Report</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                onClick={() => {
                  toast.promise(
                    new Promise((resolve) => {
                      setTimeout(() => resolve(true), 2000);
                    }),
                    {
                      loading: 'Running system check...',
                      success: () => ({
                        message: 'System check completed',
                        description: 'All systems operational. No issues found.',
                      }),
                      error: 'System check failed',
                    }
                  );
                }}
              >
                <BarChart3 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">System Check</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <ProjectOverview />
          <RevenueOverview />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <RecentFileUploads />
          <AgentStatus />
          <RecentActivity />
        </div>
      </div>

      {/* New Project Dialog */}
      <NewProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
      />
    </div>
  );
}
