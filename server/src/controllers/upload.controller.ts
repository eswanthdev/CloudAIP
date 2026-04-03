import { Request, Response, NextFunction } from 'express';
import { success } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.middleware.js';
import { getSignedUploadUrl, deleteObject } from '../services/s3.service.js';

const ALLOWED_FOLDERS = ['avatars', 'thumbnails', 'videos', 'resources', 'certificates'];
const MAX_FILE_SIZES: Record<string, number> = {
  avatars: 5 * 1024 * 1024,       // 5MB
  thumbnails: 10 * 1024 * 1024,   // 10MB
  videos: 5 * 1024 * 1024 * 1024, // 5GB
  resources: 50 * 1024 * 1024,    // 50MB
  certificates: 10 * 1024 * 1024, // 10MB
};

export async function getPresignedUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { folder, fileName, contentType } = req.body;

    if (!folder || !fileName || !contentType) {
      throw new AppError('folder, fileName, and contentType are required', 400);
    }

    if (!ALLOWED_FOLDERS.includes(folder)) {
      throw new AppError(`Invalid folder. Allowed: ${ALLOWED_FOLDERS.join(', ')}`, 400);
    }

    const result = await getSignedUploadUrl(folder, fileName, contentType);

    success(res, {
      ...result,
      maxSize: MAX_FILE_SIZES[folder] || 10 * 1024 * 1024,
    }, 'Upload URL generated');
  } catch (err) {
    next(err);
  }
}

export async function deleteUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { key } = req.body;
    if (!key || typeof key !== 'string') {
      throw new AppError('key is required', 400);
    }

    // Validate key belongs to an allowed folder
    const folder = key.split('/')[0];
    if (!ALLOWED_FOLDERS.includes(folder)) {
      throw new AppError('Invalid file key', 400);
    }

    await deleteObject(key);
    success(res, null, 'File deleted');
  } catch (err) {
    next(err);
  }
}
