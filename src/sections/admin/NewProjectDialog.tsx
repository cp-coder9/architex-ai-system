import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { useProjectStore, useSettingsStore } from '@/store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { RefreshCw, CalendarIcon, Plus, X } from 'lucide-react';

const projectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  clientId: z.string().min(1, 'Please select a client'),
  budget: z.number().positive('Budget must be positive'),
  targetDate: z.date().optional(),
  leadFreelancerId: z.string().optional(),
  teamMemberIds: z.array(z.string()).optional(),
  initialTasks: z.array(z.object({ name: z.string() })).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewProjectDialog({ open, onOpenChange }: NewProjectDialogProps) {
  const projectStore = useProjectStore();
  const settingsStore = useSettingsStore();
  
  const [referenceNumber, setReferenceNumber] = useState('');
  const [tasks, setTasks] = useState<{ name: string }[]>([]);
  const [newTaskName, setNewTaskName] = useState('');
  
  const clients = settingsStore.getUsersByRole('client');
  const freelancers = settingsStore.getUsersByRole('freelancer');
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      clientId: '',
      budget: 0,
      targetDate: undefined,
      leadFreelancerId: '',
      teamMemberIds: [],
      initialTasks: [],
    },
  });
  
  const selectedLeadFreelancer = watch('leadFreelancerId');
  const selectedTeamMembers = watch('teamMemberIds') || [];
  
  // Generate reference number on mount and when dialog opens
  useEffect(() => {
    if (open) {
      generateReferenceNumber();
      reset();
      setTasks([]);
    }
  }, [open]);
  
  const generateReferenceNumber = () => {
    const uuid = uuidv4().split('-')[0].toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    setReferenceNumber(`PROJ-${uuid}-${timestamp}`);
  };
  
  const handleAddTask = () => {
    if (newTaskName.trim()) {
      setTasks([...tasks, { name: newTaskName.trim() }]);
      setNewTaskName('');
    }
  };
  
  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };
  
  const handleTeamMemberToggle = (freelancerId: string) => {
    const current = selectedTeamMembers || [];
    if (current.includes(freelancerId)) {
      setValue('teamMemberIds', current.filter(id => id !== freelancerId));
    } else {
      setValue('teamMemberIds', [...current, freelancerId]);
    }
  };
  
  const onSubmit = async (data: ProjectFormData) => {
    try {
      // Use local tasks state instead of data.initialTasks to persist user-added tasks
      const milestones = tasks.map((task, index) => ({
        id: `ms-${Date.now()}-${index}`,
        projectId: '',
        name: task.name,
        description: '',
        status: 'pending' as const,
        order: index,
      }));
      
      await projectStore.createProject({
        name: data.title,
        description: data.description,
        clientId: data.clientId,
        budget: data.budget,
        deadline: data.targetDate,
        freelancerId: data.leadFreelancerId,
        teamMembers: data.teamMemberIds,
        referenceNumber,
        hoursAllocated: 1, // Safe default to prevent NaN/Infinity
        milestones: milestones,
      });
      
      toast.success('Project created successfully!');
      onOpenChange(false);
    } catch (_error) {
      toast.error('Failed to create project');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new project.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden">
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {/* Reference Number */}
              <div className="space-y-2">
                <Label>Reference Number</Label>
                <div className="flex gap-2">
                  <Input
                    value={referenceNumber}
                    readOnly
                    className="bg-muted"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={generateReferenceNumber}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Project Title and Description */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter project title"
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter project description"
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>
              </div>
              
              {/* Client and Budget */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client *</Label>
                  <Select
                    value={watch('clientId')}
                    onValueChange={(value) => setValue('clientId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.company})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.clientId && (
                    <p className="text-sm text-red-500">{errors.clientId.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (R) *</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="Enter budget"
                    {...register('budget', { valueAsNumber: true })}
                  />
                  {errors.budget && (
                    <p className="text-sm text-red-500">{errors.budget.message}</p>
                  )}
                </div>
              </div>
              
              {/* Target Date and Lead Freelancer */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch('targetDate') ? watch('targetDate')!.toLocaleDateString() : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watch('targetDate')}
                        onSelect={(date) => setValue('targetDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Lead Freelancer</Label>
                  <Select
                    value={watch('leadFreelancerId') || ''}
                    onValueChange={(value) => setValue('leadFreelancerId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a freelancer" />
                    </SelectTrigger>
                    <SelectContent>
                      {freelancers.map((freelancer) => (
                        <SelectItem key={freelancer.id} value={freelancer.id}>
                          {freelancer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Project Team */}
              <div className="space-y-2">
                <Label>Project Team (Multi-select)</Label>
                <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg">
                  {freelancers
                    .filter((f) => f.id !== selectedLeadFreelancer)
                    .map((freelancer) => (
                      <div key={freelancer.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`team-${freelancer.id}`}
                          checked={selectedTeamMembers.includes(freelancer.id)}
                          onCheckedChange={() => handleTeamMemberToggle(freelancer.id)}
                        />
                        <Label
                          htmlFor={`team-${freelancer.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {freelancer.name}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>
              
              {/* Initial Tasks */}
              <div className="space-y-2">
                <Label>Initial Tasks (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter task name"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTask();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTask}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {tasks.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {tasks.map((task, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="text-sm">{task.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTask(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
