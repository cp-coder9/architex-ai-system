/**
 * Cloudflare R2 Storage Service
 * 
 * Handles file uploads, downloads, and management using Cloudflare R2 (S3-compatible).
 * R2 Endpoint: https://fce57ea059c228c5cec72d0b7055c268.r2.cloudflarestorage.com/architex
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 Configuration
const R2_ACCOUNT_ID = 'fce57ea059c228c5cec72d0b7055c268';
const R2_BUCKET_NAME = 'architex';
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

// Initialize S3 client for R2
const getS3Client = () => {
  const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured. Please set VITE_R2_ACCESS_KEY_ID and VITE_R2_SECRET_ACCESS_KEY environment variables.');
  }

  return new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

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
 * Upload a file to R2 storage
 */
export const uploadFileToR2 = async (
  file: File,
  ownerId: string,
  folder: string | null = null,
  projectId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<R2File> => {
  const s3Client = getS3Client();
  
  // Generate unique key for the file
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = folder 
    ? `${folder}/${timestamp}-${sanitizedFileName}`
    : `${timestamp}-${sanitizedFileName}`;

  // Convert File to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Upload to R2
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: uint8Array,
    ContentType: file.type,
    Metadata: {
      ownerId,
      originalName: file.name,
      ...(projectId && { projectId }),
    },
  });

  await s3Client.send(command);

  // Generate public URL
  const publicUrl = `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`;

  // Report progress (R2 doesn't support streaming progress, so we simulate it)
  if (onProgress) {
    onProgress({
      loaded: file.size,
      total: file.size,
      percentage: 100,
    });
  }

  return {
    id: key,
    name: file.name,
    key,
    url: publicUrl,
    size: file.size,
    type: file.type,
    uploadedAt: new Date(),
    ownerId,
    folder,
    projectId,
  };
};

/**
 * Generate a presigned URL for temporary access to a private file
 */
export const getPresignedUrl = async (key: string, expirationSeconds: number = 3600): Promise<string> => {
  const s3Client = getS3Client();
  
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expirationSeconds });
};

/**
 * Delete a file from R2 storage
 */
export const deleteFileFromR2 = async (key: string): Promise<void> => {
  const s3Client = getS3Client();
  
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
};

/**
 * List files in a folder
 */
export const listFilesInFolder = async (prefix: string = ''): Promise<R2File[]> => {
  const s3Client = getS3Client();
  
  const command = new ListObjectsV2Command({
    Bucket: R2_BUCKET_NAME,
    Prefix: prefix,
  });

  const response = await s3Client.send(command);
  
  if (!response.Contents) {
    return [];
  }

  return response.Contents.map((object) => {
    const key = object.Key || '';
    const fileName = key.split('/').pop() || '';
    const timestamp = parseInt(fileName.split('-')[0]) || Date.now();
    
    return {
      id: key,
      name: fileName.replace(/^\d+-/, ''), // Remove timestamp prefix
      key,
      url: `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`,
      size: object.Size || 0,
      type: '', // Type would need to be stored in metadata
      uploadedAt: new Date(timestamp),
      ownerId: '', // Would need to fetch metadata
      folder: key.includes('/') ? key.split('/')[0] : null,
    };
  });
};

/**
 * Check if a file exists
 */
export const fileExists = async (key: string): Promise<boolean> => {
  const s3Client = getS3Client();
  
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get file metadata
 */
export const getFileMetadata = async (key: string): Promise<Record<string, string> | null> => {
  const s3Client = getS3Client();
  
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    const response = await s3Client.send(command);
    return response.Metadata || null;
  } catch (error) {
    return null;
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
  } catch (error) {
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
