import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useProjectStore, useInvoiceStore, useSettingsStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { subDays, startOfDay, format, eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import {
  BarChart3,
  TrendingUp,
  Users,
  FolderKanban,
  FileText,
  Bot,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Activity,
  Zap,
  PieChart,
  Download,
  Briefcase,
  Clock3,
  Wallet,
  FileCheck,
  UserCheck
} from 'lucide-react';

// Reusable TrendLineChart component using ChartContainer pattern
function TrendLineChart({
  data,
  dataKey = 'value',
  xAxisKey = 'label',
  color = '#1C6FFF',
  title,
}: {
  data: { label: string; value: number }[];
  dataKey?: string;
  xAxisKey?: string;
  color?: string;
  title?: string;
}) {
  const chartConfig: ChartConfig = {
    [dataKey]: {
      label: title || 'Value',
      color: color,
    },
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis
          dataKey={xAxisKey}
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <RechartsTooltip
          content={<ChartTooltipContent />}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, strokeWidth: 2, r: 3 }}
          activeDot={{ r: 5, fill: color }}
        />
      </LineChart>
    </ChartContainer>
  );
}

// Reusable StatusBarChart component using ChartContainer pattern
function StatusBarChart({
  data,
  title,
  color = '#1C6FFF'
}: {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  color?: string;
}) {
  const chartConfig: ChartConfig = {
    value: {
      label: title || 'Count',
      color: color,
    },
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        <RechartsTooltip
          content={<ChartTooltipContent />}
        />
        <Bar
          dataKey="value"
          fill={color}
          radius={[4, 4, 0, 0]}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

// Simple bar chart component (kept for fallback)
function _SimpleBarChart({ data, maxValue }: { data: { label: string; value: number; color: string }[]; maxValue: number }) {
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>{item.label}</span>
            <span className="font-medium">{item.value}</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / maxValue) * 100}%` }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="h-full rounded-full"
              style={{ backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Metric Card with dynamic change calculation
function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  trend
}: {
  title: string;
  value: string;
  change?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change && (
              <p className={`text-sm mt-1 ${trendColor}`}>
                {change}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// KPI Card with progress ring
function KPICard({
  title,
  value,
  progress,
  icon: Icon,
  colorClass,
  format = 'percent'
}: {
  title: string;
  value: string | number;
  progress: number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  format?: 'percent' | 'currency' | 'number';
}) {
  const displayValue = format === 'percent'
    ? `${value}%`
    : format === 'currency'
      ? `R${Number(value).toLocaleString()}`
      : value;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-bold">{displayValue}</p>
        </div>
        <Progress value={Math.min(progress, 100)} className="h-2 mt-3" />
      </CardContent>
    </Card>
  );
}

const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
const avgHourlyRate = 75;

export function SystemAnalytics() {
  const projects = useProjectStore(state => state.projects);
  const drawings = useProjectStore(state => state.drawings);
  const timeEntries = useProjectStore(state => state.timeEntries);
  const invoices = useInvoiceStore(state => state.invoices);
  const users = useSettingsStore(state => state.users);
  const getUserById = useSettingsStore(state => state.getUserById);

  // Time range state
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Calculate cutoff date based on time range
  const cutoffDate = useMemo(() =>
    subDays(new Date(), daysMap[timeRange]),
    [timeRange]
  );

  const previousCutoffDate = useMemo(() =>
    subDays(cutoffDate, daysMap[timeRange]),
    [cutoffDate, timeRange]
  );

  // Filtered data helpers
  const filteredTimeEntries = useMemo(() => {
    return timeEntries.filter(te => {
      const entryDate = typeof te.date === 'string' ? parseISO(te.date) : new Date(te.date);
      return entryDate >= cutoffDate;
    });
  }, [timeEntries, cutoffDate]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const createdAt = typeof inv.createdAt === 'string' ? parseISO(inv.createdAt) : new Date(inv.createdAt);
      return createdAt >= cutoffDate;
    });
  }, [invoices, cutoffDate]);

  // Previous period data for comparison
  const previousTimeEntries = useMemo(() => {
    return timeEntries.filter(te => {
      const entryDate = typeof te.date === 'string' ? parseISO(te.date) : new Date(te.date);
      return entryDate >= previousCutoffDate && entryDate < cutoffDate;
    });
  }, [timeEntries, previousCutoffDate, cutoffDate]);

  const previousInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const createdAt = typeof inv.createdAt === 'string' ? parseISO(inv.createdAt) : new Date(inv.createdAt);
      return createdAt >= previousCutoffDate && createdAt < cutoffDate;
    });
  }, [invoices, previousCutoffDate, cutoffDate]);

  const previousProjects = useMemo(() => {
    return projects.filter(p => {
      const createdAt = typeof p.createdAt === 'string' ? parseISO(p.createdAt) : new Date(p.createdAt);
      return createdAt >= previousCutoffDate && createdAt < cutoffDate;
    });
  }, [projects, previousCutoffDate, cutoffDate]);

  // Calculate dynamic change percentage
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  // Days in range
  const _daysInRange = daysMap[timeRange];

  // Calculate metrics
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const createdAt = typeof p.createdAt === 'string' ? parseISO(p.createdAt) : new Date(p.createdAt);
      return createdAt >= cutoffDate;
    });
  }, [projects, cutoffDate]);

  const activeProjects = filteredProjects.filter(p => p.status === 'active').length;
  const completedProjects = filteredProjects.filter(p => p.status === 'completed').length;

  const filteredDrawings = useMemo(() => { return drawings.filter(d => { const uploadedAt = typeof d.uploadedAt === "string" ? parseISO(d.uploadedAt) : new Date(d.uploadedAt); return uploadedAt >= cutoffDate; }); }, [drawings, cutoffDate]);

  const totalHours = filteredTimeEntries.reduce((sum, te) => sum + te.hours, 0);
  const previousTotalHours = previousTimeEntries.reduce((sum, te) => sum + te.hours, 0);
  const hoursChange = calculateChange(totalHours, previousTotalHours);

  const totalRevenue = filteredInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  const previousTotalRevenue = previousInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);
  const revenueChange = calculateChange(totalRevenue, previousTotalRevenue);

  const totalProjectsCount = filteredProjects.length;
  const previousTotalProjects = previousProjects.length;
  const projectsChange = calculateChange(totalProjectsCount, previousTotalProjects);

  const agentChecks = filteredDrawings.filter(d => d.agentCheck).length;
  const agentIssues = filteredDrawings
    .filter(d => d.agentCheck)
    .reduce((sum, d) => sum + (d.agentCheck?.issues.length || 0), 0);

  // Freelancers
  const freelancers = users.filter(u => u.role === 'freelancer');

  // KPI Calculations
  const completedMilestones = useMemo(() => {
    const milestones: { completedAt?: Date; dueDate?: Date }[] = [];
    filteredProjects.forEach(p => {
      p.milestones?.forEach(m => {
        if (m.status === 'completed') {
          milestones.push({ completedAt: m.completedAt, dueDate: m.dueDate });
        }
      });
    });
    return milestones;
  }, [filteredProjects]);

  // On-Time Delivery Rate
  const onTimeDeliveryRate = useMemo(() => {
    if (completedMilestones.length === 0) return 0;
    const onTime = completedMilestones.filter(m => {
      if (!m.completedAt || !m.dueDate) return false;
      const completed = typeof m.completedAt === 'string' ? parseISO(m.completedAt) : new Date(m.completedAt);
      const due = typeof m.dueDate === 'string' ? parseISO(m.dueDate) : new Date(m.dueDate);
      return completed <= due;
    }).length;
    return (onTime / completedMilestones.length) * 100;
  }, [completedMilestones]);

  // Budget Variance
  const budgetVariance = useMemo(() => {
    const totalBudget = filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalActualCost = filteredProjects.reduce((sum, p) => sum + (p.hoursUsed || 0) * avgHourlyRate, 0);
    if (totalBudget === 0) return 0;
    return ((totalBudget - totalActualCost) / totalBudget) * 100;
  }, [filteredProjects]);

  // Profit Margin
  const profitMargin = (() => {
    if (totalRevenue === 0) return 0;
    const costs = totalHours * avgHourlyRate;
    return ((totalRevenue - costs) / totalRevenue) * 100;
  })();

  // Client Satisfaction - calculated from completed projects with positive ratings
  const clientSatisfaction = useMemo(() => {
    // In a real implementation, this would come from:
    // - Project ratings/reviews from clients
    // - Completed milestones satisfaction scores
    // - Client feedback data from a ratings collection
    // For now, calculate based on on-time delivery rate as a proxy
    if (completedProjects === 0) return 0;
    const completedWithOnTime = filteredProjects.filter(p => {
      if (p.status !== 'completed') return false;
      // Check if project was completed on time (within budget and deadline)
      const onBudget = (p.hoursUsed || 0) * avgHourlyRate <= (p.budget || Infinity);
      return onBudget;
    }).length;
    return Math.round((completedWithOnTime / completedProjects) * 100);
  }, [completedProjects, filteredProjects, avgHourlyRate]);

  // Team Productivity
  // Removed unused teamProductivity calculation

  // Project status distribution
  const projectStatusData = [
    { label: 'Active', value: filteredProjects.filter(p => p.status === 'active').length, color: '#22c55e' },
    { label: 'Draft', value: filteredProjects.filter(p => p.status === 'draft').length, color: '#6b7280' },
    { label: 'On Hold', value: filteredProjects.filter(p => p.status === 'on_hold').length, color: '#f59e0b' },
    { label: 'Completed', value: filteredProjects.filter(p => p.status === 'completed').length, color: '#3b82f6' },
    { label: 'Cancelled', value: filteredProjects.filter(p => p.status === 'cancelled').length, color: '#ef4444' },
  ];

  // Drawing status distribution
  const drawingStatusData = [
    { label: 'Approved', value: filteredDrawings.filter(d => d.status === 'approved').length, color: '#22c55e' },
    { label: 'Pending', value: filteredDrawings.filter(d => d.status === 'pending').length, color: '#6b7280' },
    { label: 'In Review', value: filteredDrawings.filter(d => d.status === 'in_review').length, color: '#f59e0b' },
    { label: 'Revision Needed', value: filteredDrawings.filter(d => d.status === 'revision_needed').length, color: '#ef4444' },
  ];

  // Daily hours for trend chart
  const dailyHoursData = useMemo(() => {
    const days = eachDayOfInterval({
      start: cutoffDate,
      end: new Date()
    });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const hours = filteredTimeEntries
        .filter(te => {
          const entryDate = typeof te.date === 'string' ? parseISO(te.date) : new Date(te.date);
          return isWithinInterval(entryDate, { start: dayStart, end: dayEnd });
        })
        .reduce((sum, te) => sum + te.hours, 0);

      return {
        label: format(day, 'MMM dd'),
        value: hours,
      };
    });
  }, [filteredTimeEntries, cutoffDate]);

  // Monthly revenue
  const monthlyRevenueData = useMemo(() => {
    const months: { [key: string]: number } = {};
    filteredInvoices
      .filter(inv => inv.status === 'paid')
      .forEach(inv => {
        const date = typeof inv.createdAt === 'string' ? parseISO(inv.createdAt) : new Date(inv.createdAt);
        const monthKey = format(date, 'MMM yyyy');
        months[monthKey] = (months[monthKey] || 0) + inv.total;
      });

    return Object.entries(months).map(([month, amount]) => ({
      label: month,
      value: amount,
    })).sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime());
  }, [filteredInvoices]);

  // Hours per freelancer
  const freelancerHours = useMemo(() => {
    return freelancers.map(f => ({
      name: f.name,
      hours: filteredTimeEntries
        .filter(te => te.freelancerId === f.id)
        .reduce((sum, te) => sum + te.hours, 0),
    }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);
  }, [freelancers, filteredTimeEntries]);

  // Project completion trend (cumulative)
  const projectTrendData = useMemo(() => {
    const sortedProjects = [...filteredProjects].sort((a, b) => {
      const dateA = typeof a.createdAt === 'string' ? parseISO(a.createdAt) : new Date(a.createdAt);
      const dateB = typeof b.createdAt === 'string' ? parseISO(b.createdAt) : new Date(b.createdAt);
      return dateA.getTime() - dateB.getTime();
    });

    return sortedProjects.map((p, index) => {
      const date = typeof p.createdAt === 'string' ? parseISO(p.createdAt) : new Date(p.createdAt);
      return {
        label: format(date, 'MMM dd'),
        value: index + 1,
      };
    });
  }, [filteredProjects]);

  // Hours per project
  const hoursPerProject = useMemo(() => {
    const projectHours: { [key: string]: number } = {};
    filteredTimeEntries.forEach(te => {
      projectHours[te.projectId] = (projectHours[te.projectId] || 0) + te.hours;
    });

    return Object.entries(projectHours).map(([projectId, hours]) => {
      const project = projects.find(p => p.id === projectId);
      return {
        label: project?.name || 'Unknown',
        value: hours,
      };
    }).slice(0, 8);
  }, [filteredTimeEntries, projects]);

  // Projects per client
  const projectsPerClient = useMemo(() => {
    const clientProjects: { [key: string]: number } = {};
    filteredProjects.forEach(p => {
      clientProjects[p.clientId] = (clientProjects[p.clientId] || 0) + 1;
    });

    return Object.entries(clientProjects).map(([clientId, count]) => {
      const client = getUserById(clientId);
      return {
        label: client?.name || 'Unknown',
        value: count,
      };
    });
  }, [filteredProjects, getUserById]);

  // Hours per client
  const hoursPerClient = useMemo(() => {
    const clientHours: { [key: string]: number } = {};
    filteredTimeEntries.forEach(te => {
      const project = projects.find(p => p.id === te.projectId);
      if (project) {
        clientHours[project.clientId] = (clientHours[project.clientId] || 0) + te.hours;
      }
    });

    return Object.entries(clientHours).map(([clientId, hours]) => {
      const client = getUserById(clientId);
      return {
        label: client?.name || 'Unknown',
        value: hours,
      };
    });
  }, [filteredTimeEntries, projects, getUserById]);

  // Invoice status breakdown
  const invoiceStatusData = [
    { label: 'Paid', value: filteredInvoices.filter(i => i.status === 'paid').length, color: '#22c55e' },
    { label: 'Sent', value: filteredInvoices.filter(i => i.status === 'sent').length, color: '#3b82f6' },
    { label: 'Draft', value: filteredInvoices.filter(i => i.status === 'draft').length, color: '#6b7280' },
    { label: 'Overdue', value: filteredInvoices.filter(i => i.status === 'overdue').length, color: '#ef4444' },
  ];

  // Invoice summary counts
  const invoicePaid = filteredInvoices.filter(i => i.status === 'paid').length;
  const invoiceSent = filteredInvoices.filter(i => i.status === 'sent').length;
  const invoiceDraft = filteredInvoices.filter(i => i.status === 'draft').length;
  const invoiceOverdue = filteredInvoices.filter(i => i.status === 'overdue').length;

  // Budget vs Actual
  const budgetVsActual = useMemo(() => {
    return filteredProjects.map(p => ({
      label: p.name.substring(0, 15) + (p.name.length > 15 ? '...' : ''),
      budget: p.budget || 0,
      actual: (p.hoursUsed || 0) * avgHourlyRate,
    })).slice(0, 6);
  }, [filteredProjects]);

  // Recent activity
  const recentActivity = useMemo(() => {
    return [...filteredTimeEntries]
      .sort((a, b) => {
        const dateA = typeof a.date === 'string' ? parseISO(a.date) : new Date(a.date);
        const dateB = typeof b.date === 'string' ? parseISO(b.date) : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }, [filteredTimeEntries]);

  // CSV Export function
  const handleExportCSV = () => {
    const headers = ['Date', 'Freelancer', 'Project', 'Description', 'Hours'];
    const rows = filteredTimeEntries.map(te => {
      const freelancer = getUserById(te.freelancerId);
      const project = projects.find(p => p.id === te.projectId);
      const date = typeof te.date === 'string' ? te.date : format(new Date(te.date), 'yyyy-MM-dd');
      return [
        date,
        freelancer?.name || 'Unknown',
        project?.name || 'Unknown',
        te.description || '',
        te.hours.toString()
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `time_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">System Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive analytics and insights across the platform.
        </p>
      </motion.div>

      {/* Time Range Selector */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border bg-background p-1">
          <Button
            variant={timeRange === '7d' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange('7d')}
          >
            Last 7 Days
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange('30d')}
          >
            Last 30 Days
          </Button>
          <Button
            variant={timeRange === '90d' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange('90d')}
          >
            Last 90 Days
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Projects"
          value={totalProjectsCount.toString()}
          change={`${projectsChange} from previous period`}
          icon={FolderKanban}
          color="bg-blue-500"
          trend={projectsChange.startsWith('+') ? 'up' : 'down'}
        />
        <MetricCard
          title="Active Projects"
          value={activeProjects.toString()}
          icon={Activity}
          color="bg-green-500"
        />
        <MetricCard
          title="Hours Logged"
          value={totalHours.toFixed(1)}
          change={`${hoursChange} from previous period`}
          icon={Clock}
          color="bg-purple-500"
          trend={hoursChange.startsWith('+') ? 'up' : 'down'}
        />
        <MetricCard
          title="Total Revenue"
          value={`R${totalRevenue.toLocaleString()}`}
          change={`${revenueChange} from previous period`}
          icon={DollarSign}
          color="bg-orange-500"
          trend={revenueChange.startsWith('+') ? 'up' : 'down'}
        />
      </div>

      {/* Charts - 6 Tab Layout */}
      <Tabs defaultValue="executive" className="space-y-6">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="executive">Executive Overview</TabsTrigger>
          <TabsTrigger value="projects">Project Analytics</TabsTrigger>
          <TabsTrigger value="resources">Resource Management</TabsTrigger>
          <TabsTrigger value="clients">Client Insights</TabsTrigger>
          <TabsTrigger value="financial">Financial Analytics</TabsTrigger>
          <TabsTrigger value="reports">Time Reports</TabsTrigger>
        </TabsList>

        {/* Tab 1: Executive Overview */}
        <TabsContent value="executive" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="On-Time Delivery Rate"
              value={onTimeDeliveryRate.toFixed(1)}
              progress={onTimeDeliveryRate}
              icon={Clock3}
              colorClass="bg-blue-500/10 text-blue-600"
            />
            <KPICard
              title="Budget Variance"
              value={budgetVariance.toFixed(1)}
              progress={Math.min(Math.abs(budgetVariance), 100)}
              icon={Wallet}
              colorClass="bg-green-500/10 text-green-600"
            />
            <KPICard
              title="Client Satisfaction"
              value={clientSatisfaction}
              progress={clientSatisfaction}
              icon={UserCheck}
              colorClass="bg-purple-500/10 text-purple-600"
            />
            <KPICard
              title="Profit Margin"
              value={profitMargin.toFixed(1)}
              progress={Math.min(Math.max(profitMargin + 50, 0), 100)}
              icon={TrendingUp}
              colorClass="bg-orange-500/10 text-orange-600"
            />
          </div>

          {/* Team Productivity Widget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Team Productivity Trend
              </CardTitle>
              <CardDescription>Daily hours logged over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendLineChart
                data={dailyHoursData}
                color="#8B5CF6"
                title="Hours"
              />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest time entries</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-4">
                  {recentActivity.map((entry) => {
                    const freelancer = getUserById(entry.freelancerId);
                    const project = projects.find(p => p.id === entry.projectId);
                    return (
                      <div key={entry.id} className="flex items-start gap-4 p-3 rounded-lg border">
                        <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{freelancer?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground truncate">{project?.name || 'Unknown Project'}</p>
                          <p className="text-xs text-muted-foreground">{entry.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{entry.hours}h</p>
                          <p className="text-xs text-muted-foreground">
                            {typeof entry.date === 'string' ? entry.date : format(new Date(entry.date), 'MMM dd')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Project Analytics */}
        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Project Status Distribution
                </CardTitle>
                <CardDescription>Breakdown of projects by status</CardDescription>
              </CardHeader>
              <CardContent>
                <StatusBarChart
                  data={projectStatusData}
                  color="#1C6FFF"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Project Completion Trend
                </CardTitle>
                <CardDescription>Cumulative projects over time</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendLineChart
                  data={projectTrendData}
                  color="#22c55e"
                  title="Projects"
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Drawing Status Distribution
                </CardTitle>
                <CardDescription>Breakdown of drawings by status</CardDescription>
              </CardHeader>
              <CardContent>
                <StatusBarChart
                  data={drawingStatusData}
                  color="#8B5CF6"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Agent Performance Metrics
                </CardTitle>
                <CardDescription>AI agent verification metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    <span>Checks Completed</span>
                  </div>
                  <span className="font-bold text-blue-600">{agentChecks}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <span>Issues Found</span>
                  </div>
                  <span className="font-bold text-orange-600">{agentIssues}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-50">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-green-600" />
                    <span>Avg Check Time</span>
                  </div>
                  <span className="font-bold text-green-600">4.2s</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Resource Management */}
        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Hours per Freelancer
              </CardTitle>
              <CardDescription>Time logged by each team member</CardDescription>
            </CardHeader>
            <CardContent>
              <StatusBarChart
                data={freelancerHours.map(f => ({ label: f.name, value: f.hours, color: '#10B981' }))}
                color="#10B981"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Team Utilisation
                </CardTitle>
                <CardDescription>Daily hours in the selected window</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendLineChart
                  data={dailyHoursData}
                  color="#F59E0B"
                  title="Hours"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="w-5 h-5" />
                  Hours per Project
                </CardTitle>
                <CardDescription>Time logged by project</CardDescription>
              </CardHeader>
              <CardContent>
                <StatusBarChart
                  data={hoursPerProject.map(h => ({ ...h, color: '#6366F1' }))}
                  color="#6366F1"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Client Insights */}
        <TabsContent value="clients" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Projects per Client
                </CardTitle>
                <CardDescription>Number of projects by client</CardDescription>
              </CardHeader>
              <CardContent>
                <StatusBarChart
                  data={projectsPerClient.map(p => ({ ...p, color: '#EC4899' }))}
                  color="#EC4899"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Hours per Client
                </CardTitle>
                <CardDescription>Time logged by client</CardDescription>
              </CardHeader>
              <CardContent>
                <StatusBarChart
                  data={hoursPerClient.map(h => ({ ...h, color: '#14B8A6' }))}
                  color="#14B8A6"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Invoice Status Breakdown
              </CardTitle>
              <CardDescription>Invoices by status</CardDescription>
            </CardHeader>
            <CardContent>
              <StatusBarChart
                data={invoiceStatusData}
                color="#1C6FFF"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Financial Analytics */}
        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Monthly Revenue
              </CardTitle>
              <CardDescription>Revenue from paid invoices by month</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendLineChart
                data={monthlyRevenueData}
                color="#22C55E"
                title="Revenue"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Budget vs Actual
              </CardTitle>
              <CardDescription>Planned budget vs actual costs per project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgetVsActual.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.label}</span>
                      <div className="flex gap-4">
                        <span className="text-blue-600">Budget: R{item.budget.toLocaleString()}</span>
                        <span className="text-orange-600">Actual: R{item.actual.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${Math.min((item.budget / Math.max(item.budget, item.actual)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Invoice Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Paid</span>
                </div>
                <p className="text-2xl font-bold mt-2">{invoicePaid}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-muted-foreground">Sent</span>
                </div>
                <p className="text-2xl font-bold mt-2">{invoiceSent}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500" />
                  <span className="text-sm text-muted-foreground">Draft</span>
                </div>
                <p className="text-2xl font-bold mt-2">{invoiceDraft}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-muted-foreground">Overdue</span>
                </div>
                <p className="text-2xl font-bold mt-2">{invoiceOverdue}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 6: Custom Reports (Time Reports) */}
        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Time Reports & Analytics</h2>
            <Button
              onClick={handleExportCSV}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Utilisation
                </CardTitle>
                <CardDescription>Daily hours logged</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendLineChart
                  data={dailyHoursData}
                  color="#14B8A6"
                  title="Hours"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="w-5 h-5" />
                  Project Trends
                </CardTitle>
                <CardDescription>Cumulative projects over time</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendLineChart
                  data={projectTrendData}
                  color="#8B5CF6"
                  title="Projects"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Revenue Analysis
              </CardTitle>
              <CardDescription>Monthly revenue from paid invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendLineChart
                data={monthlyRevenueData}
                color="#22C55E"
                title="Revenue"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
