import { useState, useMemo } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useProjectStore, useInvoiceStore, useSettingsStore, useNotificationStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

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

import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Bot,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Building2,
  ChevronDown,
  Menu,
  X,
  Shield,
  FolderInput,
  MessageSquare,
  Briefcase,
} from 'lucide-react';
const sidebarItems = [
  { path: '', label: 'Overview', icon: LayoutDashboard },
  { path: 'users', label: 'User Management', icon: Users },
  { path: 'projects', label: 'Project Oversight', icon: FolderKanban },
  { path: 'messages', label: 'Messages', icon: MessageSquare },
  { path: 'marketplace', label: 'Freelancer Marketplace', icon: Briefcase },
  { path: 'agents', label: 'Agent Monitor', icon: Bot },
  { path: 'invoices', label: 'Invoices', icon: FileText },
  { path: 'analytics', label: 'Analytics', icon: BarChart3 },
  { path: 'settings', label: 'Settings', icon: Settings },
  { path: 'audit-security', label: 'Audit & Security', icon: Shield },
  { path: 'project-requests', label: 'Project Requests', icon: FolderInput },
];

function AdminSidebar() {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const notifications = useNotificationStore(state => state.notifications);
  const userId = currentUser?.id || '';
  const userNotifications = useMemo(
    () => notifications.filter(n => n.userId === userId),
    [notifications, userId]
  );
  const unreadCount = useMemo(
    () => userNotifications.filter(n => !n.read).length,
    [userNotifications]
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar/50 backdrop-blur-xl">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">\n            <span className="text-xl font-bold truncate">Architex Axis</span>
            <p className="text-xs text-sidebar-foreground/60 truncate">Admin Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <SidebarMenu>
            {sidebarItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton asChild tooltip={item.label}>
                  <NavLink
                    to={`/admin/${item.path}`}
                    end={item.path === ''}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0 group-data-[collapsible=icon]:size-10 ${isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="group-data-[collapsible=icon]:hidden truncate">{item.label}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center justify-between mb-4 group-data-[collapsible=icon]:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {userNotifications.slice(0, 5).map((notif) => (
                <DropdownMenuItem key={notif.id} className="flex flex-col items-start py-2">
                  <span className="font-medium text-sm">{notif.title}</span>
                  <span className="text-xs text-sidebar-foreground/60 line-clamp-2">{notif.message}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-between group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-10 overflow-hidden">
              <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={currentUser?.avatar} />
                  <AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-left group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium truncate">{currentUser?.name}</p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">Administrator</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 shrink-0 group-data-[collapsible=icon]:hidden" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminDashboard() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-h-screen overflow-auto">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b sticky top-0 bg-background z-20">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold">Architex Axis Admin</span>
          </div>
          <SidebarTrigger />
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<AdminOverview />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/projects" element={<ProjectOversight />} />
            <Route path="/messages" element={<AdminMessages />} />
            <Route path="/agents" element={<AgentMonitor />} />
            <Route path="/invoices" element={<InvoiceManagement />} />
            <Route path="/analytics" element={<SystemAnalytics />} />
            <Route path="/settings" element={<AdminSettings />} />
            <Route path="/audit-security" element={<AuditSecurity />} />
            <Route path="/project-requests" element={<ProjectRequests />} />
            <Route path="/marketplace" element={<FreelancerMarketplace />} />
          </Routes>
        </div>
      </main>
    </SidebarProvider>
  );
}
