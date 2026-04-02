import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import cloudinary from '../config/cloudinary.js';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        phone: true,
        displayName: true,
        avatarUrl: true,
        statusMessage: true,
        onlineStatus: true,
        lastSeen: true,
        role: true,
        isVerified: true,
        isTwoFactorEnabled: true,
        theme: true,
        chatBgUrl: true,
        lastSeenPrivacy: true,
        profilePhotoPrivacy: true,
        statusPrivacy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { displayName, statusMessage, theme, lastSeenPrivacy, profilePhotoPrivacy, statusPrivacy } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(displayName && { displayName }),
        ...(statusMessage !== undefined && { statusMessage }),
        ...(theme && { theme }),
        ...(lastSeenPrivacy && { lastSeenPrivacy }),
        ...(profilePhotoPrivacy && { profilePhotoPrivacy }),
        ...(statusPrivacy && { statusPrivacy }),
      },
      select: {
        id: true,
        email: true,
        phone: true,
        displayName: true,
        avatarUrl: true,
        statusMessage: true,
        theme: true,
        lastSeenPrivacy: true,
        profilePhotoPrivacy: true,
        statusPrivacy: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloud-name';

    let avatarUrl: string;

    if (isCloudinaryConfigured) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'avatars',
        transformation: [{ width: 400, height: 400, crop: 'fill' }],
      });
      avatarUrl = result.secure_url;
    } else {
      const uploadsDir = join(process.cwd(), 'uploads', 'avatars');
      if (!existsSync(uploadsDir)) {
        mkdirSync(uploadsDir, { recursive: true });
      }

      const ext = req.file.originalname?.split('.').pop() || 'jpg';
      const fileName = `${uuidv4()}.${ext}`;
      const destPath = join(uploadsDir, fileName);

      const { rename } = await import('fs/promises');
      await rename(req.file.path, destPath);

      avatarUrl = `/uploads/avatars/${fileName}`;
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl },
      select: { id: true, avatarUrl: true },
    });

    res.json({ success: true, data: user });
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload avatar' });
  }
};

export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    const contacts = await prisma.contact.findMany({
      where: { userId: req.user!.id },
      include: {
        contactUser: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            onlineStatus: true,
            lastSeen: true,
            statusMessage: true,
          },
        },
      },
    });

    res.json({ success: true, data: contacts });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch contacts' });
  }
};

export const addContact = async (req: AuthRequest, res: Response) => {
  try {
    const { email, phone } = req.body;

    const contactUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }].filter((w) => Object.keys(w).length > 0) },
    });

    if (!contactUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (contactUser.id === req.user!.id) {
      return res.status(400).json({ success: false, error: 'Cannot add yourself' });
    }

    const existing = await prisma.contact.findUnique({
      where: { userId_contactUserId: { userId: req.user!.id, contactUserId: contactUser.id } },
    });

    if (existing) {
      return res.json({ success: true, data: existing });
    }

    const contact = await prisma.contact.create({
      data: {
        userId: req.user!.id,
        contactUserId: contactUser.id,
      },
      include: {
        contactUser: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            onlineStatus: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, data: contact });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to add contact' });
  }
};

export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId: contactId } = req.body;

    const contact = await prisma.contact.upsert({
      where: { userId_contactUserId: { userId: req.user!.id, contactUserId: contactId } },
      update: { isBlocked: true },
      create: { userId: req.user!.id, contactUserId: contactId, isBlocked: true },
    });

    res.json({ success: true, data: contact });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to block user' });
  }
};

export const unblockUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId: contactId } = req.body;

    const contact = await prisma.contact.update({
      where: { userId_contactUserId: { userId: req.user!.id, contactUserId: contactId } },
      data: { isBlocked: false },
    });

    res.json({ success: true, data: contact });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to unblock user' });
  }
};

export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query;

    const whereClause: any = { id: { not: req.user!.id } };

    if (query && typeof query === 'string' && query.trim()) {
      whereClause.OR = [
        { displayName: { contains: query } },
        { email: { contains: query } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        onlineStatus: true,
        statusMessage: true,
      },
      take: 20,
    });

    res.json({ success: true, data: users });
  } catch {
    res.status(500).json({ success: false, error: 'Search failed' });
  }
};
