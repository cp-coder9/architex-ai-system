import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore, useProjectStore, useInvoiceStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  FolderKanban,
  Clock,
  FileText,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock3,
  ArrowRight,
  Plus,
  Eye,
  Building2,
  BarChart3,
  Zap,
} from 'lucide-react';

// Animated Counter
function AnimatedCounter({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  setTimeout(() => {
    if (displayValue < value) {
      setDisplayValue(Math.min(displayValue + Math.ceil(value / 20), value));
    }
  }, 50);

  return <span>{prefix}{displayValue.toLocaleString()}</span>;
}

// Project Card
function ProjectCard({ project }: { project: any }) {
  const allDrawings = useProjectStore(state => state.drawings);

  const drawings = useMemo(() =>
    allDrawings.filter(d => d.projectId === project.id),
    [allDrawings, project.id]
  );

  const approvedDrawings = useMemo(() =>
    drawings.filter(d => d.status === 'approved').length,
    [drawings]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border bg-card hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {project.thumbnail ? (
            <img src={project.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          )}
          <div>
            <h3 className="font-semibold">{project.name}</h3>
            <p className="text-sm text-muted-foreground">{project.projectType}</p>
          </div>
        </div>
        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
          {project.status}
        </Badge>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Hours</span>
            <span>{project.hoursUsed} / {project.hoursAllocated}</span>
          </div>
          <Progress value={(project.hoursUsed / project.hoursAllocated) * 100} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Drawings</span>
          <span>{approvedDrawings} / {drawings.length} approved</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Deadline</span>
          <span>{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set'}</span>
        </div>
      </div>

      <Button variant="ghost" size="sm" className="w-full mt-4">
        <Eye className="w-4 h-4 mr-2" />
        View Details
      </Button>
    </motion.div>
  );
}

export function ClientOverview() {
  const { currentUser } = useAuthStore();
  const allProjects = useProjectStore(state => state.projects);
  const allDrawings = useProjectStore(state => state.drawings);
  const allInvoices = useInvoiceStore(state => state.invoices);

  const projects = useMemo(() =>
    allProjects.filter(p => p.clientId === currentUser?.id),
    [allProjects, currentUser?.id]
  );

  const drawings = useMemo(() =>
    allDrawings.filter(d => projects.some(p => p.id === d.projectId)),
    [allDrawings, projects]
  );

  const invoices = useMemo(() =>
    allInvoices.filter(inv => inv.clientId === currentUser?.id),
    [allInvoices, currentUser?.id]
  );

  // Calculate stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalHoursUsed = projects.reduce((sum, p) => sum + p.hoursUsed, 0);
  const totalHoursAllocated = projects.reduce((sum, p) => sum + p.hoursAllocated, 0);
  const totalDrawingsCount = drawings.length;
  const approvedDrawingsCount = drawings.filter(d => d.status === 'approved').length;

  const pendingInvoices = invoices.filter(inv => inv.status === 'sent').length;
  const totalPendingAmount = invoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.total, 0);

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
          Here's an overview of your projects and progress.
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
                <FolderKanban className="w-6 h-6 text-white" />
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
                <p className="text-xs text-muted-foreground">of {totalHoursAllocated} allocated</p>
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
                <p className="text-sm text-muted-foreground">Drawings</p>
                <p className="text-3xl font-bold">{approvedDrawingsCount}/{totalDrawingsCount}</p>
                <p className="text-xs text-muted-foreground">approved</p>
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
                <p className="text-sm text-muted-foreground">Pending Invoices</p>
                <p className="text-3xl font-bold">{pendingInvoices}</p>
                <p className="text-xs text-muted-foreground">R${totalPendingAmount.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Projects</h2>
          <Button variant="outline" className="gap-2">
            View All
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.slice(0, 3).map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Drawings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Recent Drawings
            </CardTitle>
            <CardDescription>Latest drawing submissions and approvals</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                {drawings
                  .slice(0, 5)
                  .map((drawing, index) => (
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
                          <CheckCircle2 className={`w-4 h-4 ${drawing.status === 'approved' ? 'text-green-600' :
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
                      <Badge variant={drawing.status === 'approved' ? 'default' : 'secondary'}>
                        {drawing.status}
                      </Badge>
                    </motion.div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                <Plus className="w-5 h-5" />
                <span className="text-sm">New Project</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm">Buy Hours</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                <Eye className="w-5 h-5" />
                <span className="text-sm">View Drawings</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                <FileText className="w-5 h-5" />
                <span className="text-sm">Invoices</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
