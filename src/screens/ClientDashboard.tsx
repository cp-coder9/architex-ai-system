import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  FolderKanban,
  Clock,
  FileText,
  MessageSquare,
  Settings,
  Building2,
  ShieldCheck,
  Folder,
  Copy,
} from 'lucide-react';

// Client Sections
import { ClientOverview } from '@/sections/client/ClientOverview';
import { MyProjects } from '@/sections/client/MyProjects';
import { HourPackages } from '@/sections/client/HourPackages';
import { MyInvoices } from '@/sections/client/MyInvoices';
import { ClientMessages } from '@/sections/client/ClientMessages';
import { ClientSettings } from '@/sections/client/ClientSettings';
import { ClientFiles } from '@/sections/client/ClientFiles';

const sidebarItems = [
  { path: 'overview', label: 'Overview', icon: LayoutDashboard },
  { path: 'projects', label: 'My Projects', icon: FolderKanban },
  { path: 'hours', label: 'Hour Packages', icon: Clock },
  { path: 'invoices', label: 'Invoices', icon: FileText },
  { path: 'files', label: 'My Files', icon: Folder },
  { path: 'messages', label: 'Messages', icon: MessageSquare },
  { path: 'settings', label: 'Settings', icon: Settings },
];

function ClientSidebar() {
  return (
    <DashboardSidebar
      portalLabel="Client Portal"
      sidebarItems={sidebarItems}
      logoIcon={<Building2 className="w-6 h-6 text-white" />}
      basePath="/client"
      roleLabel="Client"
      settingsPath="/client/settings"
    />
  );
}

function CredentialsPopup() {
  const { credentialsToNote, setCredentialsToNote } = useAuthStore();

  if (!credentialsToNote) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Dialog open={!!credentialsToNote} onOpenChange={(open) => !open && setCredentialsToNote(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Welcome to Architex Axis!</DialogTitle>
          <DialogDescription className="text-center">
            Your account has been created successfully. Please save your email address below for future logins.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address (Username)</Label>
            <div className="relative">
              <Input
                id="email"
                value={credentialsToNote.email}
                readOnly
                className="pr-10 bg-muted/50"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => copyToClipboard(credentialsToNote.email, 'Email')}
              >
                <Copy className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
              </Button>
            </div>
          </div>

          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
              Important: Please remember your password as it cannot be recovered. For security, we do not store or display it.
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            className="w-full sm:w-auto px-8"
            onClick={() => setCredentialsToNote(null)}
          >
            I've saved my email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClientDashboard() {
  return (
    <SidebarProvider>
      <CredentialsPopup />
      <ClientSidebar />
      <SidebarInset>
        {/* Desktop Header with Toggle */}
        <header className="hidden md:flex items-center justify-between p-4 border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Client Dashboard</h1>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b sticky top-0 bg-background z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold">Architex Axis Client</span>
          </div>
          <SidebarTrigger />
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <ErrorBoundary componentName="Client Dashboard">
            <Routes>
              <Route path="/" element={<ClientOverview />} />
              <Route path="/overview" element={<ClientOverview />} />
              <Route path="/projects" element={<MyProjects />} />
              <Route path="/hours" element={<HourPackages />} />
              <Route path="/invoices" element={<MyInvoices />} />
              <Route path="/files" element={<ClientFiles />} />
              <Route path="/messages" element={<ClientMessages />} />
              <Route path="/settings" element={<ClientSettings />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
