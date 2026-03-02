import { useState, useMemo } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '@/store';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

// Client Sections
import { ClientOverview } from '@/sections/client/ClientOverview';
import { MyProjects } from '@/sections/client/MyProjects';
import { HourPackages } from '@/sections/client/HourPackages';
import { MyInvoices } from '@/sections/client/MyInvoices';
import { ClientMessages } from '@/sections/client/ClientMessages';
import { ClientSettings } from '@/sections/client/ClientSettings';
import { ClientFiles } from '@/sections/client/ClientFiles';

import {
  LayoutDashboard,
  FolderKanban,
  Clock,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  Building2,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  ShieldCheck,
  Folder,
} from 'lucide-react';

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
          <div className="group-data-[collapsible=icon]:hidden">
            <span className="text-xl font-bold truncate">Architex Axis</span>
            <p className="text-xs text-sidebar-foreground/60 truncate">Client Portal</p>
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
                    to={`/client/${item.path}`}
                    end={item.path === 'overview'}
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
              {userNotifications.slice(0, 5).map((notif, index) => (
                <DropdownMenuItem key={notif.id || index} className="flex flex-col items-start py-2">
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
                  <p className="text-xs text-sidebar-foreground/60 truncate">Client</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 shrink-0 group-data-[collapsible=icon]:hidden" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/client/settings')}>
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

function CredentialsPopup() {
  const { credentialsToNote, setCredentialsToNote } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

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
          <DialogTitle className="text-center text-xl">Save Your Credentials</DialogTitle>
          <DialogDescription className="text-center">
            Welcome to Architex Axis! Please save your login details below. You'll need these to log in again.
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

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={credentialsToNote.password}
                readOnly
                className="pr-20 bg-muted/50"
              />
              <div className="absolute right-0 top-0 h-full flex items-center">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => copyToClipboard(credentialsToNote.password, 'Password')}
                >
                  <Copy className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
              Important: For security, we only show this once. Please copy or save these details in a secure place.
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            className="w-full sm:w-auto px-8"
            onClick={() => setCredentialsToNote(null)}
          >
            I've saved my credentials
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
