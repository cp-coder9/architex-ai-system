/**
 * FileManager Component
 *
 * A comprehensive file management component with upload, organization,
 * and file action capabilities. Supports grid/list views, folder navigation,
 * search, and file type-specific icons.
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  Folder,
  File,
  FileText,
  Image,
  Upload,
  Download,
  Trash2,
  Edit3,
  Search,
  Grid,
  List,
  ChevronRight,
  MoreVertical,
  Plus,
  X,
  FileType,
  FolderOpen,
  Eye,
  FileSpreadsheet,
  FileCode,
  Archive,
  Move,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';
import { useFileStore, FileItem, Folder as FolderType } from '@/store/fileStore';

// ============================================================================
// Props Interface
// ============================================================================

interface FileManagerProps {
  ownerId?: string;
  projectId?: string;
  readOnly?: boolean;
  title?: string;
  maxHeight?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

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

/**
 * Format date to localized string
 */
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

/**
 * Get file type category and icon
 */
const getFileTypeInfo = (fileName: string, mimeType: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  // DWG/DXF files
  if (['dwg', 'dxf'].includes(extension)) {
    return {
      category: 'drawing',
      icon: FileCode,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      label: 'CAD Drawing',
    };
  }

  // PDF files
  if (extension === 'pdf' || mimeType === 'application/pdf') {
    return {
      category: 'pdf',
      icon: FileText,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      label: 'PDF Document',
    };
  }

  // Images
  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return {
      category: 'image',
      icon: Image,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      label: 'Image',
    };
  }

  // Spreadsheets
  if (['xls', 'xlsx', 'csv', 'ods'].includes(extension)) {
    return {
      category: 'spreadsheet',
      icon: FileSpreadsheet,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      label: 'Spreadsheet',
    };
  }

  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return {
      category: 'archive',
      icon: Archive,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      label: 'Archive',
    };
  }

  // Documents
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension)) {
    return {
      category: 'document',
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      label: 'Document',
    };
  }

  // Default
  return {
    category: 'file',
    icon: FileType,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    label: 'File',
  };
};

// ============================================================================
// File Icon Component
// ============================================================================

interface FileIconProps {
  fileName: string;
  mimeType: string;
  size?: 'sm' | 'md' | 'lg';
}

const FileIcon: React.FC<FileIconProps> = ({ fileName, mimeType, size = 'md' }) => {
  const { icon: Icon, color, bgColor } = getFileTypeInfo(fileName, mimeType);

  const sizeClasses = {
    sm: 'w-8 h-8 [&_svg]:w-4 [&_svg]:h-4',
    md: 'w-12 h-12 [&_svg]:w-6 [&_svg]:h-6',
    lg: 'w-16 h-16 [&_svg]:w-8 [&_svg]:h-8',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg shrink-0',
        sizeClasses[size],
        bgColor,
        color
      )}
    >
      <Icon className="shrink-0" />
    </div>
  );
};

// ============================================================================
// File Actions Menu Component
// ============================================================================

interface FileActionsMenuProps {
  file: FileItem;
  onRename: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onPreview: (file: FileItem) => void;
  readOnly?: boolean;
}

const FileActionsMenu: React.FC<FileActionsMenuProps> = ({
  file,
  onRename,
  onDelete,
  onDownload,
  onPreview,
  readOnly = false,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onPreview(file)}>
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownload(file)}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </DropdownMenuItem>
        {!readOnly && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onRename(file)}>
              <Edit3 className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(file)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ============================================================================
// File Card Component (Grid View)
// ============================================================================

interface FileCardProps {
  file: FileItem;
  onRename: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onPreview: (file: FileItem) => void;
  readOnly?: boolean;
}

const FileCard: React.FC<FileCardProps> = ({
  file,
  onRename,
  onDelete,
  onDownload,
  onPreview,
  readOnly,
}) => {
  const { label } = getFileTypeInfo(file.name, file.type);

  return (
    <div className="group relative flex flex-col rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <FileIcon fileName={file.name} mimeType={file.type} size="lg" />
        <FileActionsMenu
          file={file}
          onRename={onRename}
          onDelete={onDelete}
          onDownload={onDownload}
          onPreview={onPreview}
          readOnly={readOnly}
        />
      </div>

      <div className="flex-1 min-w-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="font-medium text-sm truncate" title={file.name}>
              {file.name}
            </p>
          </TooltipTrigger>
          <TooltipContent>
            <p>{file.name}</p>
          </TooltipContent>
        </Tooltip>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t">
        <span className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDate(file.uploadedAt)}
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// File List Item Component (List View)
// ============================================================================

interface FileListItemProps {
  file: FileItem;
  onRename: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onPreview: (file: FileItem) => void;
  readOnly?: boolean;
}

const FileListItem: React.FC<FileListItemProps> = ({
  file,
  onRename,
  onDelete,
  onDownload,
  onPreview,
  readOnly,
}) => {
  const { label } = getFileTypeInfo(file.name, file.type);

  return (
    <div className="group flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <FileIcon fileName={file.name} mimeType={file.type} size="sm" />

      <div className="flex-1 min-w-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="font-medium text-sm truncate" title={file.name}>
              {file.name}
            </p>
          </TooltipTrigger>
          <TooltipContent>
            <p>{file.name}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Badge variant="secondary" className="hidden sm:inline-flex shrink-0">
        {label}
      </Badge>

      <span className="text-sm text-muted-foreground hidden md:block w-24 text-right shrink-0">
        {formatFileSize(file.size)}
      </span>

      <span className="text-sm text-muted-foreground hidden lg:block w-40 shrink-0">
        {formatDate(file.uploadedAt)}
      </span>

      <div className="flex items-center gap-1 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={() => onPreview(file)}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">Preview</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Preview</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={() => onDownload(file)}>
              <Download className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download</TooltipContent>
        </Tooltip>

        {!readOnly && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={() => onRename(file)}>
                  <Edit3 className="h-4 w-4" />
                  <span className="sr-only">Rename</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rename</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(file)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Folder Card Component
// ============================================================================

interface FolderCardProps {
  folder: FolderType;
  onClick: () => void;
  onDelete: (folder: FolderType) => void;
  readOnly?: boolean;
}

const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  onClick,
  onDelete,
  readOnly,
}) => {
  return (
    <div
      className="group relative flex flex-col rounded-lg border bg-card p-4 hover:shadow-md transition-all cursor-pointer hover:border-primary"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-amber-500/10 text-amber-500">
          <FolderOpen className="w-8 h-8" />
        </div>
        {!readOnly && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(folder);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="sr-only">Delete folder</span>
          </Button>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="font-medium text-sm truncate" title={folder.name}>
              {folder.name}
            </p>
          </TooltipTrigger>
          <TooltipContent>
            <p>{folder.name}</p>
          </TooltipContent>
        </Tooltip>
        <p className="text-xs text-muted-foreground mt-1">Folder</p>
      </div>

      <div className="mt-3 pt-3 border-t">
        <span className="text-xs text-muted-foreground">
          Created {formatDate(folder.createdAt)}
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// Upload Zone Component
// ============================================================================

interface UploadZoneProps {
  onFilesSelected: (files: FileList) => void;
  isUploading: boolean;
  disabled?: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  isUploading,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled || isUploading) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [disabled, isUploading, onFilesSelected]
  );

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed transition-colors cursor-pointer',
        isDragging && !disabled && !isUploading
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        (disabled || isUploading) && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
        disabled={disabled || isUploading}
      />

      <div className="flex flex-col items-center justify-center gap-2 text-center">
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, DWG, DXF, Images, and Documents
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// Breadcrumb Navigation Component
// ============================================================================

interface BreadcrumbNavProps {
  folders: FolderType[];
  currentFolder: string | null;
  onNavigate: (folderId: string | null) => void;
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  folders,
  currentFolder,
  onNavigate,
}) => {
  const buildBreadcrumbPath = (): FolderType[] => {
    const path: FolderType[] = [];
    let current = currentFolder;

    while (current) {
      const folder = folders.find((f) => f.id === current);
      if (folder) {
        path.unshift(folder);
        current = folder.parentId;
      } else {
        break;
      }
    }

    return path;
  };

  const path = buildBreadcrumbPath();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            onClick={() => onNavigate(null)}
            className="cursor-pointer"
          >
            Root
          </BreadcrumbLink>
        </BreadcrumbItem>

        {path.map((folder, index) => (
          <React.Fragment key={folder.id}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {index === path.length - 1 ? (
                <BreadcrumbPage>{folder.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  onClick={() => onNavigate(folder.id)}
                  className="cursor-pointer"
                >
                  {folder.name}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  type: 'files' | 'search';
  onCreateFolder?: () => void;
  searchQuery?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  onCreateFolder,
  searchQuery,
}) => {
  if (type === 'search') {
    return (
      <Empty className="py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Search className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>No results found</EmptyTitle>
          <EmptyDescription>
            No files match "{searchQuery}". Try adjusting your search.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Empty className="py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Folder className="h-6 w-6" />
        </EmptyMedia>
        <EmptyTitle>No files yet</EmptyTitle>
        <EmptyDescription>
          Upload files or create folders to get started.
        </EmptyDescription>
      </EmptyHeader>
      {onCreateFolder && (
        <Button variant="outline" onClick={onCreateFolder}>
          <Plus className="mr-2 h-4 w-4" />
          Create Folder
        </Button>
      )}
    </Empty>
  );
};

// ============================================================================
// Main FileManager Component
// ============================================================================

export const FileManager: React.FC<FileManagerProps> = ({
  ownerId,
  projectId,
  readOnly = false,
  title = 'File Manager',
  maxHeight = '600px',
}) => {
  // Store hooks
  const {
    files,
    folders,
    currentFolder,
    viewMode,
    searchQuery,
    isUploading,
    uploadProgress,
    uploadFile,
    deleteFile,
    renameFile,
    createFolder,
    deleteFolder,
    setCurrentFolder,
    setViewMode,
    setSearchQuery,
    getFilesByFolder,
  } = useFileStore();

  // Local state
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteFolderDialogOpen, setIsDeleteFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);

  // Filtered files based on current folder and search
  const filteredFiles = useMemo(() => {
    let result = getFilesByFolder(currentFolder || undefined);

    // Filter by owner if specified
    if (ownerId) {
      result = result.filter((f) => f.ownerId === ownerId);
    }

    // Filter by project if specified
    if (projectId) {
      result = result.filter((f) => f.projectId === projectId);
    }

    return result;
  }, [getFilesByFolder, currentFolder, ownerId, projectId, files, searchQuery]);

  // Folders in current directory
  const currentFolders = useMemo(() => {
    return folders.filter((f) => f.parentId === currentFolder);
  }, [folders, currentFolder]);

  // Check if any results exist
  const hasResults = filteredFiles.length > 0 || currentFolders.length > 0;

  // File upload handler
  const handleFilesSelected = async (fileList: FileList) => {
    for (const file of Array.from(fileList)) {
      await uploadFile(file, currentFolder || undefined);
    }
  };

  // Folder creation handler
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim(), currentFolder || undefined);
      setNewFolderName('');
      setIsCreateFolderDialogOpen(false);
    }
  };

  // File rename handler
  const handleRenameFile = () => {
    if (selectedFile && renameValue.trim()) {
      renameFile(selectedFile.id, renameValue.trim());
      setRenameValue('');
      setSelectedFile(null);
      setIsRenameDialogOpen(false);
    }
  };

  // File delete handler
  const handleDeleteFile = () => {
    if (selectedFile) {
      deleteFile(selectedFile.id);
      setSelectedFile(null);
      setIsDeleteDialogOpen(false);
    }
  };

  // Folder delete handler
  const handleDeleteFolder = () => {
    if (selectedFolder) {
      deleteFolder(selectedFolder.id);
      setSelectedFolder(null);
      setIsDeleteFolderDialogOpen(false);
    }
  };

  // File download handler
  const handleDownload = (file: FileItem) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // File preview handler (UI only)
  const handlePreview = (file: FileItem) => {
    // In a real implementation, this would open a preview modal
    window.open(file.url, '_blank');
  };

  // Rename dialog opener
  const openRenameDialog = (file: FileItem) => {
    setSelectedFile(file);
    setRenameValue(file.name);
    setIsRenameDialogOpen(true);
  };

  // Delete dialog opener
  const openDeleteDialog = (file: FileItem) => {
    setSelectedFile(file);
    setIsDeleteDialogOpen(true);
  };

  // Delete folder dialog opener
  const openDeleteFolderDialog = (folder: FolderType) => {
    setSelectedFolder(folder);
    setIsDeleteFolderDialogOpen(true);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>{title}</CardTitle>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon-sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                  <span className="sr-only">Grid view</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Grid view</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon-sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                  <span className="sr-only">List view</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>List view</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upload Zone */}
        {!readOnly && (
          <>
            <UploadZone
              onFilesSelected={handleFilesSelected}
              isUploading={isUploading}
              disabled={readOnly}
            />

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>

          {/* Actions */}
          {!readOnly && (
            <Button
              variant="outline"
              onClick={() => setIsCreateFolderDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          )}
        </div>

        <Separator />

        {/* Breadcrumb Navigation */}
        <BreadcrumbNav
          folders={folders}
          currentFolder={currentFolder}
          onNavigate={setCurrentFolder}
        />

        {/* File List */}
        <ScrollArea className={cn('rounded-md border', maxHeight && `h-[${maxHeight}]`)} style={{ maxHeight }}>
          <div className="p-4">
            {!hasResults ? (
              <EmptyState
                type={searchQuery ? 'search' : 'files'}
                onCreateFolder={
                  !readOnly ? () => setIsCreateFolderDialogOpen(true) : undefined
                }
                searchQuery={searchQuery}
              />
            ) : (
              <div
                className={cn(
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                    : 'flex flex-col gap-2'
                )}
              >
                {/* Folders */}
                {currentFolders.map((folder) =>
                  viewMode === 'grid' ? (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onClick={() => setCurrentFolder(folder.id)}
                      onDelete={openDeleteFolderDialog}
                      readOnly={readOnly}
                    />
                  ) : (
                    <div
                      key={folder.id}
                      className="group flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setCurrentFolder(folder.id)}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{folder.name}</p>
                      </div>
                      <Badge variant="secondary">Folder</Badge>
                      <span className="text-sm text-muted-foreground hidden lg:block w-40">
                        {formatDate(folder.createdAt)}
                      </span>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteFolderDialog(folder);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Delete folder</span>
                        </Button>
                      )}
                    </div>
                  )
                )}

                {/* Files */}
                {filteredFiles.map((file) =>
                  viewMode === 'grid' ? (
                    <FileCard
                      key={file.id}
                      file={file}
                      onRename={openRenameDialog}
                      onDelete={openDeleteDialog}
                      onDownload={handleDownload}
                      onPreview={handlePreview}
                      readOnly={readOnly}
                    />
                  ) : (
                    <FileListItem
                      key={file.id}
                      file={file}
                      onRename={openRenameDialog}
                      onDelete={openDeleteDialog}
                      onDownload={handleDownload}
                      onPreview={handlePreview}
                      readOnly={readOnly}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Create Folder Dialog */}
      <Dialog
        open={isCreateFolderDialogOpen}
        onOpenChange={setIsCreateFolderDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewFolderName('');
                setIsCreateFolderDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename File Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="New file name"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameFile()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameValue('');
                setSelectedFile(null);
                setIsRenameDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameFile} disabled={!renameValue.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete File Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedFile?.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFile(null);
                setIsDeleteDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFile}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Dialog */}
      <Dialog
        open={isDeleteFolderDialogOpen}
        onOpenChange={setIsDeleteFolderDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedFolder?.name}" and all its
              contents? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFolder(null);
                setIsDeleteFolderDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFolder}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default FileManager;
