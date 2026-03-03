import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProjectStore } from '@/store';
import { AgentCheck, AgentIssue } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Bot,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Activity,
  Zap,
  RefreshCw,
  Settings,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Shield,
  AlertCircle,
  CheckCircle,
  X,
  Workflow,
  GitBranch,
  Target,
  TrendingUp,
  TrendingDown,
  AlertOctagon,
} from 'lucide-react';
import {
  getAllAgents,
  getOrchestratorStatus,
  getTaskDelegationFlow,
  getConflictResolution,
  getAgentAccuracyMetrics,
  OrchestratorStatus,
  TaskDelegation,
  ConflictResolution,
  AgentAccuracy,
} from '@/lib/agentApi';

// Agent type
interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'paused' | 'error';
  checksToday: number;
  checksTotal: number;
  avgProcessingTime: string;
  accuracy: number;
  lastActive: Date;
  capabilities: string[];
}

// Agent Card Component
function AgentCard({ agent, onView, onToggle }: { agent: Agent; onView: () => void; onToggle: () => void }) {
  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'paused': return 'bg-orange-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Accuracy indicator - green >= 98%, red < 98%
  const accuracyColor = agent.accuracy >= 98 ? 'text-green-600' : 'text-red-600';
  const accuracyBg = agent.accuracy >= 98 ? 'bg-green-100' : 'bg-red-100';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border bg-card hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${getStatusColor(agent.status)}`}>
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">{agent.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{agent.type}</p>
          </div>
        </div>
        <Badge variant={agent.status === 'active' ? 'default' : 'secondary'} className="capitalize">
          {agent.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Checks Today</p>
          <p className="text-lg font-semibold">{agent.checksToday}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Checks</p>
          <p className="text-lg font-semibold">{agent.checksTotal.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Avg Time</p>
          <p className="text-lg font-semibold">{agent.avgProcessingTime}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Accuracy</p>
          <div className={`flex items-center gap-2 ${accuracyColor}`}>
            <p className="text-lg font-semibold">{agent.accuracy}%</p>
            {agent.accuracy >= 98 ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertOctagon className="w-4 h-4" />
            )}
          </div>
          <Progress
            value={agent.accuracy}
            className={`h-1 mt-1 ${accuracyBg}`}
          />
          {agent.accuracy < 98 && (
            <p className="text-xs text-red-500 mt-1">Below 98% threshold</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">Capabilities</p>
        <div className="flex flex-wrap gap-1">
          {agent.capabilities.map((cap, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {cap}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onView}>
          <Eye className="w-4 h-4 mr-2" />
          View
        </Button>
        <Button
          variant={agent.status === 'active' ? 'secondary' : 'default'}
          size="sm"
          className="flex-1"
          onClick={onToggle}
        >
          {agent.status === 'active' ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {agent.status === 'active' ? 'Pause' : 'Start'}
        </Button>
      </div>
    </motion.div>
  );
}

// Orchestrator Panel Component
function OrchestratorPanel() {
  const [status, setStatus] = useState<OrchestratorStatus | null>(null);
  const [tasks, setTasks] = useState<TaskDelegation[]>([]);
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [statusData, tasksData, conflictsData] = await Promise.all([
        getOrchestratorStatus(),
        getTaskDelegationFlow(),
        getConflictResolution(),
      ]);
      setStatus(statusData);
      setTasks(tasksData);
      setConflicts(conflictsData);
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading orchestrator status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="w-5 h-5" />
          Agent Orchestrator
        </CardTitle>
        <CardDescription>Central control system for task delegation and coordination</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Status */}
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Status</span>
              {status?.isActive ? (
                <Badge className="bg-green-500">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <p className="font-semibold">{status?.currentTask || 'Idle'}</p>
          </div>

          {/* Task Queue */}
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Task Queue</span>
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">{status?.taskQueue || 0}</p>
            <p className="text-xs text-muted-foreground">pending</p>
          </div>

          {/* Conflicts */}
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Conflicts</span>
              <GitBranch className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">{status?.conflictsDetected || 0}</p>
            <p className="text-xs text-green-600">
              {status?.conflictsResolved || 0} resolved
            </p>
          </div>

          {/* Accuracy Threshold Alert */}
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Accuracy</span>
              <Target className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{status?.completedTasks || 0}</p>
              <Badge className="bg-green-500 text-white">98%</Badge>
            </div>
            <p className="text-xs text-muted-foreground">threshold</p>
          </div>
        </div>

        {/* Accuracy Alert Banner */}
        <div className="mb-6 p-3 rounded-lg bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span className="font-medium">98% Accuracy Threshold Alert</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            The system requires all agents to maintain a minimum 98% accuracy. Below-threshold agents are highlighted in red.
          </p>
        </div>

        {/* Task Delegation Flow */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Task Delegation Flow
          </h4>
          <div className="space-y-2">
            {tasks.map((task, index) => (
              <div key={task.taskId} className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">Drawing: {task.drawingId}</p>
                  <p className="text-sm text-muted-foreground">
                    {task.assignedAgents.length} agents assigned
                  </p>
                </div>
                <Badge variant={task.status === 'completed' ? 'default' : task.status === 'in_progress' ? 'secondary' : 'outline'}>
                  {task.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Conflict Resolution Status */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Conflict Resolution
          </h4>
          {conflicts.length === 0 ? (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
              <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 dark:text-green-400">No conflicts detected</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conflicts.map((conflict) => (
                <div
                  key={conflict.conflictId}
                  className={`p-3 rounded-lg border ${conflict.status === 'resolved'
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {conflict.status === 'resolved' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        {conflict.issue}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Agents: {conflict.conflictingAgents.join(', ')}
                      </p>
                    </div>
                    <Badge variant={conflict.status === 'resolved' ? 'default' : 'destructive'}>
                      {conflict.status}
                    </Badge>
                  </div>
                  {conflict.resolution && (
                    <p className="text-sm mt-2 text-green-700 dark:text-green-400">
                      Resolution: {conflict.resolution}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Agent Detail Dialog
function AgentDetailDialog({
  agent,
  isOpen,
  onClose,
  onToggle,
}: {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}) {
  if (!agent) return null;

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'paused': return 'bg-orange-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'active': return <Activity className="w-5 h-5 text-green-500" />;
      case 'idle': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'paused': return <Pause className="w-5 h-5 text-orange-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Bot className="w-5 h-5 text-gray-500" />;
    }
  };

  // Mock recent activity data
  const recentActivity = [
    { action: 'Completed compliance check', target: 'FloorPlan_Drawing_v2.dwg', time: '2 minutes ago' },
    { action: 'Validated dimensions', target: 'Site_Plan_Final.dwg', time: '15 minutes ago' },
    { action: 'Detected 3 issues', target: 'Elevation_North.dwg', time: '1 hour ago' },
    { action: 'System health check', target: 'Self-diagnostics', time: '2 hours ago' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getStatusColor(agent.status)}`}>
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <span>{agent.name}</span>
              <p className="text-sm font-normal text-muted-foreground capitalize">{agent.type} Agent</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            View detailed information and performance metrics for this agent
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Banner */}
          <div className={`p-4 rounded-lg border ${agent.status === 'active' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
            agent.status === 'idle' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
              agent.status === 'paused' ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' :
                'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(agent.status)}
                <span className="font-medium capitalize">{agent.status}</span>
              </div>
              <Badge variant={agent.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                {agent.status}
              </Badge>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Performance Metrics
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Checks Today</p>
                <p className="text-2xl font-bold">{agent.checksToday}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Total Checks</p>
                <p className="text-2xl font-bold">{agent.checksTotal.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Avg Processing Time</p>
                <p className="text-2xl font-bold">{agent.avgProcessingTime}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <div className={`flex items-center gap-2 ${agent.accuracy >= 98 ? 'text-green-600' : 'text-red-600'}`}>
                  <p className="text-2xl font-bold">{agent.accuracy}%</p>
                  {agent.accuracy >= 98 ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertOctagon className="w-5 h-5" />
                  )}
                </div>
                {agent.accuracy < 98 && (
                  <p className="text-xs text-red-500 mt-1">Below 98% threshold</p>
                )}
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Capabilities
            </h4>
            <div className="flex flex-wrap gap-2">
              {agent.capabilities.map((cap, i) => (
                <Badge key={i} variant="outline" className="text-sm py-1 px-3">
                  {cap}
                </Badge>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Activity
            </h4>
            <div className="space-y-2">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.target}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuration
            </h4>
            <div className="space-y-2 p-4 rounded-lg bg-muted">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Agent ID</span>
                <span className="text-sm font-mono">{agent.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Active</span>
                <span className="text-sm">{agent.lastActive.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Auto-restart</span>
                <Badge variant="outline" className="text-xs">Enabled</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Log Level</span>
                <Badge variant="outline" className="text-xs">Info</Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant={agent.status === 'active' ? 'secondary' : 'default'}
              className="flex-1"
              onClick={onToggle}
            >
              {agent.status === 'active' ? (
                <><Pause className="w-4 h-4 mr-2" /> Pause Agent</>
              ) : (
                <><Play className="w-4 h-4 mr-2" /> Start Agent</>
              )}
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Issue Detail Dialog
function IssueDetailDialog({
  issue,
  isOpen,
  onClose,
  onOverride
}: {
  issue: AgentIssue | null;
  isOpen: boolean;
  onClose: () => void;
  onOverride: (reason: string) => void;
}) {
  const [overrideReason, setOverrideReason] = useState('');

  if (!issue) return null;

  const getSeverityColor = (severity: AgentIssue['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Issue Details
          </DialogTitle>
          <DialogDescription>
            Review and manage this detected issue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={getSeverityColor(issue.severity)}>
              {issue.severity.toUpperCase()}
            </Badge>
            <Badge variant="outline">{issue.type}</Badge>
          </div>

          <div>
            <Label className="text-sm font-medium">Description</Label>
            <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
          </div>

          {issue.suggestion && (
            <div>
              <Label className="text-sm font-medium">Suggestion</Label>
              <p className="text-sm text-muted-foreground mt-1">{issue.suggestion}</p>
            </div>
          )}

          {issue.location && (
            <div>
              <Label className="text-sm font-medium">Location</Label>
              <p className="text-sm text-muted-foreground mt-1">
                X: {Math.round(issue.location.x)}, Y: {Math.round(issue.location.y)}
              </p>
            </div>
          )}

          {!issue.isResolved && (
            <div>
              <Label className="text-sm font-medium">Override Reason (Optional)</Label>
              <Textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Enter reason for overriding this issue..."
                className="mt-1"
              />
            </div>
          )}

          <div className="flex gap-2">
            {!issue.isResolved && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOverride(overrideReason)}
              >
                <Shield className="w-4 h-4 mr-2" />
                Override Issue
              </Button>
            )}
            <Button variant="default" className="flex-1" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AgentMonitor() {
  const [agents, setAgents] = useState<Agent[]>(() => getAllAgents());
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<AgentIssue | null>(null);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const drawings = useProjectStore(state => state.drawings);

  // Get all agent checks from drawings
  const allChecks = drawings
    .filter(d => d.agentCheck)
    .map(d => d.agentCheck!) as AgentCheck[];

  const allIssues = allChecks.flatMap(check =>
    check.issues.map(issue => ({ ...issue, checkId: check.id }))
  );

  const stats = {
    totalChecks: agents.reduce((sum, a) => sum + a.checksTotal, 0),
    checksToday: agents.reduce((sum, a) => sum + a.checksToday, 0),
    activeAgents: agents.filter(a => a.status === 'active').length,
    avgAccuracy: agents.reduce((sum, a) => sum + a.accuracy, 0) / agents.length,
    totalIssues: allIssues.length,
    resolvedIssues: allIssues.filter(i => i.isResolved).length,
    belowThreshold: agents.filter(a => a.accuracy < 98).length,
  };

  const handleToggleAgent = (agentId: string) => {
    setAgents(agents.map(a => {
      if (a.id === agentId) {
        const newStatus = a.status === 'active' ? 'paused' : 'active';
        toast.success(`${a.name} ${newStatus === 'active' ? 'started' : 'paused'}`);
        return { ...a, status: newStatus };
      }
      return a;
    }));
  };

  const handleOverrideIssue = (reason: string) => {
    if (selectedIssue) {
      toast.success('Issue overridden successfully');
      setIsIssueDialogOpen(false);
      setSelectedIssue(null);
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
        <h1 className="text-3xl font-bold">Agent Monitor</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage AI agents that verify architectural drawings.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Checks</p>
                <p className="text-3xl font-bold">{stats.totalChecks.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Checks Today</p>
                <p className="text-3xl font-bold">{stats.checksToday}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <p className="text-3xl font-bold">{stats.activeAgents}/{agents.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500">
                <Bot className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                <p className="text-3xl font-bold">{stats.avgAccuracy.toFixed(1)}%</p>
              </div>
              <div className={`p-3 rounded-xl ${stats.avgAccuracy >= 98 ? 'bg-green-500' : 'bg-orange-500'}`}>
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Below 98%</p>
                <p className={`text-3xl font-bold ${stats.belowThreshold > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {stats.belowThreshold}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stats.belowThreshold > 0 ? 'bg-red-500' : 'bg-green-500'}`}>
                {stats.belowThreshold > 0 ? (
                  <AlertOctagon className="w-6 h-6 text-white" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-white" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orchestrator">Orchestrator</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="checks">Recent Checks</TabsTrigger>
          <TabsTrigger value="issues">Issues Found</TabsTrigger>
        </TabsList>

        {/* Orchestrator Tab */}
        <TabsContent value="orchestrator">
          <OrchestratorPanel />
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          {/* Below Threshold Alert */}
          {stats.belowThreshold > 0 && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-red-700 dark:text-red-400">
                  {stats.belowThreshold} agent(s) below 98% accuracy threshold
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Review and retrain underperforming agents to meet system requirements.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <AgentCard
                  agent={agent}
                  onView={() => {
                    setSelectedAgent(agent);
                    setIsAgentDialogOpen(true);
                  }}
                  onToggle={() => handleToggleAgent(agent.id)}
                />
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="checks">
          <Card>
            <CardHeader>
              <CardTitle>Recent Agent Checks</CardTitle>
              <CardDescription>Latest drawing verification results</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {allChecks.slice().reverse().map((check, index) => {
                    const drawing = drawings.find(d => d.id === check.drawingId);
                    return (
                      <motion.div
                        key={check.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${check.status === 'completed' ? 'bg-green-100' :
                            check.status === 'overridden' ? 'bg-orange-100' : 'bg-blue-100'
                            }`}>
                            <Bot className={`w-5 h-5 ${check.status === 'completed' ? 'text-green-600' :
                              check.status === 'overridden' ? 'text-orange-600' : 'text-blue-600'
                              }`} />
                          </div>
                          <div>
                            <p className="font-medium">{drawing?.name || 'Unknown Drawing'}</p>
                            <p className="text-sm text-muted-foreground">
                              Score: {check.overallScore}% • {check.issues.length} issues
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={check.status === 'completed' ? 'default' : 'secondary'}>
                            {check.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            {check.completedAt ? new Date(check.completedAt).toLocaleTimeString() : 'In progress'}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Issues Found</CardTitle>
                  <CardDescription>All detected issues across drawings</CardDescription>
                </div>
                <Badge variant="outline">
                  {stats.resolvedIssues}/{stats.totalIssues} Resolved
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {allIssues.map((issue, index) => (
                    <motion.div
                      key={issue.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center justify-between p-4 rounded-lg border ${issue.isResolved ? 'bg-green-50 dark:bg-green-900/20' : ''
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${issue.severity === 'critical' ? 'bg-red-100' :
                          issue.severity === 'high' ? 'bg-orange-100' :
                            issue.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                          }`}>
                          {issue.isResolved ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className={`w-5 h-5 ${issue.severity === 'critical' ? 'text-red-600' :
                              issue.severity === 'high' ? 'text-orange-600' :
                                issue.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                              }`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{issue.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {issue.type} • {issue.severity}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedIssue(issue);
                          setIsIssueDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Agent Detail Dialog */}
      <AgentDetailDialog
        agent={selectedAgent}
        isOpen={isAgentDialogOpen}
        onClose={() => {
          setIsAgentDialogOpen(false);
          setSelectedAgent(null);
        }}
        onToggle={() => {
          if (selectedAgent) {
            handleToggleAgent(selectedAgent.id);
            setSelectedAgent(prev => prev ? { ...prev, status: prev.status === 'active' ? 'paused' : 'active' } : null);
          }
        }}
      />

      {/* Issue Detail Dialog */}
      <IssueDetailDialog
        issue={selectedIssue}
        isOpen={isIssueDialogOpen}
        onClose={() => {
          setIsIssueDialogOpen(false);
          setSelectedIssue(null);
        }}
        onOverride={handleOverrideIssue}
      />
    </div>
  );
}
