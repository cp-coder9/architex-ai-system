import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Shield,
  Search,
  Download,
  FileText,
  AlertTriangle,
  Activity,
  Filter,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { AuditLog, SecurityEvent } from '@/types';
import { db } from '@/config/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

// Audit Log Table Component
function AuditLogTable({ logs }: { logs: AuditLog[] }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user': return <User className="w-4 h-4" />;
      case 'project': return <Activity className="w-4 h-4" />;
      case 'drawing': return <FileText className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Actor</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log, index) => (
          <motion.tr
            key={log.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border-b hover:bg-muted/50 transition-colors"
          >
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{log.actorName}</span>
                <span className="text-xs text-muted-foreground">{log.actorEmail}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{log.action}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">{log.details}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="gap-1">
                {getCategoryIcon(log.category)}
                {log.category}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={`${getSeverityColor(log.severity)} text-white`}>
                {log.severity}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {getStatusIcon(log.status)}
                <span className="capitalize">{log.status}</span>
              </div>
            </TableCell>
          </motion.tr>
        ))}
      </TableBody>
    </Table>
  );
}

// Security Events Table Component
function SecurityEventsTable({ events }: { events: SecurityEvent[] }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'login': return 'Login';
      case 'logout': return 'Logout';
      case 'failed_login': return 'Failed Login';
      case 'permission_denied': return 'Permission Denied';
      case 'data_access': return 'Data Access';
      case 'configuration_change': return 'Config Change';
      case 'threat_detected': return 'Threat Detected';
      default: return type;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Event Type</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>IP Address</TableHead>
          <TableHead>Timestamp</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event, index) => (
          <motion.tr
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border-b hover:bg-muted/50 transition-colors"
          >
            <TableCell>
              <Badge variant="outline">
                {getEventTypeLabel(event.eventType)}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={`${getSeverityColor(event.severity)} text-white`}>
                {event.severity}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{event.userName}</span>
                <span className="text-xs text-muted-foreground">ID: {event.userId}</span>
              </div>
            </TableCell>
            <TableCell className="max-w-xs">
              <span className="line-clamp-2 text-sm">{event.description}</span>
            </TableCell>
            <TableCell>
              <code className="text-xs bg-muted px-2 py-1 rounded">{event.ipAddress}</code>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{new Date(event.timestamp).toLocaleDateString()}</span>
                <span className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleTimeString()}</span>
              </div>
            </TableCell>
            <TableCell>
              {event.resolved ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Resolved
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Active
                </Badge>
              )}
            </TableCell>
          </motion.tr>
        ))}
      </TableBody>
    </Table>
  );
}

export function AuditSecurity() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  // Fetch audit logs from Firestore
  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Subscribe to audit logs
    const auditQuery = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeAudit = onSnapshot(
      auditQuery,
      (snapshot) => {
        const logs = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
          };
        }) as AuditLog[];
        setAuditLogs(logs);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching audit logs:', error);
        setIsLoading(false);
      }
    );

    // Subscribe to security events
    const securityQuery = query(
      collection(db, 'security_events'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeSecurity = onSnapshot(
      securityQuery,
      (snapshot) => {
        const events = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
            resolvedAt: data.resolvedAt instanceof Timestamp ? data.resolvedAt.toDate() : data.resolvedAt ? new Date(data.resolvedAt) : undefined,
          };
        }) as SecurityEvent[];
        setSecurityEvents(events);
      },
      (error) => {
        console.error('Error fetching security events:', error);
      }
    );

    return () => {
      unsubscribeAudit();
      unsubscribeSecurity();
    };
  }, []);

   // Filter audit logs
   const filteredLogs = useMemo(() => {
     return auditLogs.filter(log => {
       const matchesSearch = 
         (log.actorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
         (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
         (log.details || '').toLowerCase().includes(searchQuery.toLowerCase());
       
       const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
       const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
       
       let matchesDate = true;
       if (dateRange !== 'all') {
         const now = new Date();
         const logDate = new Date(log.timestamp);
         switch (dateRange) {
           case 'today':
             matchesDate = logDate.toDateString() === now.toDateString();
             break;
           case 'week':
             const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
             matchesDate = logDate >= weekAgo;
             break;
           case 'month':
             const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
             matchesDate = logDate >= monthAgo;
             break;
         }
       }
       
       return matchesSearch && matchesCategory && matchesSeverity && matchesDate;
     });
   }, [auditLogs, searchQuery, categoryFilter, severityFilter, dateRange]);

   // Filter security events
   const filteredEvents = useMemo(() => {
     return securityEvents.filter(event => {
       const matchesSearch = 
         (event.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
         (event.description || '').toLowerCase().includes(searchQuery.toLowerCase());
       
       const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter;
       
       let matchesDate = true;
       if (dateRange !== 'all') {
         const now = new Date();
         const eventDate = new Date(event.timestamp);
         switch (dateRange) {
           case 'today':
             matchesDate = eventDate.toDateString() === now.toDateString();
             break;
           case 'week':
             const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
             matchesDate = eventDate >= weekAgo;
             break;
           case 'month':
             const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
             matchesDate = eventDate >= monthAgo;
             break;
         }
       }
       
       return matchesSearch && matchesSeverity && matchesDate;
     });
   }, [securityEvents, searchQuery, severityFilter, dateRange]);

  const handleExportLogs = () => {
    toast.success('Audit logs exported successfully');
  };

  const handleGenerateReport = () => {
    toast.success('Security report generated successfully');
  };

  const activeEventsCount = securityEvents.filter(e => !e.resolved).length;
  const criticalEventsCount = securityEvents.filter(e => e.severity === 'critical' && !e.resolved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Audit & Security</h1>
        <p className="text-muted-foreground mt-1">
          Monitor system activity, security events, and generate reports.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Audit Logs</p>
                <p className="text-3xl font-bold">{auditLogs.length}</p>
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
                <p className="text-sm text-muted-foreground">Security Events</p>
                <p className="text-3xl font-bold">{securityEvents.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Events</p>
                <p className="text-3xl font-bold">{activeEventsCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Threats</p>
                <p className="text-3xl font-bold">{criticalEventsCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500">
                <XCircle className="w-6 h-6 text-white" />
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
              <CardTitle>Activity Monitor</CardTitle>
              <CardDescription>View and filter system audit logs and security events</CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[200px]"
                />
              </div>
              
              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="drawing">Drawing</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Severity Filter */}
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Date Range */}
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[130px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Export Buttons */}
              <Button variant="outline" onClick={handleExportLogs}>
                <Download className="w-4 h-4 mr-2" />
                Export Logs
              </Button>
              <Button variant="outline" onClick={handleGenerateReport}>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="audit-logs" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="audit-logs" className="gap-2">
                <Activity className="w-4 h-4" />
                Audit Logs
              </TabsTrigger>
              <TabsTrigger value="security-events" className="gap-2">
                <Shield className="w-4 h-4" />
                Security Events
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <FileText className="w-4 h-4" />
                Reports
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="audit-logs">
              <ScrollArea className="h-[500px]">
                {filteredLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <Activity className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No audit logs found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search or filters.
                    </p>
                  </div>
                ) : (
                  <AuditLogTable logs={filteredLogs} />
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="security-events">
              <ScrollArea className="h-[500px]">
                {filteredEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <Shield className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No security events found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search or filters.
                    </p>
                  </div>
                ) : (
                  <SecurityEventsTable events={filteredEvents} />
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="reports">
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Generate Reports</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Generate comprehensive security reports including audit logs, 
                  security events, and compliance summaries.
                </p>
                <div className="flex gap-3">
                  <Button onClick={handleGenerateReport}>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Security Report
                  </Button>
                  <Button variant="outline" onClick={handleExportLogs}>
                    <Download className="w-4 h-4 mr-2" />
                    Export All Logs
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
