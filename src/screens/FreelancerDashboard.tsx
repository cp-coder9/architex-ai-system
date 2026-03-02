import { useMemo } from 'react';
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

// Freelancer Sections
import { FreelancerOverview } from '@/sections/freelancer/FreelancerOverview';
import { MyWork } from '@/sections/freelancer/MyWork';
import { TimeTracking } from '@/sections/freelancer/TimeTracking';
import { DrawingSubmission } from '@/sections/freelancer/DrawingSubmission';
import { FreelancerEarnings } from '@/sections/freelancer/FreelancerEarnings';
import { FreelancerMessages } from '@/sections/freelancer/FreelancerMessages';
import { FreelancerSettings } from '@/sections/freelancer/FreelancerSettings';
import { FreelancerFiles } from '@/sections/freelancer/FreelancerFiles';

import {
  LayoutDashboard,
  Briefcase,
  Clock,
  FileUp,
  DollarSign,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  HardHat,
  ChevronDown,
  Folder,
} from 'lucide-react';

const sidebarItems = [
  { path: 'overview', label: 'Overview', icon: LayoutDashboard },
  { path: 'work', label: 'My Work', icon: Briefcase },
  { path: 'time', label: 'Time Tracking', icon: Clock },
  { path: 'drawings', label: 'Submit Drawings', icon: FileUp },
  { path: 'files', label: 'My Files', icon: Folder },
  { path: 'earnings', label: 'Earnings', icon: DollarSign },
  { path: 'messages', label: 'Messages', icon: MessageSquare },
  { path: 'settings', label: 'Settings', icon: Settings },
];

function FreelancerSidebar() {
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
            <HardHat className="w-6 h-6 text-white" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">\n            <span className="text-xl font-bold truncate">Architex Axis</span>
            <p className="text-xs text-sidebar-foreground/60 truncate">Freelancer Portal</p>
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
                    to={`/freelancer/${item.path}`}
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
                  <p className="text-xs text-sidebar-foreground/60 truncate">Freelancer</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 shrink-0 group-data-[collapsible=icon]:hidden" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/freelancer/settings')}>
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
export function FreelancerDashboard() {
  return (
    <SidebarProvider>
      <FreelancerSidebar />
      <SidebarInset>
        {/* Desktop Header with Toggle */}
        <header className="hidden md:flex items-center justify-between p-4 border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Freelancer Dashboard</h1>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b sticky top-0 bg-background z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold">Architex Axis Freelancer</span>
          </div>
          <SidebarTrigger />
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <ErrorBoundary componentName="Freelancer Dashboard">
            <Routes>
              <Route path="/" element={<FreelancerOverview />} />
              <Route path="/overview" element={<FreelancerOverview />} />
              <Route path="/work" element={<MyWork />} />
              <Route path="/time" element={<TimeTracking />} />
              <Route path="/drawings" element={<DrawingSubmission />} />
              <Route path="/files" element={<FreelancerFiles />} />
              <Route path="/earnings" element={<FreelancerEarnings />} />
              <Route path="/messages" element={<FreelancerMessages />} />
              <Route path="/settings" element={<FreelancerSettings />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
