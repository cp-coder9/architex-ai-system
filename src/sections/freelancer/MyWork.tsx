import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore, useProjectStore, useTaskStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  MapPin,
  FileText,
  Eye,
  Plus,
  Search,
  DollarSign,
  Users,
  BriefcaseIcon,
  Send,
  X,
} from 'lucide-react';

import { Task, TaskApplication } from '@/types';

interface MockTask {
  id: string;
  name: string;
  description: string;
  projectName: string;
  status: string;
  dueDate: Date;
  projectId?: string;
  milestoneId?: string;
  taskId?: string;
}

// Task Card Component for assigned tasks
function TaskCard({ task, onStatusChange, onProjectName }: { task: MockTask; onStatusChange: (status: string) => void; onProjectName: string }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'pending': return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {getStatusIcon(task.status)}
          <div>
            <h3 className="font-medium">{task.name}</h3>
            <p className="text-sm text-muted-foreground">{onProjectName}</p>
          </div>
        </div>
        <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
          {task.status}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
          </span>
        </div>

        <div className="flex gap-2">
          {task.status !== 'completed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange('completed')}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Complete
            </Button>
          )}
          <Button size="sm" variant="ghost">
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Marketplace Task Card Component
function MarketplaceTaskCard({ task, onApply }: { task: Task; onApply: (task: Task) => void }) {
  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'entry': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">{task.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{task.category}</p>
        </div>
        <Badge className={getExperienceColor(task.experienceLevel)}>
          {task.experienceLevel}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{task.description}</p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1 mb-4">
        {task.requiredSkills.map((skill, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {skill}
          </Badge>
        ))}
      </div>

      {/* Budget and Hours */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">R{task.budget.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{task.estimatedHours} hours</span>
        </div>
      </div>

      {/* Deadline */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Calendar className="w-4 h-4" />
        <span>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
      </div>

      <Button onClick={() => onApply(task)} className="w-full gap-2">
        <Send className="w-4 h-4" />
        Apply Now
      </Button>
    </motion.div>
  );
}

// Application Card Component
function ApplicationCard({ application, task }: { application: TaskApplication; task: Task | undefined }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'withdrawn': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 rounded-lg border"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold">{task?.title || 'Unknown Task'}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Applied: {new Date(application.appliedAt).toLocaleDateString()}
          </p>
        </div>
        <Badge className={getStatusColor(application.status)}>
          {application.status}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
        <div>
          <p className="text-muted-foreground">Proposed Rate</p>
          <p className="font-medium">R{application.proposedRate}/hr</p>
        </div>
        <div>
          <p className="text-muted-foreground">Duration</p>
          <p className="font-medium">{application.estimatedDuration} hours</p>
        </div>
        <div>
          <p className="text-muted-foreground">Start Date</p>
          <p className="font-medium">{new Date(application.proposedStartDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="text-sm">
        <p className="text-muted-foreground mb-1">Cover Letter</p>
        <p className="text-sm line-clamp-2">{application.coverLetter}</p>
      </div>
    </motion.div>
  );
}

export function MyWork() {
  const { currentUser } = useAuthStore();
  const { projects, drawings, updateMilestone } = useProjectStore();
  const {
    tasks: marketplaceTasks,
    applications,
    submitApplication,
    getMyTasks,
    updateTask,
  } = useTaskStore();

  // Application dialog state
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [proposedStartDate, setProposedStartDate] = useState('');

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const myProjects = useMemo(() =>
    projects.filter(p => p.freelancerId === currentUser?.id),
    [projects, currentUser?.id]
  );

  const myDrawings = useMemo(() =>
    drawings.filter(d => myProjects.some(p => p.id === d.projectId)),
    [drawings, myProjects]
  );

  // Get marketplace data
  const openTasks = useMemo(() =>
    marketplaceTasks.filter(t => t.status === 'open'),
    [marketplaceTasks]
  );
  const myAssignedTasks = useMemo(() =>
    currentUser ? marketplaceTasks.filter(t => t.assignedTo === currentUser.id) : [],
    [currentUser, marketplaceTasks]
  );
  const myApplications = useMemo(() =>
    currentUser ? applications.filter(a => a.freelancerId === currentUser.id) : [],
    [currentUser, applications]
  );

  // Filter marketplace tasks
  const filteredTasks = useMemo(() => {
    let filtered = openTasks;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(task => task.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        (task.title || '').toLowerCase().includes(query) ||
        (task.description || '').toLowerCase().includes(query) ||
        (task.requiredSkills || []).some(skill => (skill || '').toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [openTasks, selectedCategory, searchQuery]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(openTasks.map(task => task.category));
    return ['all', ...Array.from(cats)];
  }, [openTasks]);

  // Derive tasks from project milestones and marketplace tasks
  const myMilestones = useMemo(() => {
    if (!currentUser) return [];
    const result: MockTask[] = [];
    
    // Get milestones from projects assigned to this freelancer
    projects
      .filter(p => p.freelancerId === currentUser.id)
      .forEach(project => {
        project.milestones?.forEach(milestone => {
          result.push({
            id: milestone.id,
            name: milestone.name,
            description: milestone.description,
            projectName: project.name,
            status: milestone.status,
            dueDate: milestone.dueDate ? new Date(milestone.dueDate) : new Date(),
            projectId: project.id,
            milestoneId: milestone.id,
          });
        });
      });
    
    return result;
  }, [projects, currentUser]);

  // Also get marketplace-assigned tasks
  const myMarketplaceTasks = useMemo(() => {
    if (!currentUser) return [];
    const taskList = getMyTasks(currentUser.id);
    return taskList.map(task => ({
      id: task.id,
      name: task.title,
      description: task.description,
      projectName: task.category || 'Marketplace Task',
      status: task.status,
      dueDate: task.deadline ? new Date(task.deadline) : new Date(),
      taskId: task.id,
    }));
  }, [currentUser, marketplaceTasks, getMyTasks]);

  // Combine milestones and marketplace tasks
  const allMyTasks = useMemo(() => {
    return [...myMilestones, ...myMarketplaceTasks];
  }, [myMilestones, myMarketplaceTasks]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    // Find the task in our combined list
    const task = allMyTasks.find(t => t.id === taskId);
    if (!task) return;

    // Check if it's a milestone (has projectId/milestoneId) or marketplace task (has taskId)
    const milestoneTask = task as MockTask & { milestoneId: string; projectId: string };
    const marketplaceTask = task as MockTask & { taskId: string };
    
    if (milestoneTask.milestoneId && milestoneTask.projectId) {
      // It's a project milestone
      await updateMilestone(milestoneTask.milestoneId, { status: newStatus as any });
    } else if (marketplaceTask.taskId) {
      // It's a marketplace task
      await updateTask(marketplaceTask.taskId, { status: newStatus as any });
    }
  };

  const handleApply = (task: Task) => {
    setSelectedTask(task);
    // Pre-fill with task defaults
    setProposedRate(task.hourlyRate.toString());
    setEstimatedDuration(task.estimatedHours.toString());
    setProposedStartDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setIsApplicationDialogOpen(true);
  };

  const handleSubmitApplication = () => {
    if (!selectedTask || !currentUser) return;

    submitApplication({
      taskId: selectedTask.id,
      freelancerId: currentUser.id,
      coverLetter,
      proposedRate: parseFloat(proposedRate),
      estimatedDuration: parseInt(estimatedDuration),
      proposedStartDate,
    });

    // Reset and close
    setIsApplicationDialogOpen(false);
    setSelectedTask(null);
    setCoverLetter('');
    setProposedRate('');
    setEstimatedDuration('');
    setProposedStartDate('');
  };

  const stats = {
    totalTasks: allMyTasks.length,
    completedTasks: allMyTasks.filter(t => t.status === 'completed').length,
    inProgressTasks: allMyTasks.filter(t => t.status === 'in_progress').length,
    pendingTasks: allMyTasks.filter(t => t.status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">My Work</h1>
        <p className="text-muted-foreground mt-1">
          Manage your tasks and track project progress.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-3xl font-bold">{stats.totalTasks}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedTasks}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{stats.inProgressTasks}</p>
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
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pendingTasks}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="drawings">Drawings</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">My Tasks</h2>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {allMyTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onProjectName={task.projectName}
                  onStatusChange={(status) => handleStatusChange(task.id, status)}
                />
              ))}
              {allMyTasks.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <BriefcaseIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks assigned yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {myProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg border"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{project.name}</h3>
                          <p className="text-sm text-muted-foreground">{project.description}</p>
                        </div>
                        <Badge>{project.status}</Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Hours</span>
                          <span>{project.hoursUsed} / {project.hoursAllocated}</span>
                        </div>
                        <Progress value={(project.hoursUsed / project.hoursAllocated) * 100} className="h-2" />
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                        </span>
                        {project.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {project.address}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drawings">
          <Card>
            <CardHeader>
              <CardTitle>My Drawings</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {myDrawings.slice().reverse().map((drawing, index) => (
                    <motion.div
                      key={drawing.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{drawing.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(drawing.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {drawing.agentCheck && (
                          <Badge variant="outline">
                            Score: {drawing.agentCheck.overallScore}%
                          </Badge>
                        )}
                        <Badge variant={drawing.status === 'approved' ? 'default' : 'secondary'}>
                          {drawing.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BriefcaseIcon className="w-5 h-5" />
                Browse Marketplace Tasks
              </CardTitle>
              <CardDescription>
                Find and apply for available tasks that match your skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks by title, description, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category === 'all' ? 'All' : category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Available Tasks Count */}
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {filteredTasks.length} of {openTasks.length} available tasks
              </div>

              {/* Task Grid */}
              <ScrollArea className="h-[600px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTasks.map((task) => (
                    <MarketplaceTaskCard
                      key={task.id}
                      task={task}
                      onApply={handleApply}
                    />
                  ))}
                </div>
                {filteredTasks.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <BriefcaseIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No tasks found matching your criteria</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Assigned Tasks from Marketplace */}
          {myAssignedTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  My Assigned Tasks
                </CardTitle>
                <CardDescription>
                  Tasks you have been assigned to from the marketplace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {myAssignedTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{task.title}</h3>
                            <p className="text-sm text-muted-foreground">{task.category}</p>
                          </div>
                          <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                            {task.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            R{task.budget.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {task.estimatedHours} hours
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                My Applications
              </CardTitle>
              <CardDescription>
                Track the status of your submitted applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Application Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">Pending</p>
                  <p className="text-2xl font-bold">
                    {myApplications.filter(a => a.status === 'pending').length}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900">
                  <p className="text-sm text-green-800 dark:text-green-200">Accepted</p>
                  <p className="text-2xl font-bold">
                    {myApplications.filter(a => a.status === 'accepted').length}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900">
                  <p className="text-sm text-red-800 dark:text-red-200">Rejected</p>
                  <p className="text-2xl font-bold">
                    {myApplications.filter(a => a.status === 'rejected').length}
                  </p>
                </div>
              </div>

              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {myApplications.map((application) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      task={openTasks.find(t => t.id === application.taskId)}
                    />
                  ))}
                  {myApplications.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>You haven't applied to any tasks yet</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => (document.querySelector('[data-value="marketplace"]') as HTMLElement | null)?.click()}
                      >
                        Browse Marketplace
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Application Dialog */}
      <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Apply for Task</DialogTitle>
            <DialogDescription>
              Submit your application for: {selectedTask?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Task Info */}
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span>Budget: R{selectedTask?.budget.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Est. {selectedTask?.estimatedHours} hours</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Deadline: {selectedTask ? new Date(selectedTask.deadline).toLocaleDateString() : ''}</span>
                </div>
              </div>
            </div>

            {/* Cover Letter */}
            <div className="space-y-2">
              <label htmlFor="coverLetter" className="text-sm font-medium">
                Cover Letter *
              </label>
              <Textarea
                id="coverLetter"
                placeholder="Explain why you're the best fit for this task..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
                required
              />
            </div>

            {/* Proposed Rate */}
            <div className="space-y-2">
              <label htmlFor="proposedRate" className="text-sm font-medium">
                Proposed Hourly Rate (R) *
              </label>
              <Input
                id="proposedRate"
                type="number"
                placeholder="Enter your hourly rate"
                value={proposedRate}
                onChange={(e) => setProposedRate(e.target.value)}
                required
              />
            </div>

            {/* Estimated Duration */}
            <div className="space-y-2">
              <label htmlFor="estimatedDuration" className="text-sm font-medium">
                Estimated Duration (hours) *
              </label>
              <Input
                id="estimatedDuration"
                type="number"
                placeholder="How long will this take?"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                required
              />
            </div>

            {/* Proposed Start Date */}
            <div className="space-y-2">
              <label htmlFor="proposedStartDate" className="text-sm font-medium">
                Proposed Start Date *
              </label>
              <Input
                id="proposedStartDate"
                type="date"
                value={proposedStartDate}
                onChange={(e) => setProposedStartDate(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplicationDialogOpen(false)}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmitApplication}
              disabled={!coverLetter || !proposedRate || !estimatedDuration || !proposedStartDate}
            >
              <Send className="w-4 h-4 mr-1" />
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
