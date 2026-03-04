import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Briefcase,
  Clock,
  FileUp,
  DollarSign,
  MessageSquare,
  Settings,
  HardHat,
  Folder,
} from 'lucide-react';

// Freelancer Sections
import { FreelancerOverview } from '@/sections/freelancer/FreelancerOverview';
import { MyWork } from '@/sections/freelancer/MyWork';
import { TimeTracking } from '@/sections/freelancer/TimeTracking';
import { DrawingSubmission } from '@/sections/freelancer/DrawingSubmission';
import { FreelancerEarnings } from '@/sections/freelancer/FreelancerEarnings';
import { FreelancerMessages } from '@/sections/freelancer/FreelancerMessages';
import { FreelancerSettings } from '@/sections/freelancer/FreelancerSettings';
import { FreelancerFiles } from '@/sections/freelancer/FreelancerFiles';

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
  return (
    <DashboardSidebar
      portalLabel="Freelancer Portal"
      sidebarItems={sidebarItems}
      logoIcon={<HardHat className="w-6 h-6 text-white" />}
      basePath="/freelancer"
      roleLabel="Freelancer"
      settingsPath="/freelancer/settings"
    />
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
