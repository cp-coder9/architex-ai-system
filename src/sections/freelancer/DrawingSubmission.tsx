import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useProjectStore } from '@/store';
import { DrawingType } from '@/types/agent';
import { ProofOfWork, ProofAttachment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { toast } from 'sonner';
import {
  FileUp,
  Upload,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Bot,
  Eye,
  Download,
  RefreshCw,
  FolderKanban,
  Image as ImageIcon,
  Layers,
  FileCheck,
  Paperclip,
  Plus,
  File,
  Calendar,
  User,
} from 'lucide-react';

// Upload Zone Component
function UploadZone({ onUpload }: { onUpload: (files: FileList) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg"
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-3">
        <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-primary' : 'bg-muted'}`}>
          <Upload className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-muted-foreground'}`} />
        </div>
        <div>
          <p className="font-medium">Drop files here or click to upload</p>
          <p className="text-sm text-muted-foreground mt-1">
            Supports PDF, DWG, DXF, PNG, JPG (max 50MB)
          </p>
        </div>
      </div>
    </div>
  );
}

// Agent Check Status Component
function AgentCheckStatus({ check }: { check: any }) {
  const [isScanning, setIsScanning] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (check.status === 'pending') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Waiting to start...</span>
      </div>
    );
  }

  if (check.status === 'checking') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Agent is checking...</span>
        </div>
        <Progress value={45} className="h-2 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="font-medium">Agent Check Complete</span>
        </div>
        <Badge className={check.overallScore >= 90 ? 'bg-green-500' : check.overallScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'}>
          Score: {check.overallScore}%
        </Badge>
      </div>

      {check.issues.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{check.issues.length} issues found:</p>
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {check.issues.map((issue: any) => (
                <div key={issue.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${getSeverityColor(issue.severity)}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{issue.description}</p>
                    <p className="text-xs text-muted-foreground">{issue.suggestion}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{issue.type}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {check.issues.length === 0 && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          <span>No issues found!</span>
        </div>
      )}
    </div>
  );
}

export function DrawingSubmission() {
  const { currentUser } = useAuthStore();
  const { projects, drawings, addDrawing, runAgentCheck, submitProofOfWork, getProofsByFreelancerId } = useProjectStore();
  const [selectedProject, setSelectedProject] = useState(projects.find(p => p.freelancerId === currentUser?.id));
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Proof of Work state
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false);
  const [proofProjectId, setProofProjectId] = useState<string>('');
  const [proofTaskId, setProofTaskId] = useState<string>('');
  const [proofDescription, setProofDescription] = useState('');
  const [proofAttachments, setProofAttachments] = useState<File[]>([]);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [myProofs, setMyProofs] = useState<ProofOfWork[]>([]);

  // Load proofs on mount and when user changes
  useEffect(() => {
    if (currentUser?.id) {
      const proofs = getProofsByFreelancerId(currentUser.id);
      setMyProofs(proofs);
    }
  }, [currentUser?.id, getProofsByFreelancerId]);

  const myProjects = useMemo(() =>
    projects.filter(p => p.freelancerId === currentUser?.id),
    [projects, currentUser?.id]
  );

  const myDrawings = useMemo(() =>
    drawings.filter(d => myProjects.some(p => p.id === d.projectId)),
    [drawings, myProjects]
  );

  const handleUpload = async (files: FileList) => {
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    const newFiles = Array.from(files);
    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simulate upload process
    setIsUploading(true);
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    setIsUploading(false);
    setUploadProgress(0);

    // Add drawings to store
    for (const file of newFiles) {
      const drawing = await addDrawing({
        projectId: selectedProject.id,
        name: file.name.replace(/\.[^/.]+$/, ''),
        type: DrawingType.FLOOR_PLAN,
        fileUrl: URL.createObjectURL(file),
        uploadedBy: currentUser?.id || '',
        fileSize: file.size,
      });

      // Run agent check
      toast.info(`Starting agent check for ${file.name}...`);
      await runAgentCheck(drawing.id);
      toast.success(`Agent check complete for ${file.name}`);
    }

    setUploadedFiles([]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProofFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setProofAttachments(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const removeProofAttachment = (index: number) => {
    setProofAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitProof = async () => {
    if (!proofProjectId || !proofDescription.trim()) {
      toast.error('Please select a project and provide a description');
      return;
    }

    setIsSubmittingProof(true);
    try {
      // Simulate file upload by creating mock attachments
      const attachments: ProofAttachment[] = proofAttachments.map((file, index) => ({
        id: `attach-${Date.now()}-${index}`,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileType: file.type.startsWith('image/') ? 'image' : file.type.includes('pdf') ? 'document' : 'other',
        uploadedAt: new Date().toISOString(),
      }));

      const proofData = {
        taskId: proofTaskId || `task-${Date.now()}`,
        freelancerId: currentUser?.id || '',
        projectId: proofProjectId,
        description: proofDescription,
        attachments,
      };

      const newProof = await submitProofOfWork(proofData);
      setMyProofs(prev => [newProof, ...prev]);
      
      toast.success('Proof of work submitted successfully!');
      
      // Reset form
      setProofProjectId('');
      setProofTaskId('');
      setProofDescription('');
      setProofAttachments([]);
      setIsProofDialogOpen(false);
    } catch (error) {
      toast.error('Failed to submit proof of work');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-gray-500" />;
      case 'in_review': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'revision_needed': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'drawing':
        return <FileCheck className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
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
        <h1 className="text-3xl font-bold">Submit Drawings</h1>
        <p className="text-muted-foreground mt-1">
          Upload your drawings for AI-powered verification and client review.
        </p>
      </motion.div>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5" />
            Select Project
          </CardTitle>
          <CardDescription>Choose which project to submit drawings for</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {myProjects.map(project => (
              <Button
                key={project.id}
                variant={selectedProject?.id === project.id ? 'default' : 'outline'}
                onClick={() => setSelectedProject(project)}
              >
                {project.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Drawings
          </CardTitle>
          <CardDescription>Drag and drop or select files to upload</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UploadZone onUpload={handleUpload} />

          {/* Upload Progress */}
          {isUploading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </motion.div>
          )}

          {/* Selected Files */}
          <AnimatePresence>
            {uploadedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <p className="text-sm font-medium">Selected Files:</p>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFile(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* My Drawings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            My Drawings
          </CardTitle>
          <CardDescription>View and manage your submitted drawings</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="revision">Needs Revision</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {myDrawings.slice().reverse().map((drawing, index) => (
                    <motion.div
                      key={drawing.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-lg border"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(drawing.status)}
                          <div>
                            <p className="font-medium">{drawing.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(drawing.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={drawing.status === 'approved' ? 'default' : 'secondary'}>
                          {drawing.status}
                        </Badge>
                      </div>

                      {drawing.agentCheck && (
                        <div className="mt-3 p-3 rounded-lg bg-muted">
                          <AgentCheckStatus check={drawing.agentCheck} />
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Other tabs would filter by status */}
            <TabsContent value="pending">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {myDrawings
                    .filter(d => d.status === 'pending')
                    .map((drawing, index) => (
                      <motion.div
                        key={drawing.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-lg border"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="font-medium">{drawing.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(drawing.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="approved">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {myDrawings
                    .filter(d => d.status === 'approved')
                    .map((drawing, index) => (
                      <motion.div
                        key={drawing.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-lg border"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <div>
                              <p className="font-medium">{drawing.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(drawing.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge>Approved</Badge>
                        </div>
                        {drawing.agentCheck && (
                          <div className="mt-3">
                            <Badge className="bg-green-500">
                              Score: {drawing.agentCheck.overallScore}%
                            </Badge>
                          </div>
                        )}
                      </motion.div>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Proof of Work Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Proof of Work
              </CardTitle>
              <CardDescription>Submit and track proof of your completed work</CardDescription>
            </div>
            <Dialog open={isProofDialogOpen} onOpenChange={setIsProofDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Proof
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Submit Proof of Work</DialogTitle>
                  <DialogDescription>
                    Provide details about the work you've completed and attach supporting files.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Project Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="project">Select Project</Label>
                    <Select value={proofProjectId} onValueChange={setProofProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {myProjects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Task ID (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="taskId">Task ID (Optional)</Label>
                    <Input
                      id="taskId"
                      placeholder="Enter task ID if applicable"
                      value={proofTaskId}
                      onChange={(e) => setProofTaskId(e.target.value)}
                    />
                  </div>

                  {/* Work Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Work Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the work you've completed..."
                      value={proofDescription}
                      onChange={(e) => setProofDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* File Attachments */}
                  <div className="space-y-2">
                    <Label>Attachments</Label>
                    <div className="border-2 border-dashed rounded-lg p-4">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                        onChange={handleProofFileUpload}
                        className="hidden"
                        id="proof-file-upload"
                      />
                      <label
                        htmlFor="proof-file-upload"
                        className="flex flex-col items-center cursor-pointer"
                      >
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload files
                        </span>
                        <span className="text-xs text-muted-foreground">
                          PDF, Images, Documents
                        </span>
                      </label>
                    </div>

                    {/* Attachment List */}
                    {proofAttachments.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {proofAttachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted"
                          >
                            <div className="flex items-center gap-2">
                              <Paperclip className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm truncate max-w-[200px]">
                                {file.name}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeProofAttachment(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsProofDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitProof}
                    disabled={isSubmittingProof || !proofProjectId || !proofDescription.trim()}
                  >
                    {isSubmittingProof ? 'Submitting...' : 'Submit Proof'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Proofs</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {myProofs.length === 0 ? (
                    <div className="text-center py-8">
                      <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No proof submissions yet</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setIsProofDialogOpen(true)}
                      >
                        Submit your first proof
                      </Button>
                    </div>
                  ) : (
                    myProofs.slice().reverse().map((proof, index) => (
                      <ProofCard key={proof.id} proof={proof} index={index} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="pending">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {myProofs
                    .filter(p => p.verificationStatus === 'pending')
                    .map((proof, index) => (
                      <ProofCard key={proof.id} proof={proof} index={index} />
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="approved">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {myProofs
                    .filter(p => p.verificationStatus === 'approved')
                    .map((proof, index) => (
                      <ProofCard key={proof.id} proof={proof} index={index} />
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="rejected">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {myProofs
                    .filter(p => p.verificationStatus === 'rejected')
                    .map((proof, index) => (
                      <ProofCard key={proof.id} proof={proof} index={index} />
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Proof Card Component
function ProofCard({ proof, index }: { proof: ProofOfWork; index: number }) {
  const projectStore = useProjectStore();
  const project = projectStore.projects.find(p => p.id === proof.projectId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-4 rounded-lg border"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {proof.verificationStatus === 'approved' && (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
          {proof.verificationStatus === 'pending' && (
            <Clock className="w-5 h-5 text-yellow-500" />
          )}
          {proof.verificationStatus === 'rejected' && (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          <div>
            <p className="font-medium">{project?.name || 'Unknown Project'}</p>
            <p className="text-sm text-muted-foreground">
              Submitted: {new Date(proof.submittedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {getVerificationBadge(proof.verificationStatus)}
      </div>

      {/* Description */}
      <div className="mb-3">
        <p className="text-sm">{proof.description}</p>
      </div>

      {/* Attachments */}
      {proof.attachments.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium mb-2">Attachments:</p>
          <div className="flex flex-wrap gap-2">
            {proof.attachments.map(attachment => (
              <a
                key={attachment.id}
                href={attachment.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded bg-muted text-sm hover:bg-muted/80"
              >
                {getFileIcon(attachment.fileType)}
                <span className="truncate max-w-[150px]">{attachment.fileName}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Verification Details */}
      {proof.verifiedAt && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span>Verified by {proof.verifiedBy}</span>
          <span>•</span>
          <Calendar className="w-4 h-4" />
          <span>{new Date(proof.verifiedAt).toLocaleDateString()}</span>
        </div>
      )}

      {/* Rejection Reason */}
      {proof.rejectionReason && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
          <p className="text-sm text-red-700">{proof.rejectionReason}</p>
        </div>
      )}
    </motion.div>
  );
}
