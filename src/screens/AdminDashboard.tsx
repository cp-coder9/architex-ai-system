import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Building2 } from 'lucide-react';

// Admin Sections
import { AdminOverview } from '@/sections/admin/AdminOverview';
import { UserManagement } from '@/sections/admin/UserManagement';
import { ProjectOversight } from '@/sections/admin/ProjectOversight';
import { AgentMonitor } from '@/sections/admin/AgentMonitor';
import { InvoiceManagement } from '@/sections/admin/InvoiceManagement';
import { SystemAnalytics } from '@/sections/admin/SystemAnalytics';
import { AdminSettings } from '@/sections/admin/AdminSettings';
import { AuditSecurity } from '@/sections/admin/AuditSecurity';
import { ProjectRequests } from '@/sections/admin/ProjectRequests';
import { AdminMessages } from '@/sections/admin/AdminMessages';
import { FreelancerMarketplace } from '@/sections/admin/FreelancerMarketplace';
import { AdminFiles } from '@/sections/admin/AdminFiles';

import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Bot,
  FileText,
  BarChart3,
  Settings,
  Shield,
  FolderInput,
  MessageSquare,
  Briefcase,
  Folder,
} from 'lucide-react';
const sidebarItems = [
  { path: 'overview', label: 'Overview', icon: LayoutDashboard },
  { path: 'users', label: 'User Management', icon: Users },
  { path: 'projects', label: 'Project Oversight', icon: FolderKanban },
  { path: 'messages', label: 'Messages', icon: MessageSquare },
  { path: 'marketplace', label: 'Freelancer Marketplace', icon: Briefcase },
  { path: 'files', label: 'File Management', icon: Folder },
  { path: 'agents', label: 'Agent Monitor', icon: Bot },
  { path: 'invoices', label: 'Invoices', icon: FileText },
  { path: 'analytics', label: 'Analytics', icon: BarChart3 },
  { path: 'settings', label: 'Settings', icon: Settings },
  { path: 'audit-security', label: 'Audit & Security', icon: Shield },
  { path: 'project-requests', label: 'Project Requests', icon: FolderInput },
];

function AdminSidebar() {
  return (
    <DashboardSidebar
      portalLabel="Admin Portal"
      sidebarItems={sidebarItems}
      logoIcon={<Building2 className="w-6 h-6 text-white" />}
      basePath="/admin"
      roleLabel="Administrator"
      settingsPath="/admin/settings"
    />
  );
}

export function AdminDashboard() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        {/* Desktop Header with Toggle */}
        <header className="hidden md:flex items-center justify-between p-4 border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b sticky top-0 bg-background z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold">Architex Axis Admin</span>
          </div>
          <SidebarTrigger />
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <ErrorBoundary componentName="Admin Dashboard">
            <Routes>
              <Route path="/" element={<AdminOverview />} />
              <Route path="/overview" element={<AdminOverview />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/projects" element={<ProjectOversight />} />
              <Route path="/messages" element={<AdminMessages />} />
              <Route path="/marketplace" element={<FreelancerMarketplace />} />
              <Route path="/files" element={<AdminFiles />} />
              <Route path="/agents" element={<AgentMonitor />} />
              <Route path="/invoices" element={<InvoiceManagement />} />
              <Route path="/analytics" element={<SystemAnalytics />} />
              <Route path="/settings" element={<AdminSettings />} />
              <Route path="/audit-security" element={<AuditSecurity />} />
              <Route path="/project-requests" element={<ProjectRequests />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
