/**
 * Freelancer Files Section
 *
 * File management interface for freelancers to upload, organize,
 * and manage their project files, drawings, and deliverables.
 */

import { useAuthStore } from '@/store';
import { FileManager } from '@/components/FileManager';
import { Folder } from 'lucide-react';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from '@/components/ui/empty';

export function FreelancerFiles() {
  const { currentUser } = useAuthStore();

  if (!currentUser) {
    return (
      <Empty className="py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Folder className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Not authenticated</EmptyTitle>
          <EmptyDescription>Please log in to access your files.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">My Files</h1>
        <p className="text-muted-foreground">
          Manage your project files, drawings, and deliverables. Upload CAD files (DWG, DXF),
          PDFs, reference images, and other project documents.
        </p>
      </div>

      <FileManager
        ownerId={currentUser.id}
        title="My Files"
        maxHeight="calc(100vh - 300px)"
      />
    </div>
  );
}

export default FreelancerFiles;
