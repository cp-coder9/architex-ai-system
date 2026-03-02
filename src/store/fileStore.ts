/**
 * File Store
 *
 * Manages file and folder state for the dashboard file management system.
 * Provides file upload, folder management, and file organization capabilities.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// File type definitions
export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  folder: string | null;
  url: string;
  ownerId: string;
  projectId?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
}

interface FileState {
  files: FileItem[];
  folders: Folder[];
  currentFolder: string | null;
  viewMode: 'grid' | 'list';
  searchQuery: string;
  isUploading: boolean;
  uploadProgress: number;

  // Actions
  uploadFile: (file: File, folderId?: string) => Promise<void>;
  deleteFile: (id: string) => void;
  renameFile: (id: string, newName: string) => void;
  createFolder: (name: string, parentId?: string) => void;
  deleteFolder: (id: string) => void;
  setCurrentFolder: (folderId: string | null) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSearchQuery: (query: string) => void;
  getFilesByFolder: (folderId?: string) => FileItem[];
  getFilesByProject: (projectId: string) => FileItem[];
  getFilesByOwner: (ownerId: string) => FileItem[];
}

export const useFileStore = create<FileState>()(
  persist(
    (set, get) => ({
      files: [],
      folders: [],
      currentFolder: null,
      viewMode: 'grid',
      searchQuery: '',
      isUploading: false,
      uploadProgress: 0,

      /**
       * Upload a file to the store
       */
      uploadFile: async (file: File, folderId?: string) => {
        set({ isUploading: true, uploadProgress: 0 });

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          set((state) => ({
            uploadProgress: Math.min(state.uploadProgress + 10, 90),
          }));
        }, 100);

        // Simulate file processing delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        clearInterval(progressInterval);

        const newFile: FileItem = {
          id: `file-${Date.now()}`,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: new Date(),
          folder: folderId || null,
          url: URL.createObjectURL(file),
          ownerId: 'current-user', // This should be replaced with actual user ID
        };

        set((state) => ({
          files: [...state.files, newFile],
          isUploading: false,
          uploadProgress: 100,
        }));

        // Reset progress after a short delay
        setTimeout(() => set({ uploadProgress: 0 }), 1000);
      },

      /**
       * Delete a file by ID
       */
      deleteFile: (id: string) => {
        set((state) => ({
          files: state.files.filter((f) => f.id !== id),
        }));
      },

      /**
       * Rename a file
       */
      renameFile: (id: string, newName: string) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, name: newName } : f
          ),
        }));
      },

      /**
       * Create a new folder
       */
      createFolder: (name: string, parentId?: string) => {
        const newFolder: Folder = {
          id: `folder-${Date.now()}`,
          name,
          parentId: parentId || null,
          createdAt: new Date(),
        };

        set((state) => ({
          folders: [...state.folders, newFolder],
        }));
      },

      /**
       * Delete a folder and optionally its contents
       */
      deleteFolder: (id: string) => {
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          files: state.files.filter((f) => f.folder !== id),
          currentFolder: state.currentFolder === id ? null : state.currentFolder,
        }));
      },

      /**
       * Set the current active folder
       */
      setCurrentFolder: (folderId: string | null) => {
        set({ currentFolder: folderId });
      },

      /**
       * Toggle between grid and list view
       */
      setViewMode: (mode: 'grid' | 'list') => {
        set({ viewMode: mode });
      },

      /**
       * Set the search query for filtering files
       */
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      /**
       * Get all files in a specific folder
       */
      getFilesByFolder: (folderId?: string) => {
        const { files, searchQuery } = get();
        let filteredFiles = files.filter(
          (f) => f.folder === (folderId || null)
        );

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredFiles = filteredFiles.filter((f) =>
            f.name.toLowerCase().includes(query)
          );
        }

        return filteredFiles;
      },

      /**
       * Get all files for a specific project
       */
      getFilesByProject: (projectId: string) => {
        return get().files.filter((f) => f.projectId === projectId);
      },

      /**
       * Get all files owned by a specific user
       */
      getFilesByOwner: (ownerId: string) => {
        return get().files.filter((f) => f.ownerId === ownerId);
      },
    }),
    {
      name: 'file-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        files: state.files,
        folders: state.folders,
        currentFolder: state.currentFolder,
        viewMode: state.viewMode,
      }),
      // Custom serialization/deserialization to handle Date objects
      onRehydrateStorage: () => (state) => {
        if (state?.files) {
          state.files = state.files.map((file) => ({
            ...file,
            uploadedAt: new Date(file.uploadedAt),
          }));
        }
        if (state?.folders) {
          state.folders = state.folders.map((folder) => ({
            ...folder,
            createdAt: new Date(folder.createdAt),
          }));
        }
      },
    }
  )
);
