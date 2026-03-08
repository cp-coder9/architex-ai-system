import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInvoiceStore, useProjectStore } from '@/store';
import { Invoice } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// Removed unused Tabs imports
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  FileText,
  _DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Download,
  Send,
  Plus,
  Search,
  Eye,
  Printer,
  Users,
  FolderKanban,
  BarChart3,
} from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Freelancer } from '@/types';

// Invoice Detail Dialog
function InvoiceDetailDialog({
  invoice,
  isOpen,
  onClose,
  onMarkAsPaid,
  onMarkAsSent,
}: {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsPaid: () => void;
  onMarkAsSent: () => void;
}) {
  const timeEntries = useProjectStore(state =>
    state.timeEntries.filter(te => invoice.timeEntries.includes(te.id))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Invoice {invoice.invoiceNumber}
          </DialogTitle>
          <DialogDescription>
            View and manage invoice details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Number</p>
              <p className="font-semibold">{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={
                invoice.status === 'paid' ? 'bg-green-500' :
                  invoice.status === 'sent' ? 'bg-blue-500' :
                    invoice.status === 'overdue' ? 'bg-red-500' : 'bg-gray-500'
              }>
                {invoice.status}
              </Badge>
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="text-xl font-semibold">R{invoice.subtotal.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Tax ({(invoice.taxRate * 100).toFixed(0)}%)</p>
              <p className="text-xl font-semibold">R{invoice.taxAmount.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg border col-span-2 bg-primary/5">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold text-primary">R{invoice.total.toLocaleString()}</p>
            </div>
          </div>

          {/* Time Entries */}
          <div>
            <p className="font-medium mb-3">Time Entries ({timeEntries.length})</p>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {timeEntries.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{entry.hours} hours</p>
                      <p className="text-xs text-muted-foreground">
                        R{(entry.hours * invoice.hourlyRate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Actions */}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            {invoice.status === 'draft' && (
              <Button onClick={onMarkAsSent}>
                <Send className="w-4 h-4 mr-2" />
                Send Invoice
              </Button>
            )}
            {invoice.status === 'sent' && (
              <Button onClick={onMarkAsPaid}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark as Paid
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Generate Invoice Dialog
function GenerateInvoiceDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const projects = useProjectStore(state => state.projects);
  const timeEntries = useProjectStore(state => state.timeEntries);
  const getUsersByRole = useSettingsStore(state => state.getUsersByRole);
  const generateInvoiceFromTimeEntries = useInvoiceStore(state => state.generateInvoiceFromTimeEntries);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<string>('');
  const [selectedTimeEntryIds, setSelectedTimeEntryIds] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter freelancers based on selected project
  const availableFreelancers = useMemo(() => {
    const freelancers = getUsersByRole('freelancer') as Freelancer[];
    if (!selectedProjectId) return [];

    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return [];

    if (!project.teamMembers || project.teamMembers.length === 0) {
      return freelancers;
    }

    return freelancers.filter(f => project.teamMembers?.includes(f.id));
  }, [selectedProjectId, projects, getUsersByRole]);

  // Filter un-invoiced time entries
  const availableTimeEntries = useMemo(() => {
    if (!selectedProjectId || !selectedFreelancerId) return [];

    return timeEntries.filter(te =>
      te.projectId === selectedProjectId &&
      te.freelancerId === selectedFreelancerId &&
      !te.invoiced
    );
  }, [selectedProjectId, selectedFreelancerId, timeEntries]);

  // Pre-fill hourly rate when freelancer is selected
  useEffect(() => {
    if (selectedFreelancerId) {
      const freelancer = availableFreelancers.find(f => f.id === selectedFreelancerId);
      if (freelancer) {
        setHourlyRate(freelancer.hourlyRate || 750); // Default fallback
      }
    }
  }, [selectedFreelancerId, availableFreelancers]);

  // Reset dependent fields
  const handleProjectChange = (id: string) => {
    setSelectedProjectId(id);
    setSelectedFreelancerId('');
    setSelectedTimeEntryIds([]);
  };

  const handleFreelancerChange = (id: string) => {
    setSelectedFreelancerId(id);
    setSelectedTimeEntryIds([]);
  };

  const handleToggleTimeEntry = (id: string) => {
    setSelectedTimeEntryIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectedEntries = availableTimeEntries.filter(te => selectedTimeEntryIds.includes(te.id));
  const totalHours = selectedEntries.reduce((sum, te) => sum + te.hours, 0);
  const subtotal = totalHours * hourlyRate;
  const tax = subtotal * 0.10;
  const total = subtotal + tax;

  const handleGenerate = async () => {
    if (!selectedProjectId || !selectedFreelancerId || selectedTimeEntryIds.length === 0) {
      toast.error('Please select a project, freelancer, and at least one time entry');
      return;
    }

    setIsGenerating(true);
    try {
      const project = projects.find(p => p.id === selectedProjectId);
      if (!project) throw new Error('Project not found');

      const invoice = await generateInvoiceFromTimeEntries(selectedEntries, {
        projectId: selectedProjectId,
        freelancerId: selectedFreelancerId,
        clientId: project.clientId,
        hourlyRate,
        dueDate: new Date(dueDate),
        notes,
      });

      toast.success(`Invoice generated: ${invoice.invoiceNumber}`);
      onClose();
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>Create a new invoice from un-invoiced time entries</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={selectedProjectId} onValueChange={handleProjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Freelancer</Label>
              <Select value={selectedFreelancerId} onValueChange={handleFreelancerChange} disabled={!selectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select freelancer" />
                </SelectTrigger>
                <SelectContent>
                  {availableFreelancers.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Time Entries ({availableTimeEntries.length} available)</Label>
            <ScrollArea className="h-[150px] border rounded-md p-2">
              {availableTimeEntries.length > 0 ? (
                <div className="space-y-2">
                  {availableTimeEntries.map(entry => (
                    <div key={entry.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={entry.id}
                        checked={selectedTimeEntryIds.includes(entry.id)}
                        onCheckedChange={() => handleToggleTimeEntry(entry.id)}
                      />
                      <label htmlFor={entry.id} className="text-sm font-medium leading-none cursor-pointer flex-1">
                        <div className="flex justify-between items-center">
                          <span>{entry.description}</span>
                          <span className="text-muted-foreground">{entry.hours} hrs - {new Date(entry.date).toLocaleDateString()}</span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center text-muted-foreground py-4">
                  {!selectedFreelancerId ? 'Select a project and freelancer first' : 'No un-invoiced time entries found'}
                </p>
              )}
            </ScrollArea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hourly Rate (R)</Label>
              <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes for the client..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="p-4 rounded-lg bg-muted space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Hours:</span>
              <span className="font-semibold">{totalHours} hrs</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Estimated Total:</span>
              <span className="font-semibold text-primary">R {total.toLocaleString()} (incl. VAT)</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={isGenerating || selectedTimeEntryIds.length === 0}>
            {isGenerating && <Spinner className="w-4 h-4 mr-2" />}
            Generate Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function InvoiceManagement() {
  const invoices = useInvoiceStore(state => state.invoices);
  const markInvoiceAsPaid = useInvoiceStore(state => state.markInvoiceAsPaid);
  const markInvoiceAsSent = useInvoiceStore(state => state.markInvoiceAsSent);

  const projects = useProjectStore(state => state.projects);

  // Initialize invoice store listeners on mount
  // Data is initialized by StoreInitializer at the app root
  // No local initialize/cleanup needed here to avoid redundant listeners

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Invoice['status'] | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);

  // Get current month for default selection
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  // Calculate billing metrics stat cards
  const totalProjects = projects.length;
  const totalResources = [...new Set(invoices.map(inv => inv.freelancerId))].length;
  const newRequests = invoices.filter(inv => inv.status === 'draft').length;
  const totalHours = invoices.reduce((sum, inv) => sum + inv.hoursTotal, 0);

  // Generate month options dynamically from invoice createdAt values
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    invoices.forEach(invoice => {
      if (invoice.createdAt) {
        months.add(invoice.createdAt.toString().slice(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [invoices]);

  // Filter invoices by month
  const filteredInvoices = invoices.filter(invoice => {
    const query = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (invoice.invoiceNumber || '').toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesMonth = selectedMonth === 'all' ||
      (invoice.createdAt?.toString().slice(0, 7) || '') === selectedMonth;
    return matchesSearch && matchesStatus && matchesMonth;
  });

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return CheckCircle2;
      case 'sent': return Send;
      case 'draft': return FileText;
      case 'overdue': return AlertCircle;
      case 'cancelled': return XCircle;
      default: return FileText;
    }
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'sent': return 'bg-blue-500';
      case 'draft': return 'bg-gray-500';
      case 'overdue': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-400';
      default: return 'bg-gray-500';
    }
  };

  const handleMarkAsPaid = () => {
    if (selectedInvoice) {
      markInvoiceAsPaid(selectedInvoice.id);
      toast.success(`Invoice ${selectedInvoice.invoiceNumber} marked as paid`);
      setIsDetailOpen(false);
      setSelectedInvoice(null);
    }
  };

  const handleMarkAsSent = () => {
    if (selectedInvoice) {
      markInvoiceAsSent(selectedInvoice.id);
      toast.success(`Invoice ${selectedInvoice.invoiceNumber} marked as sent`);
      setIsDetailOpen(false);
      setSelectedInvoice(null);
    }
  };

  const handleExportReport = () => {
    if (filteredInvoices.length === 0) {
      toast.error('No invoices to export for the selected criteria');
      return;
    }

    const headers = ['Invoice #', 'Status', 'Project', 'Freelancer', 'Hours', 'Hourly Rate', 'Subtotal', 'Tax', 'Total', 'Due Date', 'Created At'];

    const csvContent = [
      headers.join(','),
      ...filteredInvoices.map(inv => {
        const project = projects.find(p => p.id === inv.projectId)?.name || inv.projectId;
        const freelancer = (useSettingsStore.getState().getUserById(inv.freelancerId))?.name || inv.freelancerId;

        return [
          `"${inv.invoiceNumber}"`,
          `"${inv.status}"`,
          `"${project.replace(/"/g, '""')}"`,
          `"${freelancer.replace(/"/g, '""')}"`,
          inv.hoursTotal,
          `"${inv.hourlyRate.toLocaleString()}"`,
          `"${inv.subtotal.toLocaleString()}"`,
          `"${inv.taxAmount.toLocaleString()}"`,
          `"${inv.total.toLocaleString()}"`,
          `"${new Date(inv.dueDate).toLocaleDateString()}"`,
          `"${new Date(inv.createdAt).toLocaleDateString()}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `invoices-report-${selectedMonth || 'all'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Report exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Invoice Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage invoices and track payments across all projects.
        </p>
      </motion.div>

      {/* Stats - Billing Metrics */}
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
                <p className="text-sm text-muted-foreground">Total Resources</p>
                <p className="text-3xl font-bold">{totalResources}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Requests</p>
                <p className="text-3xl font-bold">{newRequests}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500">
                <Plus className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-3xl font-bold">{totalHours}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>All Invoices</CardTitle>
              <CardDescription>View and manage invoices</CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[200px]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Invoice['status'] | 'all')}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>

              <Select value={selectedMonth || currentMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {monthOptions.map((month: string) => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" className="gap-2" onClick={handleExportReport}>
                <Download className="w-4 h-4" />
                Export Report
              </Button>

              <Button className="gap-2" onClick={() => setIsGenerateOpen(true)}>
                <Plus className="w-4 h-4" />
                Generate Invoice
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice, index) => {
                  const StatusIcon = getStatusIcon(invoice.status);

                  return (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getStatusColor(invoice.status)}`}>
                            <StatusIcon className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium">{invoice.invoiceNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(invoice.status)} text-white`}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{invoice.hoursTotal} hrs</TableCell>
                      <TableCell className="font-medium">
                        R{invoice.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setIsDetailOpen(true);
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
        </CardContent>
      </Card>

      {/* Payment Status Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Payment Status
          </CardTitle>
          <CardDescription>Invoice payment status breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <p className="text-sm text-muted-foreground mb-1">Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {invoices.filter(inv => inv.status === 'paid').length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {invoices.filter(inv => inv.status === 'sent' || inv.status === 'draft').length}
              </p>
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

              // Removed unused getStatusColor function

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

      {/* Invoice Detail Dialog */}
      {selectedInvoice && (
        <InvoiceDetailDialog
          invoice={selectedInvoice}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedInvoice(null);
          }}
          onMarkAsPaid={handleMarkAsPaid}
          onMarkAsSent={handleMarkAsSent}
        />
      )}

      <GenerateInvoiceDialog
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
      />
    </div>
  );
}
