import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';
import { existsSync, mkdirSync, renameSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4'],
  document: ['application/pdf', 'application/msword', 'text/plain', 'application/zip'],
};

const MAX_SIZES: Record<string, number> = {
  image: 20 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  document: 100 * 1024 * 1024,
};

export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const category = req.body.category || 'document';
    const maxBytes = MAX_SIZES[category] || MAX_SIZES.document;

    if (req.file.size > maxBytes) {
      return res.status(400).json({
        success: false,
        error: `File too large. Max size: ${Math.round(maxBytes / 1024 / 1024)}MB`,
      });
    }

    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloud-name';

    if (isCloudinaryConfigured) {
      const allowedTypes = ALLOWED_TYPES[category] || ALLOWED_TYPES.document;
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ success: false, error: 'File type not allowed' });
      }

      const uploadOptions: any = {
        folder: `messenger/${category}`,
        resource_type: category === 'video' ? 'video' : category === 'image' ? 'image' : 'auto',
      };

      if (category === 'image') {
        uploadOptions.transformation = [{ width: 1920, height: 1920, crop: 'limit' }];
      }

      const result = await cloudinary.uploader.upload(req.file.path, uploadOptions);

      let thumbnailUrl: string | undefined;
      if (category === 'video' && result.secure_url) {
        thumbnailUrl = cloudinary.url(result.public_id, {
          transformation: [{ width: 320, height: 240, crop: 'fill' }],
          resource_type: 'video',
        });
      }

      res.json({
        success: true,
        data: {
          url: result.secure_url,
          thumbnailUrl,
          publicId: result.public_id,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    } else {
      const uploadsDir = join(process.cwd(), 'uploads', category);
      if (!existsSync(uploadsDir)) {
        mkdirSync(uploadsDir, { recursive: true });
      }

      const ext = req.file.originalname?.split('.').pop() || 'bin';
      const fileName = `${uuidv4()}.${ext}`;
      const destPath = join(uploadsDir, fileName);

      renameSync(req.file.path, destPath);

      res.json({
        success: true,
        data: {
          url: `/uploads/${category}/${fileName}`,
          thumbnailUrl: undefined,
          publicId: `${category}/${fileName}`,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
};

export const deleteFile = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ success: false, error: 'Public ID required' });
    }

    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloud-name';

    if (isCloudinaryConfigured) {
      await cloudinary.uploader.destroy(publicId);
    }

    res.json({ success: true, message: 'File deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Delete failed' });
  }
};
