import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore, useProjectStore, useInvoiceStore, useProjectRequestStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Project } from '@/types';
import {
  FolderKanban,
  Clock,
  FileText,
  CheckCircle2,
  ArrowRight,
  Plus,
  BarChart3,
  Zap,
  Eye,
  Building2,
  FileCheck2,
  FilePlus,
  PenTool,
  FileEdit,
  Landmark,
  Compass,
  Home,
  Briefcase,
  Store,
  Factory,
  MapPin,
  User,
  Phone,
  Mail,
  Upload,
  File,
  FileText as FileTextIcon,
  _Image,
  Edit3,
  Calendar,
  Zap as ZapIcon,
  CalendarDays,
  Clock as ClockIcon,
  FileImage,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';

// Helper function to get file icon based on file type
function getFileIcon(fileType: string) {
  const type = fileType.toLowerCase();
  if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('jpeg')) {
    return FileImage;
  }
  if (type.includes('pdf')) {
    return FileText;
  }
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) {
    return FileSpreadsheet;
  }
  if (type.includes('dwg') || type.includes('cad') || type.includes('autocad')) {
    return FileCode;
  }
  return File;
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}



// Project Card
function ProjectCard({ project }: { project: Project }) {
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

// Helper to get service type display info
const getServiceTypeInfo = (serviceType: string) => {
  switch (serviceType) {
    case 'validate': return { label: 'Validate Plans', icon: FileCheck2, color: 'text-blue-600', bgColor: 'bg-blue-100' };
    case 'draw_new': return { label: 'Draw New Plans', icon: FilePlus, color: 'text-green-600', bgColor: 'bg-green-100' };
    case 'redraw': return { label: 'Redraw Plans', icon: PenTool, color: 'text-purple-600', bgColor: 'bg-purple-100' };
    case 'amendments': return { label: 'Update Amendments', icon: FileEdit, color: 'text-orange-600', bgColor: 'bg-orange-100' };
    case 'municipal': return { label: 'Municipal Retrieval', icon: Landmark, color: 'text-teal-600', bgColor: 'bg-teal-100' };
    case 'other': return { label: 'Other Services', icon: Compass, color: 'text-pink-600', bgColor: 'bg-pink-100' };
    default: return { label: serviceType, icon: FileTextIcon, color: 'text-gray-600', bgColor: 'bg-gray-100' };
  }
};

// Helper to get property type icon
const getPropertyTypeInfo = (propertyType: string) => {
  switch (propertyType) {
    case 'residential': return { label: 'Residential', icon: Home };
    case 'commercial': return { label: 'Commercial Office', icon: Briefcase };
    case 'retail': return { label: 'Retail & Hospitality', icon: Store };
    case 'industrial': return { label: 'Industrial Space', icon: Factory };
    default: return { label: propertyType, icon: Building2 };
  }
};

// Helper to get urgency color coding
const getUrgencyInfo = (urgency: string) => {
  switch (urgency) {
    case 'asap': return { label: 'Immediately (ASAP)', color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-200', badge: 'destructive' as const };
    case 'one_month': return { label: 'Within 30 Days', color: 'text-yellow-600', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-200', badge: 'secondary' as const };
    case 'three_months': return { label: '1 - 3 Months', color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-200', badge: 'default' as const };
    case 'flexible': return { label: 'Flexible / Just exploring', color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-200', badge: 'outline' as const };
    default: return { label: urgency, color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-200', badge: 'outline' as const };
  }
};

// Uploaded file type for onboarding
type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  preview?: string;
};

type OnboardingData = {
  serviceType: string;
  customServiceDescription: string;
  propertyType: string;
  urgency: string;
  uploadedFiles: UploadedFile[];
  personalDetails: {
    firstName: string;
    surname: string;
    phoneNumber: string;
    email: string;
  };
  propertyDetails: {
    identifierType: 'erf' | 'stand';
    identifierNumber: string;
    physicalAddress: {
      street: string;
      suburb: string;
      city: string;
      province: string;
      postalCode: string;
    };
  };
};

// Project Request Card - Displays onboarding data
function ProjectRequestCard({ onboardingData }: { onboardingData: OnboardingData }) {
  const serviceInfo = getServiceTypeInfo(onboardingData.serviceType);
  const propertyInfo = getPropertyTypeInfo(onboardingData.propertyType);
  const urgencyInfo = getUrgencyInfo(onboardingData.urgency);
  const ServiceIcon = serviceInfo.icon;
  const PropertyIcon = propertyInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-card to-card/95 border rounded-2xl p-6 shadow-lg"
    >
      {/* Header with Service Type and Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-xl ${serviceInfo.bgColor}`}>
            <ServiceIcon className={`w-8 h-8 ${serviceInfo.color}`} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {onboardingData.serviceType === 'other' && onboardingData.customServiceDescription
                ? onboardingData.customServiceDescription
                : serviceInfo.label}
            </h2>
            <p className="text-muted-foreground text-sm">Your Project Request</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Clock className="w-3 h-3 mr-1" />
            Submitted
          </Badge>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Edit3 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Service Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Service Type */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Service Type</p>
          <div className="flex items-center gap-2">
            <ServiceIcon className={`w-5 h-5 ${serviceInfo.color}`} />
            <span className="font-medium">
              {onboardingData.serviceType === 'other' && onboardingData.customServiceDescription
                ? onboardingData.customServiceDescription.length > 40
                  ? onboardingData.customServiceDescription.substring(0, 40) + '...'
                  : onboardingData.customServiceDescription
                : serviceInfo.label}
            </span>
          </div>
        </div>

        {/* Property Type */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Property Type</p>
          <div className="flex items-center gap-2">
            <PropertyIcon className="w-5 h-5 text-primary" />
            <span className="font-medium">{propertyInfo.label}</span>
          </div>
        </div>

        {/* Urgency */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Urgency</p>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${urgencyInfo.bgColor} ${urgencyInfo.borderColor} border`}>
            {onboardingData.urgency === 'asap' && <ZapIcon className={`w-4 h-4 ${urgencyInfo.color}`} />}
            {onboardingData.urgency === 'one_month' && <Calendar className={`w-4 h-4 ${urgencyInfo.color}`} />}
            {onboardingData.urgency === 'three_months' && <CalendarDays className={`w-4 h-4 ${urgencyInfo.color}`} />}
            {onboardingData.urgency === 'flexible' && <ClockIcon className={`w-4 h-4 ${urgencyInfo.color}`} />}
            <span className={`text-sm font-medium ${urgencyInfo.color}`}>{urgencyInfo.label}</span>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Property Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Property Details</span>
          </div>
          <div className="space-y-2 pl-6">
            <p className="text-sm">
              <span className="text-muted-foreground">{onboardingData.propertyDetails.identifierType === 'erf' ? 'ERF' : 'Stand'} Number:</span>{' '}
              <span className="font-semibold">{onboardingData.propertyDetails.identifierNumber}</span>
            </p>
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">Physical Address:</p>
              <p className="font-medium">{onboardingData.propertyDetails.physicalAddress.street}</p>
              <p className="text-muted-foreground">
                {onboardingData.propertyDetails.physicalAddress.suburb}, {onboardingData.propertyDetails.physicalAddress.city}
              </p>
              <p className="text-muted-foreground">
                {onboardingData.propertyDetails.physicalAddress.province}, {onboardingData.propertyDetails.physicalAddress.postalCode}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Contact Information</span>
          </div>
          <div className="space-y-2 pl-6">
            <p className="text-sm">
              <span className="text-muted-foreground">Name:</span>{' '}
              <span className="font-semibold">{onboardingData.personalDetails.firstName} {onboardingData.personalDetails.surname}</span>
            </p>
            <p className="text-sm flex items-center gap-2">
              <Phone className="w-3 h-3 text-muted-foreground" />
              <span>{onboardingData.personalDetails.phoneNumber}</span>
            </p>
            <p className="text-sm flex items-center gap-2">
              <Mail className="w-3 h-3 text-muted-foreground" />
              <span>{onboardingData.personalDetails.email}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Files Section */}
      {onboardingData.uploadedFiles && onboardingData.uploadedFiles.length > 0 && (
        <>
          <Separator className="my-4" />
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Upload className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Uploaded Files ({onboardingData.uploadedFiles.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pl-6">
              {onboardingData.uploadedFiles.map((file: { id: string; name: string; type: string; size: number; preview?: string }) => {
                const FileIcon = getFileIcon(file.type);
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-colors"
                  >
                    {file.preview ? (
                      <img src={file.preview} alt={file.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileIcon className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Status Footer */}
      <div className="mt-6 pt-4 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
          <span className="text-sm text-muted-foreground">
            Our team will review your request and contact you shortly.
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function ClientOverview() {
  const navigate = useNavigate();
  const location = useLocation();
  const authStore = useAuthStore();
  const currentUser = authStore.currentUser;
  // Read onboarding data from router state (passed during registration)
  const routerOnboardingData = location.state?.onboardingData as OnboardingData | undefined;
  const storeOnboardingData = authStore.tempOnboardingData;
  // Use router state if available, otherwise fall back to store (for backwards compatibility)
  const tempOnboardingData = routerOnboardingData || storeOnboardingData;

  const allProjects = useProjectStore(state => state.projects);
  const allDrawings = useProjectStore(state => state.drawings);
  const allInvoices = useInvoiceStore(state => state.invoices);
  const allRequests = useProjectRequestStore(state => state.projectRequests);

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

  const pendingRequests = useMemo(() =>
    allRequests.filter(req => req.clientEmail === currentUser?.email && req.status === 'pending'),
    [allRequests, currentUser?.email]
  );

  // Calculate stats
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
        <h1 className="text-3xl font-bold">
          {tempOnboardingData ? `Welcome, ${tempOnboardingData.personalDetails.firstName}!` : `Welcome back, ${currentUser?.name?.split(' ')[0]}!`}
        </h1>
        <p className="text-muted-foreground mt-1">
          {tempOnboardingData
            ? "Your project request has been submitted. Here's a summary of your submission."
            : "Here's an overview of your projects and progress."
          }
        </p>
      </motion.div>

      {/* Project Request Card from Onboarding Data */}
      {tempOnboardingData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ProjectRequestCard onboardingData={tempOnboardingData} />
        </motion.div>
      )}

      {/* Onboarding / Pending Requests Banner */}
      {pendingRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-primary/5 border border-primary/20 rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Building2 className="w-24 h-24 text-primary" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground animate-pulse">New Request</Badge>
                <span className="text-sm font-medium text-primary">Service Request Processing</span>
              </div>
              <h2 className="text-2xl font-bold">We're reviewing your {pendingRequests[0].projectName} request</h2>
              <p className="text-muted-foreground max-w-xl">
                Our architects are currently reviewing the details you provided during onboarding.
                We'll reach out shortly to discuss the next steps for your {pendingRequests[0].projectType} project.
              </p>
            </div>
            <div className="flex gap-3">
              <Button size="lg" className="shadow-lg">
                View Request Details
              </Button>
            </div>
          </div>
        </motion.div>
      )}

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
                <p className="text-xs text-muted-foreground">R{totalPendingAmount.toLocaleString()}</p>
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
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                onClick={() => navigate('/client/projects')}
              >
                <Plus className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">New Project</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                onClick={() => navigate('/client/hours')}
              >
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Buy Hours</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                onClick={() => navigate('/client/projects')}
              >
                <Eye className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">View Drawings</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                onClick={() => navigate('/client/invoices')}
              >
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Invoices</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
