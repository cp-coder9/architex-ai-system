/**
 * Admin Files Section
 *
 * File management overview for administrators to monitor
 * and manage all files across the platform.
 */

import { useState } from 'react';
import { useAuthStore, useFileStore } from '@/store';
import { FileManager } from '@/components/FileManager';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Folder,
  Files,
  HardDrive,
  Image,
  FileText,
  FileCode,
  Archive,
} from 'lucide-react';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from '@/components/ui/empty';

// File type categories for statistics
const FILE_CATEGORIES = {
  drawing: { label: 'CAD Drawings', icon: FileCode, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  pdf: { label: 'PDF Documents', icon: FileText, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  image: { label: 'Images', icon: Image, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  spreadsheet: { label: 'Spreadsheets', icon: Files, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  archive: { label: 'Archives', icon: Archive, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  document: { label: 'Documents', icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  file: { label: 'Other Files', icon: Files, color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
};

/**
 * Get file category from file name and type
 */
const getFileCategory = (fileName: string, mimeType: string): keyof typeof FILE_CATEGORIES => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  if (['dwg', 'dxf'].includes(extension)) return 'drawing';
  if (extension === 'pdf' || mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(extension)) return 'spreadsheet';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'archive';
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension)) return 'document';

  return 'file';
};

/**
 * Format file size to human-readable format
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export function AdminFiles() {
  const { currentUser } = useAuthStore();
  const { files, folders } = useFileStore();
  const [selectedOwner, setSelectedOwner] = useState<string>('all');

  if (!currentUser) {
    return (
      <Empty className="py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Folder className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Not authenticated</EmptyTitle>
          <EmptyDescription>Please log in to access file management.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  // Calculate statistics
  const totalFiles = files.length;
  const totalFolders = folders.length;
  const totalSize = files.reduce((acc, file) => acc + file.size, 0);

  // Get unique owners
  const owners = Array.from(new Set(files.map((f) => f.ownerId)));

  // Filter files by owner
  const filteredFiles = selectedOwner === 'all'
    ? files
    : files.filter((f) => f.ownerId === selectedOwner);

  // Calculate file type distribution
  const fileTypeDistribution = filteredFiles.reduce((acc, file) => {
    const category = getFileCategory(file.name, file.type);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">File Management</h1>
        <p className="text-muted-foreground">
          Overview and management of all files across the platform. Monitor storage usage,
          file types, and manage user files.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Files className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{totalFiles}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Folders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{totalFolders}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{formatFileSize(totalSize)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Owners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-xs font-bold text-purple-500">{owners.length}</span>
              </div>
              <span className="text-2xl font-bold">{owners.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>File Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(FILE_CATEGORIES).map(([key, config]) => {
              const count = fileTypeDistribution[key] || 0;
              const percentage = totalFiles > 0 ? (count / totalFiles) * 100 : 0;
              const Icon = config.icon;

              return (
                <div key={key} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${config.bgColor} ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{config.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                    <Progress value={percentage} className="h-1 mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* File Browser */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">File Browser</h2>

          {/* Owner Filter */}
          <Select value={selectedOwner} onValueChange={setSelectedOwner}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              {owners.map((ownerId) => (
                <SelectItem key={ownerId} value={ownerId}>
                  Owner: {ownerId.slice(0, 8)}...
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FileManager
          ownerId={selectedOwner === 'all' ? undefined : selectedOwner}
          title={selectedOwner === 'all' ? 'All Files' : `Files for Owner: ${selectedOwner.slice(0, 8)}...`}
          maxHeight="calc(100vh - 600px)"
        />
      </div>
    </div>
  );
}

export default AdminFiles;
