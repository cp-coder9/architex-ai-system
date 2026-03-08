import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore, useProjectStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Project, Milestone, Drawing } from '@/types';
import {
  Search,
  Eye,
  Clock,
  CheckCircle2,
  FileText,
  Calendar,
  MapPin,
  Building2,
  AlertCircle,
} from 'lucide-react';

// Project Detail Dialog
function ProjectDetailDialog({ project, isOpen, onClose }: { project: Project; isOpen: boolean; onClose: () => void }) {
  const allDrawings = useProjectStore(state => state.drawings);
  const allTimeEntries = useProjectStore(state => state.timeEntries);

  const drawings = useMemo(() =>
    allDrawings.filter(d => d.projectId === project.id),
    [allDrawings, project.id]
  );

  const _timeEntries = useMemo(() =>
    allTimeEntries.filter(te => te.projectId === project.id),
    [allTimeEntries, project.id]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{project.name}</DialogTitle>
          <DialogDescription>{project.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className="mt-1">{project.status}</Badge>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{project.projectType}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Budget</p>
              <p className="font-medium">R{project.budget.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Deadline</p>
              <p className="font-medium">
                {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set'}
              </p>
            </div>
          </div>

          {/* Hours Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">Hours Usage</p>
              <p className="text-sm text-muted-foreground">
                {project.hoursUsed} / {project.hoursAllocated} hours
              </p>
            </div>
            <Progress value={(project.hoursUsed / project.hoursAllocated) * 100} className="h-3" />
          </div>

          {/* Milestones */}
          <div>
            <p className="font-medium mb-3">Milestones</p>
            <div className="space-y-2">
              {project.milestones.map((milestone: Milestone) => (
                <div key={milestone.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {milestone.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : milestone.status === 'in_progress' ? (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                    )}
                    <span>{milestone.name}</span>
                  </div>
                  <Badge variant={milestone.status === 'completed' ? 'default' : 'outline'}>
                    {milestone.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Drawings */}
          <div>
            <p className="font-medium mb-3">Drawings ({drawings.length})</p>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {drawings.map((drawing: Drawing) => (
                  <div key={drawing.id} className="flex items-center justify-between p-3 rounded-lg border">
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
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MyProjects() {
  const { currentUser } = useAuthStore();
  const allProjects = useProjectStore(state => state.projects);

  const projects = useMemo(() =>
    allProjects.filter(p => p.clientId === currentUser?.id),
    [allProjects, currentUser?.id]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filter projects
  const filteredProjects = projects.filter(project =>
    (project.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'draft': return 'bg-gray-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
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
        <h1 className="text-3xl font-bold">My Projects</h1>
        <p className="text-muted-foreground mt-1">
          View and track all your architectural projects.
        </p>
      </motion.div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
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
                      <p className="text-sm text-muted-foreground capitalize">{project.projectType}</p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(project.status)} text-white`}>
                    {project.status}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {project.description}
                </p>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Hours</span>
                      <span>{project.hoursUsed} / {project.hoursAllocated}</span>
                    </div>
                    <Progress value={(project.hoursUsed / project.hoursAllocated) * 100} className="h-2" />
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}</span>
                    </div>
                  </div>

                  {project.address && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{project.address}</span>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  className="w-full mt-4"
                  onClick={() => {
                    setSelectedProject(project);
                    setIsDetailOpen(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Project Detail Dialog */}
      {selectedProject && (
        <ProjectDetailDialog
          project={selectedProject}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
}
