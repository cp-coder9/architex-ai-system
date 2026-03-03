import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProjectStore, useInvoiceStore, useSettingsStore } from '@/store';
import { Project, ProjectStatus, HourAllocation } from '@/types';
import { NewProjectDialog } from './NewProjectDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  FolderKanban,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  XCircle,
  Eye,
  FileText,
  LayoutGrid,
  List,
  Wallet,
  History,
  TrendingUp,
} from 'lucide-react';

// Clients will be fetched from settingsStore

// Project Card component for grid view
interface ProjectCardProps { project: Project; getStatusIcon: (status: ProjectStatus) => React.ComponentType<{ className?: string }>; getStatusColor: (status: ProjectStatus) => string; onSelect: (project: Project) => void; } function ProjectCard({ project, getStatusIcon, getStatusColor, onSelect }: ProjectCardProps) {
  const allDrawings = useProjectStore(state => state.drawings);
  const projectDrawings = useMemo(() => allDrawings.filter(d => d.projectId === project.id), [allDrawings, project.id]);
  const StatusIcon = getStatusIcon(project.status);
  const progress = project.hoursAllocated > 0 ? Math.round((project.hoursUsed / project.hoursAllocated) * 100) : 0;

  return (
    <Card className="overflow-hidden">
      {project.thumbnail ? (
        <div className="h-32 bg-muted">
          <img src={project.thumbnail} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-32 bg-muted flex items-center justify-center">
          <FolderKanban className="w-12 h-12 text-muted-foreground" />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold truncate">{project.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{project.address || 'No address'}</p>
          </div>
          <Badge className={`${getStatusColor(project.status)} text-white text-xs`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {project.status}
          </Badge>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>Progress</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-muted-foreground">
            {project.hoursUsed} / {project.hoursAllocated} hrs
          </span>
          <Badge variant="outline">{projectDrawings.length} drawings</Badge>
        </div>

        <Button variant="outline" className="w-full" onClick={() => onSelect(project)}>
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}

// Project Detail Dialog
function ProjectDetailDialog({ project }: { project: Project }) {
  const allDrawings = useProjectStore(state => state.drawings);
  const drawings = useMemo(() => allDrawings.filter(d => d.projectId === project.id), [allDrawings, project.id]);

  return (
    <div className="space-y-6">
      {/* Project Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <Badge className="mt-1">{project.status}</Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Type</p>
          <p className="font-medium capitalize">{project.projectType}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Budget</p>
          <p className="font-medium">R{project.budget.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Deadline</p>
          <p className="font-medium">{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set'}</p>
        </div>
      </div>

      {/* Hours Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Hours Usage</p>
          <p className="text-sm text-muted-foreground">
            {project.hoursUsed} / {project.hoursAllocated} hours
          </p>
        </div>
        <Progress value={project.hoursAllocated > 0 ? (project.hoursUsed / project.hoursAllocated) * 100 : 0} className="h-3" />
      </div>

      {/* Drawings */}
      <div>
        <p className="text-sm font-medium mb-3">Drawings ({drawings.length})</p>
        <div className="space-y-2">
          {drawings.map(drawing => (
            <div key={drawing.id} className="flex items-center justify-between p-2 rounded-lg border">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{drawing.name}</span>
              </div>
              <Badge variant={drawing.status === 'approved' ? 'default' : 'secondary'}>
                {drawing.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div>
        <p className="text-sm font-medium mb-3">Milestones</p>
        <div className="space-y-2">
          {project.milestones.map(milestone => (
            <div key={milestone.id} className="flex items-center justify-between p-2 rounded-lg border">
              <div className="flex items-center gap-3">
                {milestone.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : milestone.status === 'in_progress' ? (
                  <Clock className="w-4 h-4 text-yellow-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm">{milestone.name}</span>
              </div>
              <Badge variant={milestone.status === 'completed' ? 'default' : 'outline'}>
                {milestone.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Allocation Details Dialog
function AllocationDetailsDialog({ allocation }: { allocation: HourAllocation }) {
  const { getTransactionsByAllocationId, hourPackages } = useInvoiceStore();
  const transactions = getTransactionsByAllocationId(allocation.id);
  const packageInfo = hourPackages.find(p => p.id === allocation.hourPackageId);
  const project = useProjectStore(state => state.projects.find(p => p.id === allocation.projectId));
  const getUserById = useSettingsStore(state => state.getUserById);
  const client = getUserById(allocation.clientId);

  return (
    <div className="space-y-6">
      {/* Allocation Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Client</p>
          <p className="font-medium">{client?.name || 'Unknown'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Project</p>
          <p className="font-medium">{project?.name || 'Unknown'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Hour Package</p>
          <p className="font-medium">{packageInfo ? `${packageInfo.hours} hours (R{packageInfo.pricePerHour}/hr)` : 'Unknown'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <Badge className={`mt-1 ${allocation.status === 'active' ? 'bg-green-500' : allocation.status === 'exhausted' ? 'bg-orange-500' : 'bg-red-500'}`}>
            {allocation.status}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Allocated Hours</p>
          <p className="font-medium">{allocation.allocatedHours} hours</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Used Hours</p>
          <p className="font-medium">{allocation.usedHours} hours</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Remaining Hours</p>
          <p className="font-medium">{allocation.remainingHours} hours</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Allocated At</p>
          <p className="font-medium">{new Date(allocation.allocatedAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Hours Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Hours Usage</p>
          <p className="text-sm text-muted-foreground">
            {allocation.usedHours} / {allocation.allocatedHours} hours
          </p>
        </div>
        <Progress value={allocation.allocatedHours > 0 ? (allocation.usedHours / allocation.allocatedHours) * 100 : 0} className="h-3" />
      </div>

      {/* Transactions */}
      <div>
        <p className="text-sm font-medium mb-3">Transaction History ({transactions.length})</p>
        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map(txn => (
              <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <p className="text-sm font-medium">{txn.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(txn.createdAt).toLocaleDateString()} • {txn.hours} hours
                  </p>
                </div>
                <Badge variant={txn.status === 'approved' ? 'default' : txn.status === 'pending' ? 'secondary' : 'destructive'}>
                  {txn.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No transactions yet</p>
        )}
      </div>
    </div>
  );
}

// Allocate Hours Dialog Component
function AllocateHoursDialog() {
  const { projects } = useProjectStore();
  const { hourPackages, createAllocation } = useInvoiceStore();
  const { users, getUsersByRole } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [hoursToAllocate, setHoursToAllocate] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get all clients from settingsStore
  const clients = useMemo(() => getUsersByRole('client'), [getUsersByRole, users]);

  // Get available packages for selected client
  const availablePackages = useMemo(() => {
    if (!selectedClient) return [];
    return hourPackages.filter(pkg => pkg.clientId === selectedClient && pkg.hoursRemaining > 0);
  }, [selectedClient, hourPackages]);

  // Get projects for selected client
  const clientProjects = useMemo(() => {
    if (!selectedClient) return [];
    return projects.filter(p => p.clientId === selectedClient);
  }, [selectedClient, projects]);

  // Reset form when closing
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedClient('');
      setSelectedProject('');
      setSelectedPackage('');
      setHoursToAllocate(0);
    }
  };

  // Handle allocation
  const handleAllocate = async () => {
    if (!selectedClient || !selectedProject || !selectedPackage || hoursToAllocate <= 0) {
      toast.error('Please fill in all fields');
      return;
    }

    const pkg = hourPackages.find(p => p.id === selectedPackage);
    if (!pkg || pkg.hoursRemaining < hoursToAllocate) {
      toast.error('Insufficient hours in the selected package');
      return;
    }

    setIsSubmitting(true);
    try {
      createAllocation({
        clientId: selectedClient,
        projectId: selectedProject,
        hourPackageId: selectedPackage,
        allocatedHours: hoursToAllocate,
      });
      toast.success('Hours allocated successfully');
      handleOpenChange(false);
    } catch (_error) {
      toast.error('Failed to allocate hours');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Wallet className="w-4 h-4" />
          Allocate Hours
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Allocate Hours</DialogTitle>
          <DialogDescription>
            Allocate hours from a client's hour package to a specific project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select value={selectedClient} onValueChange={(v) => { setSelectedClient(v); setSelectedProject(''); setSelectedPackage(''); }}>
              <SelectTrigger id="client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} - {client.company || 'No company'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select value={selectedProject} onValueChange={(v) => setSelectedProject(v)} disabled={!selectedClient}>
              <SelectTrigger id="project">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {clientProjects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hour Package Selection */}
          <div className="space-y-2">
            <Label htmlFor="package">Hour Package</Label>
            <Select value={selectedPackage} onValueChange={setSelectedPackage} disabled={!selectedClient}>
              <SelectTrigger id="package">
                <SelectValue placeholder="Select an hour package" />
              </SelectTrigger>
              <SelectContent>
                {availablePackages.map(pkg => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.hours} hours (R{pkg.pricePerHour}/hr) - {pkg.hoursRemaining} available
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hours Input */}
          <div className="space-y-2">
            <Label htmlFor="hours">Hours to Allocate</Label>
            <Input
              id="hours"
              type="number"
              min="1"
              value={hoursToAllocate || ''}
              onChange={(e) => setHoursToAllocate(parseInt(e.target.value) || 0)}
              placeholder="Enter hours to allocate"
            />
            {selectedPackage && hoursToAllocate > 0 && (
              <p className="text-xs text-muted-foreground">
                Available: {hourPackages.find(p => p.id === selectedPackage)?.hoursRemaining || 0} hours
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAllocate} disabled={isSubmitting || !selectedClient || !selectedProject || !selectedPackage || hoursToAllocate <= 0}>
            {isSubmitting ? 'Allocating...' : 'Create Allocation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const getStatusIcon = (status: ProjectStatus) => {
  switch (status) {
    case 'active': return CheckCircle2;
    case 'draft': return FileText;
    case 'on_hold': return PauseCircle;
    case 'completed': return CheckCircle2;
    case 'cancelled': return XCircle;
    default: return FolderKanban;
  }
};

const getStatusColor = (status: ProjectStatus) => {
  switch (status) {
    case 'active': return 'bg-green-500';
    case 'draft': return 'bg-gray-500';
    case 'on_hold': return 'bg-yellow-500';
    case 'completed': return 'bg-blue-500';
    case 'cancelled': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getAllocationStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-500';
    case 'exhausted': return 'bg-orange-500';
    case 'expired': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

export function ProjectOversight() {
  const projects = useProjectStore(state => state.projects);
  const drawings = useProjectStore(state => state.drawings);
  const initialize = useProjectStore(state => state.initialize);
  const cleanup = useProjectStore(state => state.cleanup);

  const hourAllocations = useInvoiceStore(state => state.hourAllocations);
  const hourPackages = useInvoiceStore(state => state.hourPackages);
  const initInvoices = useInvoiceStore(state => state.initialize);
  const cleanupInvoices = useInvoiceStore(state => state.cleanup);

  const getUserById = useSettingsStore(state => state.getUserById);

  // Initialize project and invoice stores on mount
  useEffect(() => {
    initialize();
    initInvoices();
    return () => {
      cleanup();
      cleanupInvoices();
    };
  }, [initialize, cleanup, initInvoices, cleanupInvoices]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<string>('name_asc');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<HourAllocation | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);

  // Calculate stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const pendingDrawings = drawings.filter(d => d.status === 'pending').length;

  // Calculate allocation stats
  const totalAllocations = hourAllocations.length;
  const activeAllocations = hourAllocations.filter(a => a.status === 'active').length;
  const totalHoursAllocated = hourAllocations.reduce((sum, a) => sum + a.allocatedHours, 0);
  const totalHoursUsed = hourAllocations.reduce((sum, a) => sum + a.usedHours, 0);

  // Get project name by ID
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  // Get package info by ID
  const getPackageInfo = (packageId: string) => {
    const pkg = hourPackages.find(p => p.id === packageId);
    return pkg ? `${pkg.hours} hours @ R${pkg.pricePerHour}/hr` : 'Unknown Package';
  };

  // Get client name by ID using settingsStore
  const getClientName = (clientId: string) => {
    const client = getUserById(clientId);
    return client?.name || 'Unknown Client';
  };

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    const filtered = projects.filter(project => {
      const query = (searchQuery || '').toLowerCase();
      const matchesSearch = (project.name || '').toLowerCase().includes(query) ||
        (project.description || '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesType = typeFilter === 'all' || project.projectType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'budget_desc':
          return b.budget - a.budget;
        case 'budget_asc':
          return a.budget - b.budget;
        case 'deadline_asc':
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'progress_desc': {
          const progressA = a.hoursAllocated > 0 ? (a.hoursUsed / a.hoursAllocated) * 100 : 0;
          const progressB = b.hoursAllocated > 0 ? (b.hoursUsed / b.hoursAllocated) * 100 : 0;
          return progressB - progressA;
        }
        default:
          return 0;
      }
    });
  }, [projects, searchQuery, statusFilter, typeFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Project Oversight</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage all projects across the platform.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-3xl font-bold">{totalProjects}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500">
                <FolderKanban className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-3xl font-bold">{activeProjects}</p>
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
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold">{completedProjects}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Drawings</p>
                <p className="text-3xl font-bold">{pendingDrawings}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects" className="gap-2">
            <FolderKanban className="w-4 h-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="allocations" className="gap-2">
            <Wallet className="w-4 h-4" />
            Hour Allocations
          </TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>All Projects</CardTitle>
                  <CardDescription>View and manage project details</CardDescription>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-[200px]"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={(v: ProjectStatus | 'all') => setStatusFilter(v)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name_asc">Name (A–Z)</SelectItem>
                      <SelectItem value="name_desc">Name (Z–A)</SelectItem>
                      <SelectItem value="budget_desc">Budget (High–Low)</SelectItem>
                      <SelectItem value="budget_asc">Budget (Low–High)</SelectItem>
                      <SelectItem value="deadline_asc">Deadline (Nearest)</SelectItem>
                      <SelectItem value="progress_desc">Progress (High–Low)</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex gap-1 border rounded-md p-1">
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button className="gap-2" onClick={() => setIsNewProjectOpen(true)}>
                    <Plus className="w-4 h-4" />
                    New Project
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {viewMode === 'list' ? (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Drawings</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map((project, index) => {
                        const projectDrawings = drawings.filter(d => d.projectId === project.id);
                        const StatusIcon = getStatusIcon(project.status);

                        return (
                          <motion.tr
                            key={project.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {project.thumbnail ? (
                                  <img src={project.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                    <FolderKanban className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{project.name}</p>
                                  <p className="text-sm text-muted-foreground">{project.address || 'No address'}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(project.status)} text-white`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {project.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="w-[100px]">
                                <Progress
                                  value={project.hoursAllocated > 0 ? (project.hoursUsed / project.hoursAllocated) * 100 : 0}
                                  className="h-2"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  {project.hoursAllocated > 0 ? Math.round((project.hoursUsed / project.hoursAllocated) * 100) : 0}%
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{project.hoursUsed} / {project.hoursAllocated}</p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{projectDrawings.length}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedProject(project);
                                  setIsProjectDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ProjectCard
                        project={project}
                        getStatusIcon={getStatusIcon}
                        getStatusColor={getStatusColor}
                        onSelect={(project) => {
                          setSelectedProject(project);
                          setIsProjectDialogOpen(true);
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hour Allocations Tab */}
        <TabsContent value="allocations" className="space-y-4">
          {/* Allocation Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Allocations</p>
                    <p className="text-3xl font-bold">{totalAllocations}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-3xl font-bold">{activeAllocations}</p>
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
                    <p className="text-sm text-muted-foreground">Hours Allocated</p>
                    <p className="text-3xl font-bold">{totalHoursAllocated}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-500">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Hours Used</p>
                    <p className="text-3xl font-bold">{totalHoursUsed}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-500">
                    <History className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Allocations Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Hour Allocations</CardTitle>
                  <CardDescription>Manage hour allocations from client packages to projects</CardDescription>
                </div>

                <AllocateHoursDialog />
              </div>
            </CardHeader>

            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Hour Package</TableHead>
                      <TableHead>Allocated</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Allocated At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hourAllocations.length > 0 ? (
                      hourAllocations.map((allocation, index) => (
                        <motion.tr
                          key={allocation.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b hover:bg-muted/50 transition-colors"
                        >
                          <TableCell>
                            <p className="font-medium">{getClientName(allocation.clientId)}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{getProjectName(allocation.projectId)}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{getPackageInfo(allocation.hourPackageId)}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{allocation.allocatedHours} hrs</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{allocation.usedHours} hrs</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{allocation.remainingHours} hrs</p>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getAllocationStatusColor(allocation.status)} text-white`}>
                              {allocation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{new Date(allocation.allocatedAt).toLocaleDateString()}</p>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAllocation(allocation);
                                setIsAllocationDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Wallet className="w-8 h-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No hour allocations yet</p>
                            <Button variant="outline" onClick={() => document.querySelector('[data-state="open"]')?.querySelector('button')?.click()}>
                              <Plus className="w-4 h-4 mr-2" />
                              Create First Allocation
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Project Detail Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedProject?.name}</DialogTitle>
            <DialogDescription>{selectedProject?.description}</DialogDescription>
          </DialogHeader>
          {selectedProject && <ProjectDetailDialog project={selectedProject} />}
        </DialogContent>
      </Dialog>

      {/* Allocation Detail Dialog */}
      <Dialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Allocation Details</DialogTitle>
            <DialogDescription>
              View allocation details and transaction history
            </DialogDescription>
          </DialogHeader>
          {selectedAllocation && <AllocationDetailsDialog allocation={selectedAllocation} />}
        </DialogContent>
      </Dialog>

      <NewProjectDialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen} />
    </div>
  );
}
