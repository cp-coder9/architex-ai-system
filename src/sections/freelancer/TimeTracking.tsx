import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore, useProjectStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Clock,
  Play,
  Pause,
  Plus,
  Calendar,
  Briefcase,
  FileText,
  Trash2,
  Edit2,
  CheckCircle2,
} from 'lucide-react';

// Timer Component
function Timer({ onStop }: { onStop: (hours: number) => void }) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Timer logic would go here with useEffect
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4">
      <div className="text-4xl font-mono font-bold">
        {formatTime(seconds)}
      </div>
      <Button
        variant={isRunning ? 'secondary' : 'default'}
        size="lg"
        onClick={() => {
          if (isRunning) {
            setIsRunning(false);
            onStop(seconds / 3600);
          } else {
            setIsRunning(true);
          }
        }}
      >
        {isRunning ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
        {isRunning ? 'Stop' : 'Start'}
      </Button>
    </div>
  );
}

export function TimeTracking() {
  const { currentUser } = useAuthStore();
  const { projects, timeEntries, addTimeEntry } = useProjectStore();

  const [selectedProject, setSelectedProject] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const myProjects = useMemo(() =>
    projects.filter(p => p.freelancerId === currentUser?.id),
    [projects, currentUser?.id]
  );
  const myTimeEntries = useMemo(() =>
    timeEntries.filter(te => te.freelancerId === currentUser?.id),
    [timeEntries, currentUser?.id]
  );

  // Calculate weekly hours
  const weeklyHours = useMemo(() =>
    myTimeEntries
      .filter(te => {
        const entryDate = new Date(te.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return entryDate >= weekAgo;
      })
      .reduce((sum, te) => sum + te.hours, 0),
    [myTimeEntries]
  );

  const monthlyHours = useMemo(() =>
    myTimeEntries
      .filter(te => {
        const entryDate = new Date(te.date);
        return entryDate.getMonth() === new Date().getMonth();
      })
      .reduce((sum, te) => sum + te.hours, 0),
    [myTimeEntries]
  );

  const handleAddTimeEntry = () => {
    if (!selectedProject || !description || !hours) {
      toast.error('Please fill in all fields');
      return;
    }

    addTimeEntry({
      projectId: selectedProject,
      freelancerId: currentUser?.id || '',
      description,
      hours: parseFloat(hours),
      date: new Date(date),
    });

    toast.success('Time entry added successfully');
    setDescription('');
    setHours('');
  };

  const handleTimerStop = (hours: number) => {
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    addTimeEntry({
      projectId: selectedProject,
      freelancerId: currentUser?.id || '',
      description: 'Timer session',
      hours: Math.round(hours * 100) / 100,
      date: new Date(),
    });

    toast.success(`Logged ${hours.toFixed(2)} hours`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Time Tracking</h1>
        <p className="text-muted-foreground mt-1">
          Log and manage your work hours across projects.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-3xl font-bold">{weeklyHours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">hours</p>
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
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-3xl font-bold">{monthlyHours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">hours</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-3xl font-bold">{myTimeEntries.length}</p>
                <p className="text-xs text-muted-foreground">entries</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timer & Quick Add */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timer
            </CardTitle>
            <CardDescription>Track time in real-time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Project</Label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Select a project</option>
                {myProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <Timer onStop={handleTimerStop} />
          </CardContent>
        </Card>

        {/* Manual Entry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Time Entry
            </CardTitle>
            <CardDescription>Manually log your hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Select a project</option>
                {myProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you work on?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hours</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleAddTimeEntry} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Recent Time Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {myTimeEntries.slice().reverse().map((entry, index) => {
                const project = projects.find(p => p.id === entry.projectId);
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{entry.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {project?.name} • {new Date(entry.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">{entry.hours} hrs</p>
                        <p className="text-xs text-muted-foreground">
                          R${(entry.hours * 75).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={entry.invoiced ? 'default' : 'secondary'}>
                        {entry.invoiced ? 'Invoiced' : 'Pending'}
                      </Badge>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
