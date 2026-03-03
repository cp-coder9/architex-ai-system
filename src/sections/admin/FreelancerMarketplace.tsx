import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTaskStore, useAuthStore } from '@/store';
import { Task, TaskApplication, TaskMilestone } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Briefcase,
  Search,
  Plus,
  Clock,
  DollarSign,
  Calendar,
  User,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  MoreHorizontal,
  Wrench,
  Filter,
  FileText,
  ArrowRightCircle,
} from 'lucide-react';

// Task status colors
const getStatusColor = (status: Task['status']) => {
  switch (status) {
    case 'open': return 'bg-green-500';
    case 'in_progress': return 'bg-blue-500';
    case 'completed': return 'bg-purple-500';
    case 'draft': return 'bg-gray-500';
    case 'cancelled': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getStatusIcon = (status: Task['status']) => {
  switch (status) {
    case 'open': return <Briefcase className="w-4 h-4" />;
    case 'in_progress': return <Clock className="w-4 h-4" />;
    case 'completed': return <CheckCircle2 className="w-4 h-4" />;
    case 'draft': return <FileText className="w-4 h-4" />;
    case 'cancelled': return <XCircle className="w-4 h-4" />;
    default: return <Briefcase className="w-4 h-4" />;
  }
};

// Application status colors
const getApplicationStatusColor = (status: TaskApplication['status']) => {
  switch (status) {
    case 'pending': return 'bg-yellow-500';
    case 'accepted': return 'bg-green-500';
    case 'rejected': return 'bg-red-500';
    case 'withdrawn': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
};

// Experience level badge
const getExperienceBadge = (level: Task['experienceLevel']) => {
  const colors: Record<Task['experienceLevel'], string> = {
    entry: 'bg-green-500',
    intermediate: 'bg-blue-500',
    expert: 'bg-purple-500',
  };
  return colors[level] || 'bg-gray-500';
};

// Task Table Component
function TaskTable({
  tasks,
  onViewApplications,
}: {
  tasks: Task[];
  onViewApplications: (task: Task) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Skills</TableHead>
          <TableHead>Budget</TableHead>
          <TableHead>Deadline</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task, index) => (
          <motion.tr
            key={task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border-b hover:bg-muted/50 transition-colors"
          >
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{task.title}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {task.description.substring(0, 50)}...
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{task.category}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {task.requiredSkills.slice(0, 2).map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {task.requiredSkills.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{task.requiredSkills.length - 2}
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-muted-foreground" />
                  R{task.budget.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">
                  R{task.hourlyRate}/hr • {task.estimatedHours}h
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  {new Date(task.deadline).toLocaleDateString()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {Math.ceil((new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={`${getStatusColor(task.status)} text-white gap-1`}>
                {getStatusIcon(task.status)}
                {task.status.replace('_', ' ')}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewApplications(task)}
              >
                <Eye className="w-3 h-3 mr-2" />
                View Applications
              </Button>
            </TableCell>
          </motion.tr>
        ))}
      </TableBody>
    </Table>
  );
}

// Applications Table Component
function ApplicationsTable({
  applications,
  taskTitle,
  onAccept,
  onReject,
}: {
  applications: TaskApplication[];
  taskTitle: string;
  onAccept: (application: TaskApplication) => void;
  onReject: (application: TaskApplication) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Freelancer</TableHead>
          <TableHead>Proposed Rate</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>Applied</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8">
              <div className="flex flex-col items-center text-muted-foreground">
                <Users className="w-8 h-8 mb-2" />
                <p>No applications for this task</p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          applications.map((application, index) => (
            <motion.tr
              key={application.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b hover:bg-muted/50 transition-colors"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">Freelancer {application.freelancerId}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {application.coverLetter.substring(0, 40)}...
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-muted-foreground" />
                  R{application.proposedRate}/hr
                </span>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  {application.estimatedDuration}h
                </span>
              </TableCell>
              <TableCell>
                {new Date(application.proposedStartDate).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{new Date(application.appliedAt).toLocaleDateString()}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(application.appliedAt).toLocaleTimeString()}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={`${getApplicationStatusColor(application.status)} text-white gap-1`}>
                  {application.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {application.status === 'pending' && (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => onAccept(application)}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => onReject(application)}
                    >
                      <XCircle className="w-3 h-3" />
                      Reject
                    </Button>
                  </div>
                )}
                {application.status === 'accepted' && (
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Assigned
                  </Badge>
                )}
                {application.status === 'rejected' && (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <XCircle className="w-3 h-3" />
                    Not Selected
                  </Badge>
                )}
              </TableCell>
            </motion.tr>
          ))
        )}
      </TableBody>
    </Table>
  );
}

// New Task Dialog Form
function NewTaskForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (task: Omit<Task, 'id' | 'postedAt' | 'status' | 'milestones'>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<Task['experienceLevel']>('intermediate');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      category,
      requiredSkills: requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
      experienceLevel,
      estimatedHours: parseInt(estimatedHours),
      hourlyRate: parseInt(hourlyRate),
      budget: parseInt(budget),
      deadline,
      postedBy: 'admin-1',
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="title">Task Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the task requirements"
            rows={3}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Architecture">Architecture</SelectItem>
                <SelectItem value="Structural">Structural</SelectItem>
                <SelectItem value="Electrical">Electrical</SelectItem>
                <SelectItem value="Plumbing">Plumbing</SelectItem>
                <SelectItem value="Fire Safety">Fire Safety</SelectItem>
                <SelectItem value="Accessibility">Accessibility</SelectItem>
                <SelectItem value="Energy">Energy</SelectItem>
                <SelectItem value="Drainage">Drainage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="experience">Experience Level</Label>
            <Select value={experienceLevel} onValueChange={(v) => setExperienceLevel(v as Task['experienceLevel'])}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entry</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="skills">Required Skills (comma separated)</Label>
          <Input
            id="skills"
            value={requiredSkills}
            onChange={(e) => setRequiredSkills(e.target.value)}
            placeholder="AutoCAD, Revit, SANS 10400"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hours">Estimated Hours</Label>
            <Input
              id="hours"
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              placeholder="20"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">Hourly Rate (R)</Label>
            <Input
              id="rate"
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Total Budget (R)</Label>
            <Input
              id="budget"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="10000"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Plus className="w-4 h-4 mr-2" />
          Post Task
        </Button>
      </DialogFooter>
    </form>
  );
}

// Application Detail Dialog
function ApplicationDetailDialog({
  application,
  taskTitle,
  onClose,
}: {
  application: TaskApplication;
  taskTitle: string;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold">Freelancer {application.freelancerId}</h3>
          <p className="text-sm text-muted-foreground">Applied on {new Date(application.appliedAt).toLocaleDateString()}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Task</p>
          <p className="font-medium">{taskTitle}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <Badge className={`${getApplicationStatusColor(application.status)} text-white mt-1`}>
            {application.status}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Proposed Rate</p>
          <p className="font-medium">R{application.proposedRate}/hr</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Estimated Duration</p>
          <p className="font-medium">{application.estimatedDuration} hours</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Proposed Start Date</p>
          <p className="font-medium">{new Date(application.proposedStartDate).toLocaleDateString()}</p>
        </div>
        {application.respondedAt && (
          <div>
            <p className="text-sm text-muted-foreground">Responded</p>
            <p className="font-medium">{new Date(application.respondedAt).toLocaleDateString()}</p>
          </div>
        )}
      </div>
      
      <div>
        <p className="text-sm text-muted-foreground mb-2">Cover Letter</p>
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm">{application.coverLetter}</p>
        </div>
      </div>
      
      {application.adminNotes && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Admin Notes</p>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">{application.adminNotes}</p>
          </div>
        </div>
      )}
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </div>
  );
}

// Task Detail Dialog
function TaskDetailDialog({ task }: { task: Task }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{task.title}</h3>
        <p className="text-muted-foreground mt-1">{task.description}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Category</p>
          <Badge variant="outline" className="mt-1">{task.category}</Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Experience Level</p>
          <Badge className={`${getExperienceBadge(task.experienceLevel)} text-white mt-1`}>
            {task.experienceLevel}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Budget</p>
          <p className="font-medium">R{task.budget.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Hourly Rate</p>
          <p className="font-medium">R{task.hourlyRate}/hr</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Estimated Hours</p>
          <p className="font-medium">{task.estimatedHours} hours</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Deadline</p>
          <p className="font-medium">{new Date(task.deadline).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Posted</p>
          <p className="font-medium">{new Date(task.postedAt).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <Badge className={`${getStatusColor(task.status)} text-white mt-1`}>
            {task.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>
      
      <div>
        <p className="text-sm text-muted-foreground mb-2">Required Skills</p>
        <div className="flex flex-wrap gap-2">
          {task.requiredSkills.map((skill, i) => (
            <Badge key={i} variant="secondary">
              {skill}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ type }: { type: 'tasks' | 'applications' }) {
  const message = type === 'tasks' 
    ? { title: 'No tasks found', description: 'Post a new task to get started with freelancer hiring.' }
    : { title: 'No applications', description: 'There are no applications for this task yet.' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-[400px] text-center"
    >
      <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">{message.title}</h3>
      <p className="text-muted-foreground max-w-md">
        {message.description}
      </p>
    </motion.div>
  );
}

export function FreelancerMarketplace() {
  const { tasks, applications, addTask, assignFreelancer, updateApplicationStatus, getApplicationsByTaskId } = useTaskStore();
  const { currentUser } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Task['status'] | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'tasks' | 'applications'>('tasks');
  
  // Dialog states
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
  const [isApplicationDetailOpen, setIsApplicationDetailOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<TaskApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedTaskForApplications, setSelectedTaskForApplications] = useState<Task | null>(null);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    const query = (searchQuery || '').toLowerCase();
    return tasks.filter(task => {
      const matchesSearch = 
        (task.title || '').toLowerCase().includes(query) ||
        (task.description || '').toLowerCase().includes(query) ||
        (task.category || '').toLowerCase().includes(query);
      
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: tasks.length,
    open: tasks.filter(t => t.status === 'open').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    totalApplications: applications.length,
    pendingApplications: applications.filter(a => a.status === 'pending').length,
  }), [tasks, applications]);

  // Handlers
  const handleCreateTask = (taskData: Omit<Task, 'id' | 'postedAt' | 'status' | 'milestones'>) => {
    addTask(taskData);
    toast.success(`Task "${taskData.title}" has been posted`);
    setIsNewTaskOpen(false);
  };

  const handleViewApplications = (task: Task) => {
    setSelectedTaskForApplications(task);
    setIsApplicationsOpen(true);
  };

  const handleViewTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const handleViewApplicationDetail = (application: TaskApplication) => {
    setSelectedApplication(application);
    setIsApplicationDetailOpen(true);
  };

  const handleAcceptApplication = (application: TaskApplication) => {
    if (selectedTaskForApplications) {
      assignFreelancer(selectedTaskForApplications.id, application.freelancerId, application.id);
      toast.success('Freelancer has been assigned to the task');
    }
  };

  const handleRejectApplication = (application: TaskApplication) => {
    setSelectedApplication(application);
    setRejectReason('');
    setIsRejectDialogOpen(true);
  };

  const confirmRejectApplication = () => {
    if (selectedApplication && rejectReason.trim()) {
      updateApplicationStatus(selectedApplication.id, 'rejected', rejectReason);
      toast.error('Application has been rejected');
      setIsRejectDialogOpen(false);
      setSelectedApplication(null);
      setRejectReason('');
    } else {
      toast.error('Please provide a reason for rejection');
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
        <h1 className="text-3xl font-bold">Freelancer Marketplace</h1>
        <p className="text-muted-foreground mt-1">
          Post tasks and manage freelancer applications for your projects.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-3xl font-bold">{stats.open}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500">
                <Wrench className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold">{stats.inProgress}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold">{stats.completed}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Applications</p>
                <p className="text-3xl font-bold">{stats.totalApplications}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold">{stats.pendingApplications}</p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500">
                <ArrowRightCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Marketplace Tasks</CardTitle>
              <CardDescription>Manage your posted tasks and review freelancer applications</CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[200px]"
                />
              </div>
              
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(v: Task['status'] | 'all') => setStatusFilter(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Post Task Button */}
              <Button className="gap-2" onClick={() => setIsNewTaskOpen(true)}>
                <Plus className="w-4 h-4" />
                Post New Task
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'tasks' | 'applications')} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="tasks" className="gap-2">
                <Briefcase className="w-4 h-4" />
                Open Tasks
                <Badge variant="secondary" className="ml-1">{stats.open}</Badge>
              </TabsTrigger>
              <TabsTrigger value="applications" className="gap-2">
                <Users className="w-4 h-4" />
                Manage Applications
                <Badge variant="secondary" className="ml-1">{stats.pendingApplications}</Badge>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks">
              <ScrollArea className="h-[500px]">
                {filteredTasks.length === 0 ? (
                  <EmptyState type="tasks" />
                ) : (
                  <TaskTable
                    tasks={filteredTasks}
                    onViewApplications={handleViewApplications}
                  />
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="applications">
              <ScrollArea className="h-[500px]">
                {applications.length === 0 ? (
                  <EmptyState type="applications" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Freelancer</TableHead>
                        <TableHead>Proposed Rate</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app, index) => {
                        const task = tasks.find(t => t.id === app.taskId);
                        return (
                          <motion.tr
                            key={app.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <TableCell>
                              <span className="font-medium">{task?.title || 'Unknown Task'}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span>Freelancer {app.freelancerId}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span>R{app.proposedRate}/hr</span>
                            </TableCell>
                            <TableCell>
                              {new Date(app.appliedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getApplicationStatusColor(app.status)} text-white`}>
                                {app.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {app.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 gap-1 text-green-600"
                                      onClick={() => {
                                        setSelectedTaskForApplications(task || null);
                                        handleAcceptApplication(app);
                                      }}
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 gap-1 text-red-600"
                                      onClick={() => handleRejectApplication(app)}
                                    >
                                      <XCircle className="w-3 h-3" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewApplicationDetail(app)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* New Task Dialog */}
      <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Post New Task</DialogTitle>
            <DialogDescription>
              Create a new task to attract freelancer applications.
            </DialogDescription>
          </DialogHeader>
          <NewTaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setIsNewTaskOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Task Detail Dialog */}
      <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          {selectedTask && <TaskDetailDialog task={selectedTask} />}
        </DialogContent>
      </Dialog>

      {/* Applications Dialog */}
      <Dialog open={isApplicationsOpen} onOpenChange={setIsApplicationsOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Applications</DialogTitle>
            <DialogDescription>
              {selectedTaskForApplications?.title || 'Task Applications'}
            </DialogDescription>
          </DialogHeader>
          {selectedTaskForApplications && (
            <ScrollArea className="h-[400px]">
              <ApplicationsTable
                applications={getApplicationsByTaskId(selectedTaskForApplications.id)}
                taskTitle={selectedTaskForApplications.title}
                onAccept={handleAcceptApplication}
                onReject={handleRejectApplication}
              />
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Application Detail Dialog */}
      <Dialog open={isApplicationDetailOpen} onOpenChange={setIsApplicationDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <ApplicationDetailDialog
              application={selectedApplication}
              taskTitle={tasks.find(t => t.id === selectedApplication.taskId)?.title || ''}
              onClose={() => setIsApplicationDetailOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Application Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">Freelancer {selectedApplication?.freelancerId}</p>
              <p className="text-sm text-muted-foreground">
                Proposed Rate: R{selectedApplication?.proposedRate}/hr
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Rejection Reason</Label>
              <Textarea
                id="rejectReason"
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRejectApplication}>
              <XCircle className="w-4 h-4 mr-2" />
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
