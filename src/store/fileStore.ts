/**
 * File Store
 *
 * Manages file and folder state for the dashboard file management system.
 * Uses Cloudflare R2 for file storage and Firestore for metadata.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useAuthStore } from './authStore';
import {
  uploadFileToR2,
  deleteFileFromR2,
  listFilesInFolder,
  uploadDrawing,
  uploadProof,
  uploadProfileImage,
  uploadProjectFile,
  R2File,
  UploadProgress,
} from '@/services/r2StorageService';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs,
  Firestore,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';

// Helper to safely get db instance
const getDb = (): Firestore => {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized. Check your Firebase configuration.');
  }
  return db;
};

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
  key: string; // R2 storage key
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  ownerId: string;
}

interface FileState {
  files: FileItem[];
  folders: Folder[];
  currentFolder: string | null;
  viewMode: 'grid' | 'list';
  searchQuery: string;
  isUploading: boolean;
  uploadProgress: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  uploadFile: (file: File, folderId?: string, projectId?: string) => Promise<void>;
  uploadDrawing: (file: File, projectId: string) => Promise<R2File | null>;
  uploadProof: (file: File, taskId: string) => Promise<R2File | null>;
  uploadProfileImage: (file: File, userId: string) => Promise<R2File | null>;
  deleteFile: (id: string) => Promise<void>;
  renameFile: (id: string, newName: string) => Promise<void>;
  createFolder: (name: string, parentId?: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  setCurrentFolder: (folderId: string | null) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSearchQuery: (query: string) => void;
  getFilesByFolder: (folderId?: string) => FileItem[];
  getFilesByProject: (projectId: string) => FileItem[];
  getFilesByOwner: (ownerId: string) => FileItem[];
  
  // Firebase listeners
  initializeListeners: (userId: string) => () => void;
  clearFiles: () => void;
}

// Firestore collection references
const FILES_COLLECTION = 'files';
const FOLDERS_COLLECTION = 'folders';

export const useFileStore = create<FileState>()(
  subscribeWithSelector((set, get) => ({
    files: [],
    folders: [],
    currentFolder: null,
    viewMode: 'grid',
    searchQuery: '',
    isUploading: false,
    uploadProgress: 0,
    isLoading: false,
    error: null,

    /**
     * Initialize Firebase listeners for files and folders
     */
    initializeListeners: (userId: string) => {
      set({ isLoading: true });

      const database = getDb();

      // Subscribe to user's files
      const filesQuery = query(
        collection(database, FILES_COLLECTION),
        where('ownerId', '==', userId)
      );

      const unsubscribeFiles = onSnapshot(
        filesQuery,
        (snapshot) => {
          const files: FileItem[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              type: data.type,
              size: data.size,
              uploadedAt: data.uploadedAt?.toDate() || new Date(),
              folder: data.folder || null,
              url: data.url,
              ownerId: data.ownerId,
              projectId: data.projectId,
              key: data.key,
            };
          });
          set({ files, isLoading: false });
        },
        (error) => {
          console.error('[FileStore] Error fetching files:', error);
          set({ error: error.message, isLoading: false });
        }
      );

      // Subscribe to user's folders
      const foldersQuery = query(
        collection(database, FOLDERS_COLLECTION),
        where('ownerId', '==', userId)
      );

      const unsubscribeFolders = onSnapshot(
        foldersQuery,
        (snapshot) => {
          const folders: Folder[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              parentId: data.parentId || null,
              createdAt: data.createdAt?.toDate() || new Date(),
              ownerId: data.ownerId,
            };
          });
          set({ folders });
        },
        (error) => {
          console.error('[FileStore] Error fetching folders:', error);
        }
      );

      // Return cleanup function
      return () => {
        unsubscribeFiles();
        unsubscribeFolders();
      };
    },

    /**
     * Clear all files and folders (used on logout)
     */
    clearFiles: () => {
      set({
        files: [],
        folders: [],
        currentFolder: null,
        isUploading: false,
        uploadProgress: 0,
        error: null,
      });
    },

    /**
     * Upload a file to R2 and store metadata in Firestore
     */
    uploadFile: async (file: File, folderId?: string, projectId?: string) => {
      const currentUser = useAuthStore.getState().currentUser;
      if (!currentUser) {
        throw new Error('User must be logged in to upload files');
      }

      set({ isUploading: true, uploadProgress: 0 });

      try {
        // Get folder name if folderId provided
        let folderName: string | null = null;
        if (folderId) {
          const folder = get().folders.find((f) => f.id === folderId);
          folderName = folder?.name || null;
        }

        // Upload to R2
        const r2File = await uploadFileToR2(
          file,
          currentUser.id,
          folderName,
          projectId,
          (progress) => {
            set({ uploadProgress: progress.percentage });
          }
        );

        // Store metadata in Firestore
        const database = getDb();
        const fileRef = doc(collection(database, FILES_COLLECTION));
        const fileData = {
          id: fileRef.id,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: serverTimestamp(),
          folder: folderId || null,
          url: r2File.url,
          ownerId: currentUser.id,
          projectId: projectId || null,
          key: r2File.key,
        };

        await setDoc(fileRef, fileData);

        set({ isUploading: false, uploadProgress: 100 });
        
        // Reset progress after a short delay
        setTimeout(() => set({ uploadProgress: 0 }), 1000);
      } catch (error) {
        console.error('[FileStore] Upload error:', error);
        set({ 
          isUploading: false, 
          uploadProgress: 0,
          error: error instanceof Error ? error.message : 'Upload failed'
        });
        throw error;
      }
    },

    /**
     * Upload a drawing file for a project
     */
    uploadDrawing: async (file: File, projectId: string) => {
      const currentUser = useAuthStore.getState().currentUser;
      if (!currentUser) {
        throw new Error('User must be logged in to upload drawings');
      }

      set({ isUploading: true, uploadProgress: 0 });

      try {
        const r2File = await uploadDrawing(
          file,
          projectId,
          currentUser.id,
          (progress) => {
            set({ uploadProgress: progress.percentage });
          }
        );

        // Store metadata in Firestore
        const database = getDb();
        const fileRef = doc(collection(database, FILES_COLLECTION));
        await setDoc(fileRef, {
          id: fileRef.id,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: serverTimestamp(),
          folder: `drawings/${projectId}`,
          url: r2File.url,
          ownerId: currentUser.id,
          projectId,
          key: r2File.key,
        });

        set({ isUploading: false, uploadProgress: 100 });
        setTimeout(() => set({ uploadProgress: 0 }), 1000);

        return r2File;
      } catch (error) {
        console.error('[FileStore] Drawing upload error:', error);
        set({ 
          isUploading: false, 
          uploadProgress: 0,
          error: error instanceof Error ? error.message : 'Upload failed'
        });
        return null;
      }
    },

    /**
     * Upload a proof/completion file
     */
    uploadProof: async (file: File, taskId: string) => {
      const currentUser = useAuthStore.getState().currentUser;
      if (!currentUser) {
        throw new Error('User must be logged in to upload proofs');
      }

      set({ isUploading: true, uploadProgress: 0 });

      try {
        const r2File = await uploadProof(
          file,
          taskId,
          currentUser.id,
          (progress) => {
            set({ uploadProgress: progress.percentage });
          }
        );

        // Store metadata in Firestore
        const database = getDb();
        const fileRef = doc(collection(database, FILES_COLLECTION));
        await setDoc(fileRef, {
          id: fileRef.id,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: serverTimestamp(),
          folder: `proofs/${taskId}`,
          url: r2File.url,
          ownerId: currentUser.id,
          key: r2File.key,
        });

        set({ isUploading: false, uploadProgress: 100 });
        setTimeout(() => set({ uploadProgress: 0 }), 1000);

        return r2File;
      } catch (error) {
        console.error('[FileStore] Proof upload error:', error);
        set({ 
          isUploading: false, 
          uploadProgress: 0,
          error: error instanceof Error ? error.message : 'Upload failed'
        });
        return null;
      }
    },

    /**
     * Upload a profile image
     */
    uploadProfileImage: async (file: File, userId: string) => {
      set({ isUploading: true, uploadProgress: 0 });

      try {
        const r2File = await uploadProfileImage(
          file,
          userId,
          (progress) => {
            set({ uploadProgress: progress.percentage });
          }
        );

        // Store metadata in Firestore
        const database = getDb();
        const fileRef = doc(collection(database, FILES_COLLECTION));
        await setDoc(fileRef, {
          id: fileRef.id,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: serverTimestamp(),
          folder: `profiles/${userId}`,
          url: r2File.url,
          ownerId: userId,
          key: r2File.key,
          isProfileImage: true,
        });

        set({ isUploading: false, uploadProgress: 100 });
        setTimeout(() => set({ uploadProgress: 0 }), 1000);

        return r2File;
      } catch (error) {
        console.error('[FileStore] Profile image upload error:', error);
        set({ 
          isUploading: false, 
          uploadProgress: 0,
          error: error instanceof Error ? error.message : 'Upload failed'
        });
        return null;
      }
    },

    /**
     * Delete a file by ID (from both R2 and Firestore)
     */
    deleteFile: async (id: string) => {
      const file = get().files.find((f) => f.id === id);
      if (!file) return;

      try {
        // Delete from R2
        if (file.key) {
          await deleteFileFromR2(file.key);
        }

        // Delete from Firestore
        const database = getDb();
        await deleteDoc(doc(database, FILES_COLLECTION, id));
      } catch (error) {
        console.error('[FileStore] Delete error:', error);
        throw error;
      }
    },

    /**
     * Rename a file (updates Firestore metadata only)
     */
    renameFile: async (id: string, newName: string) => {
      try {
        const database = getDb();
        const fileRef = doc(database, FILES_COLLECTION, id);
        await setDoc(fileRef, { name: newName }, { merge: true });
      } catch (error) {
        console.error('[FileStore] Rename error:', error);
        throw error;
      }
    },

    /**
     * Create a new folder (stores in Firestore)
     */
    createFolder: async (name: string, parentId?: string) => {
      const currentUser = useAuthStore.getState().currentUser;
      if (!currentUser) {
        throw new Error('User must be logged in to create folders');
      }

      try {
        const database = getDb();
        const folderRef = doc(collection(database, FOLDERS_COLLECTION));
        await setDoc(folderRef, {
          id: folderRef.id,
          name,
          parentId: parentId || null,
          createdAt: serverTimestamp(),
          ownerId: currentUser.id,
        });
      } catch (error) {
        console.error('[FileStore] Create folder error:', error);
        throw error;
      }
    },

    /**
     * Delete a folder and its contents
     */
    deleteFolder: async (id: string) => {
      try {
        // Get all files in this folder
        const folder = get().folders.find((f) => f.id === id);
        if (!folder) return;

        const filesInFolder = get().files.filter((f) => f.folder === id);

        // Delete all files from R2 and Firestore
        const database = getDb();
        for (const file of filesInFolder) {
          if (file.key) {
            await deleteFileFromR2(file.key);
          }
          await deleteDoc(doc(database, FILES_COLLECTION, file.id));
        }

        // Delete folder from Firestore
        await deleteDoc(doc(database, FOLDERS_COLLECTION, id));

        // Update current folder if needed
        if (get().currentFolder === id) {
          set({ currentFolder: null });
        }
      } catch (error) {
        console.error('[FileStore] Delete folder error:', error);
        throw error;
      }
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
  }))
);
