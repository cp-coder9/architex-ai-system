import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useProjectRequestStore } from '@/store';
import { ProjectRequest, ProjectRequestStatus } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  FolderInput,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MoreHorizontal,
  FileCheck,
  FileX,
  ArrowRightCircle,
  DollarSign,
  Calendar,
  User,
  Building2,
  MapPin,
  FileText,
} from 'lucide-react';

// Project Request Table Component
function ProjectRequestTable({
  requests,
  onApprove,
  onReject,
  onConvert
}: {
  requests: ProjectRequest[];
  onApprove: (request: ProjectRequest) => void;
  onReject: (request: ProjectRequest) => void;
  onConvert: (request: ProjectRequest) => void;
}) {
  const getStatusColor = (status: ProjectRequestStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-blue-500';
      case 'rejected': return 'bg-red-500';
      case 'converted': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: ProjectRequestStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'converted': return <ArrowRightCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getProjectTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      residential: 'bg-green-500',
      commercial: 'bg-blue-500',
      industrial: 'bg-purple-500',
      landscape: 'bg-teal-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Hours/Budget</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request, index) => (
          <motion.tr
            key={request.id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border-b hover:bg-muted/50 transition-colors"
          >
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{request.projectName}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {request.description.substring(0, 50)}...
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-muted">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{request.clientName}</span>
                  <span className="text-xs text-muted-foreground">{request.clientEmail}</span>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={`${getProjectTypeBadge(request.projectType)} text-white capitalize`}>
                {request.projectType}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  {request.hoursRequested}h
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <DollarSign className="w-3 h-3" />
                  {request.budget.toLocaleString()}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={`${getStatusColor(request.status)} text-white gap-1`}>
                {getStatusIcon(request.status)}
                {request.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(request.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              {request.status === 'pending' && (
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1"
                    onClick={() => onApprove(request)}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onReject(request)}
                  >
                    <XCircle className="w-3 h-3" />
                    Reject
                  </Button>
                </div>
              )}
              {request.status === 'approved' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1"
                  onClick={() => onConvert(request)}
                >
                  <ArrowRightCircle className="w-3 h-3" />
                  Convert
                </Button>
              )}
              {request.status === 'rejected' && (
                <Button size="sm" variant="ghost" asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <FileText className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Button>
              )}
              {request.status === 'converted' && (
                <Badge variant="outline" className="gap-1">
                  <ArrowRightCircle className="w-3 h-3" />
                  {request.convertedToProjectId}
                </Badge>
              )}
            </TableCell>
          </motion.tr>
        ))}
      </TableBody>
    </Table>
  );
}

// Empty State Component
function EmptyState({ tab }: { tab: string }) {
  const getMessage = () => {
    switch (tab) {
      case 'pending':
        return { title: 'No pending requests', description: 'There are no project requests waiting for approval.' };
      case 'approved':
        return { title: 'No approved requests', description: 'There are no approved project requests.' };
      case 'rejected':
        return { title: 'No rejected requests', description: 'There are no rejected project requests.' };
      case 'converted':
        return { title: 'No converted projects', description: 'There are no requests that have been converted to projects.' };
      default:
        return { title: 'No project requests', description: 'There are no project requests in the system.' };
    }
  };

  const message = getMessage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-[400px] text-center"
    >
      <FolderInput className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">{message.title}</h3>
      <p className="text-muted-foreground max-w-md">
        {message.description}
      </p>
    </motion.div>
  );
}

export function ProjectRequests() {
  const { projectRequests, approveRequest, rejectRequest, convertToProject } = useProjectRequestStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ProjectRequestStatus | 'all'>('all');

  // Dialog states
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProjectRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Filter requests
  const filteredRequests = useMemo(() => {
    return projectRequests.filter(request => {
      const query = (searchQuery || '').toLowerCase();
      const matchesSearch =
        (request.projectName || '').toLowerCase().includes(query) ||
        (request.clientName || '').toLowerCase().includes(query) ||
        (request.description || '').toLowerCase().includes(query);

      const matchesTab = activeTab === 'all' || request.status === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [projectRequests, searchQuery, activeTab]);

  // Stats
  const stats = useMemo(() => ({
    total: projectRequests.length,
    pending: projectRequests.filter(r => r.status === 'pending').length,
    approved: projectRequests.filter(r => r.status === 'approved').length,
    rejected: projectRequests.filter(r => r.status === 'rejected').length,
    converted: projectRequests.filter(r => r.status === 'converted').length,
  }), [projectRequests]);

  // Handlers
  const handleApprove = (request: ProjectRequest) => {
    setSelectedRequest(request);
    setIsApproveDialogOpen(true);
  };

  const handleReject = (request: ProjectRequest) => {
    setSelectedRequest(request);
    setRejectReason('');
    setIsRejectDialogOpen(true);
  };

  const handleConvert = (request: ProjectRequest) => {
    setSelectedRequest(request);
    setIsConvertDialogOpen(true);
  };

  const confirmApprove = () => {
    if (selectedRequest) {
      approveRequest(selectedRequest.id, 'admin-1');
      toast.success(`Project request "${selectedRequest.projectName}" has been approved`);
      setIsApproveDialogOpen(false);
      setSelectedRequest(null);
    }
  };

  const confirmReject = () => {
    if (selectedRequest && rejectReason.trim()) {
      rejectRequest(selectedRequest.id, 'admin-1', rejectReason);
      toast.error(`Project request "${selectedRequest.projectName}" has been rejected`);
      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
    } else {
      toast.error('Please provide a reason for rejection');
    }
  };

  const confirmConvert = () => {
    if (selectedRequest) {
      const newProjectId = `proj-${Date.now()}`;
      convertToProject(selectedRequest.id, newProjectId);
      toast.success(`Project request converted to project ${newProjectId}`);
      setIsConvertDialogOpen(false);
      setSelectedRequest(null);
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
        <h1 className="text-3xl font-bold">Project Requests</h1>
        <p className="text-muted-foreground mt-1">
          Manage and process project requests from clients.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary">
                <FolderInput className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold">{stats.pending}</p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-3xl font-bold">{stats.approved}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500">
                <FileCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-3xl font-bold">{stats.rejected}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500">
                <FileX className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Converted</p>
                <p className="text-3xl font-bold">{stats.converted}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500">
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
              <CardTitle>All Project Requests</CardTitle>
              <CardDescription>Review and manage client project requests</CardDescription>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-[250px]"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProjectRequestStatus | 'all')} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all" className="gap-2">
                All
                <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="w-4 h-4" />
                Pending
                <Badge variant="secondary" className="ml-1">{stats.pending}</Badge>
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <FileCheck className="w-4 h-4" />
                Approved
                <Badge variant="secondary" className="ml-1">{stats.approved}</Badge>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                <FileX className="w-4 h-4" />
                Rejected
                <Badge variant="secondary" className="ml-1">{stats.rejected}</Badge>
              </TabsTrigger>
              <TabsTrigger value="converted" className="gap-2">
                <ArrowRightCircle className="w-4 h-4" />
                Converted
                <Badge variant="secondary" className="ml-1">{stats.converted}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <ScrollArea className="h-[500px]">
                {filteredRequests.length === 0 ? (
                  <EmptyState tab={activeTab} />
                ) : (
                  <ProjectRequestTable
                    requests={filteredRequests}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onConvert={handleConvert}
                  />
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Project Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this project request? This will allow the client to proceed with the project.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium">{selectedRequest.projectName}</p>
                <p className="text-sm text-muted-foreground">{selectedRequest.clientName}</p>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedRequest.hoursRequested}h
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    R{selectedRequest.budget.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmApprove}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Project Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this project request.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium">{selectedRequest.projectName}</p>
                <p className="text-sm text-muted-foreground">{selectedRequest.clientName}</p>
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReject}>
              <XCircle className="w-4 h-4 mr-2" />
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Project</DialogTitle>
            <DialogDescription>
              Convert this approved project request into an active project.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium">{selectedRequest.projectName}</p>
                <p className="text-sm text-muted-foreground">{selectedRequest.clientName}</p>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedRequest.hoursRequested}h
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    R{selectedRequest.budget.toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                A new project will be created and the client will be notified to proceed with their purchase.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmConvert}>
              <ArrowRightCircle className="w-4 h-4 mr-2" />
              Convert to Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
