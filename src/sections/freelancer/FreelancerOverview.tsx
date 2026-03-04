import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore, useProjectStore, useInvoiceStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Briefcase,
  Clock,
  DollarSign,
  FileText,
  Zap,
  BarChart3,
  ArrowRight,
} from 'lucide-react';



export function FreelancerOverview() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const allProjects = useProjectStore(state => state.projects);
  const allDrawings = useProjectStore(state => state.drawings);
  const allTimeEntries = useProjectStore(state => state.timeEntries);
  const allInvoices = useInvoiceStore(state => state.invoices);

  // Memoize filtered data to avoid creating new arrays on every render
  const projects = useMemo(() =>
    allProjects.filter(p => p.freelancerId === currentUser?.id),
    [allProjects, currentUser?.id]
  );
  const drawings = useMemo(() => allDrawings, [allDrawings]);
  const timeEntries = useMemo(() =>
    allTimeEntries.filter(te => te.freelancerId === currentUser?.id),
    [allTimeEntries, currentUser?.id]
  );
  const invoices = useMemo(() =>
    allInvoices.filter(inv => inv.freelancerId === currentUser?.id),
    [allInvoices, currentUser?.id]
  );

  // Calculate stats
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalHoursThisMonth = timeEntries
    .filter(te => new Date(te.date).getMonth() === new Date().getMonth())
    .reduce((sum, te) => sum + te.hours, 0);

  const totalEarnings = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  const pendingEarnings = invoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.total, 0);

  const myDrawings = drawings.filter(d => projects.some(p => p.id === d.projectId));
  const approvedDrawings = myDrawings.filter(d => d.status === 'approved').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Welcome back, {currentUser?.name?.split(' ')[0]}!</h1>
        <p className="text-muted-foreground mt-1">
          Here's your work overview and performance metrics.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-3xl font-bold">{activeProjects}</p>
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
                <p className="text-sm text-muted-foreground">Hours This Month</p>
                <p className="text-3xl font-bold">{totalHoursThisMonth}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-3xl font-bold">R{totalEarnings.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drawings Approved</p>
                <p className="text-3xl font-bold">{approvedDrawings}/{myDrawings.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Active Projects
                </CardTitle>
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {projects.filter(p => p.status === 'active').map((project, index) => (
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
                          <p className="text-sm text-muted-foreground">{project.clientId}</p>
                        </div>
                        <Badge>Active</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Hours</span>
                          <span>{project.hoursUsed} / {project.hoursAllocated}</span>
                        </div>
                        <Progress value={(project.hoursUsed / project.hoursAllocated) * 100} className="h-2" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Deadline</span>
                          <span>{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set'}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Earnings Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Earnings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50">
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold text-green-600">R{totalEarnings.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-50">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">R{pendingEarnings.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                  onClick={() => navigate('/freelancer/time')}
                >
                  <Plus className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Log Time</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                  onClick={() => navigate('/freelancer/drawings')}
                >
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Submit Drawing</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                  onClick={() => navigate('/freelancer/work')}
                >
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">View Schedule</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                  onClick={() => navigate('/freelancer/earnings')}
                >
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Drawings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent Drawings
          </CardTitle>
          <CardDescription>Your latest drawing submissions and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {myDrawings.slice(0, 5).map((drawing, index) => (
                <motion.div
                  key={drawing.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${drawing.status === 'approved' ? 'bg-green-100' :
                      drawing.status === 'pending' ? 'bg-gray-100' :
                        drawing.status === 'in_review' ? 'bg-blue-100' : 'bg-orange-100'
                      }`}>
                      <FileText className={`w-4 h-4 ${drawing.status === 'approved' ? 'text-green-600' :
                        drawing.status === 'pending' ? 'text-gray-600' :
                          drawing.status === 'in_review' ? 'text-blue-600' : 'text-orange-600'
                        }`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{drawing.name}</p>
                      <p className="text-xs text-muted-foreground">
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
    </div>
  );
}
