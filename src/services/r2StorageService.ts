/**
 * Cloudflare R2 Storage Service
 * 
 * Handles file uploads, downloads, and management using Cloudflare R2.
 * All R2 operations are now routed through the server-side API to avoid
 * exposing R2 credentials in the browser bundle.
 * 
 * R2 Endpoint: https://fce57ea059c228c5cec72d0b7055c268.r2.cloudflarestorage.com/architex
 */

// API base URL - should be configured based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface R2File {
  id: string;
  name: string;
  key: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
  ownerId: string;
  folder: string | null;
  projectId?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload a file to R2 storage via server-side API
 */
export const uploadFileToR2 = async (
  file: File,
  ownerId: string,
  folder: string | null = null,
  projectId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<R2File> => {
  // Generate unique key for the file
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = folder 
    ? `${folder}/${timestamp}-${sanitizedFileName}`
    : `${timestamp}-${sanitizedFileName}`;

  // Report initial progress
  if (onProgress) {
    onProgress({
      loaded: 0,
      total: file.size,
      percentage: 0,
    });
  }

  // Create form data for upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('key', key);
  formData.append('ownerId', ownerId);
  if (projectId) {
    formData.append('projectId', projectId);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/r2/upload?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      body: file, // Send file directly as body
      headers: {
        // Content-Type will be set automatically with the boundary
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();

    // Report completion progress
    if (onProgress) {
      onProgress({
        loaded: file.size,
        total: file.size,
        percentage: 100,
      });
    }

    return {
      id: result.key,
      name: file.name,
      key: result.key,
      url: result.url,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      ownerId,
      folder,
      projectId,
    };
  } catch (error) {
    console.error('[R2StorageService] Upload error:', error);
    throw error;
  }
};

/**
 * Get a presigned URL for temporary access to a private file
 * Note: Currently returns direct URL - for enhanced security, 
 * implement proper presigned URLs on the server side
 */
export const getPresignedUrl = async (key: string, expirationSeconds: number = 3600): Promise<string> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/r2/presigned-url?key=${encodeURIComponent(key)}&expiration=${expirationSeconds}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get presigned URL');
    }

    const result = await response.json();
    return result.url;
  } catch (error) {
    console.error('[R2StorageService] Presigned URL error:', error);
    throw error;
  }
};

/**
 * Delete a file from R2 storage via server-side API
 */
export const deleteFileFromR2 = async (key: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/r2/delete?key=${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Delete failed');
    }
  } catch (error) {
    console.error('[R2StorageService] Delete error:', error);
    throw error;
  }
};

/**
 * List files in a folder
 */
export const listFilesInFolder = async (prefix: string = ''): Promise<R2File[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/r2/list?prefix=${encodeURIComponent(prefix)}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'List failed');
    }

    const result = await response.json();
    
    return result.files.map((file: { key: string; size: number; uploaded: string }) => {
      const key = file.key;
      const fileName = key.split('/').pop() || '';
      const timestamp = parseInt(fileName.split('-')[0]) || Date.now();
      
      return {
        id: key,
        name: fileName.replace(/^\d+-/, ''), // Remove timestamp prefix
        key,
        url: `https://fce57ea059c228c5cec72d0b7055c268.r2.cloudflarestorage.com/architex/${key}`,
        size: file.size,
        type: '',
        uploadedAt: new Date(timestamp),
        ownerId: '',
        folder: key.includes('/') ? key.split('/')[0] : null,
      };
    });
  } catch (error) {
    console.error('[R2StorageService] List error:', error);
    throw error;
  }
};

/**
 * Check if a file exists
 */
export const fileExists = async (key: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/r2/exists?key=${encodeURIComponent(key)}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Check failed');
    }

    const result = await response.json();
    return result.exists;
  } catch (error) {
    console.error('[R2StorageService] Exists check error:', error);
    throw error;
  }
};

/**
 * Get file metadata
 */
export const getFileMetadata = async (key: string): Promise<Record<string, string> | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/r2/metadata?key=${encodeURIComponent(key)}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Metadata fetch failed');
    }

    const result = await response.json();
    return result.metadata;
  } catch (error) {
    console.error('[R2StorageService] Metadata error:', error);
    throw error;
  }
};

/**
 * Upload a drawing file (with specific folder structure)
 */
export const uploadDrawing = async (
  file: File,
  projectId: string,
  freelancerId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<R2File> => {
  const folder = `drawings/${projectId}`;
  return uploadFileToR2(file, freelancerId, folder, projectId, onProgress);
};

/**
 * Upload a proof/completion file
 */
export const uploadProof = async (
  file: File,
  taskId: string,
  freelancerId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<R2File> => {
  const folder = `proofs/${taskId}`;
  return uploadFileToR2(file, freelancerId, folder, undefined, onProgress);
};

/**
 * Upload a profile image
 */
export const uploadProfileImage = async (
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<R2File> => {
  const folder = `profiles/${userId}`;
  // Delete old profile image if exists (optional)
  try {
    const existingFiles = await listFilesInFolder(folder);
    for (const existingFile of existingFiles) {
      await deleteFileFromR2(existingFile.key);
    }
  } catch (_error) {
    // Ignore errors, file might not exist
  }
  
  return uploadFileToR2(file, userId, folder, undefined, onProgress);
};

/**
 * Upload a general project file
 */
export const uploadProjectFile = async (
  file: File,
  projectId: string,
  ownerId: string,
  folder: string | null = null,
  onProgress?: (progress: UploadProgress) => void
): Promise<R2File> => {
  const fullFolder = folder 
    ? `projects/${projectId}/${folder}`
    : `projects/${projectId}`;
  return uploadFileToR2(file, ownerId, fullFolder, projectId, onProgress);
};
