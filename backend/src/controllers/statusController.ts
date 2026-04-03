import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';

export const getStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();

    const contacts = await prisma.contact.findMany({
      where: { userId: req.user!.id, isBlocked: false },
      select: { contactUserId: true },
    });

    const contactIds = contacts.map((c) => c.contactUserId);

    const statuses = await prisma.status.findMany({
      where: {
        userId: { in: contactIds },
        expiresAt: { gt: now },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        views: { where: { userId: req.user!.id } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const grouped = statuses.reduce((acc: any, status) => {
      const userId = status.userId;
      if (!acc[userId]) {
        acc[userId] = {
          user: status.user,
          statuses: [],
          hasViewed: status.views.length > 0,
        };
      }
      acc[userId].statuses.push({
        id: status.id,
        type: status.type,
        content: status.content,
        mediaUrl: status.mediaUrl,
        thumbnailUrl: status.thumbnailUrl,
        createdAt: status.createdAt,
        expiresAt: status.expiresAt,
        viewed: status.views.length > 0,
      });
      return acc;
    }, {});

    res.json({ success: true, data: Object.values(grouped) });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch statuses' });
  }
};

export const getMyStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();

    const statuses = await prisma.status.findMany({
      where: {
        userId: req.user!.id,
        expiresAt: { gt: now },
      },
      include: {
        views: {
          where: { userId: req.user!.id },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: statuses });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch your statuses' });
  }
};

export const createStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { type, content, mediaUrl, thumbnailUrl } = req.body;

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const status = await prisma.status.create({
      data: {
        userId: req.user!.id,
        type,
        content,
        mediaUrl,
        thumbnailUrl,
        expiresAt,
      },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
    });

    res.status(201).json({ success: true, data: status });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create status' });
  }
};

export const deleteStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const status = await prisma.status.findUnique({ where: { id } });
    if (!status) {
      return res.status(404).json({ success: false, error: 'Status not found' });
    }

    if (status.userId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await prisma.status.delete({ where: { id } });
    res.json({ success: true, message: 'Status deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete status' });
  }
};

export const viewStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const status = await prisma.status.findUnique({ where: { id } });
    if (!status || status.expiresAt < new Date()) {
      return res.status(404).json({ success: false, error: 'Status not found or expired' });
    }

    if (status.userId === req.user!.id) {
      return res.status(400).json({ success: false, error: 'Cannot view own status' });
    }

    await prisma.statusView.upsert({
      where: { statusId_userId: { statusId: id, userId: req.user!.id } },
      update: { viewedAt: new Date() },
      create: { statusId: id, userId: req.user!.id },
    });

    res.json({ success: true, message: 'Status viewed' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to view status' });
  }
};
