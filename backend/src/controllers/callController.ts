import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';

export const getCalls = async (req: AuthRequest, res: Response) => {
  try {
    const calls = await prisma.call.findMany({
      where: {
        OR: [{ callerId: req.user!.id }, { receiverId: req.user!.id }],
      },
      include: {
        caller: { select: { id: true, displayName: true, avatarUrl: true } },
        receiver: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: calls });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch calls' });
  }
};

export const getCall = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const call = await prisma.call.findUnique({
      where: { id },
      include: {
        caller: { select: { id: true, displayName: true, avatarUrl: true } },
        receiver: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    if (!call) {
      return res.status(404).json({ success: false, error: 'Call not found' });
    }

    if (call.callerId !== req.user!.id && call.receiverId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    res.json({ success: true, data: call });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch call' });
  }
};

export const endCall = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { duration } = req.body;

    const call = await prisma.call.findUnique({ where: { id } });
    if (!call) {
      return res.status(404).json({ success: false, error: 'Call not found' });
    }

    if (call.callerId !== req.user!.id && call.receiverId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const updated = await prisma.call.update({
      where: { id },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
        duration: duration || Math.round((Date.now() - (call.startedAt?.getTime() || Date.now())) / 1000),
      },
    });

    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to end call' });
  }
};

export const getCallHistory = async (req: AuthRequest, res: Response) => {
  try {
    const calls = await prisma.call.findMany({
      where: {
        OR: [{ callerId: req.user!.id }, { receiverId: req.user!.id }],
        status: { in: ['ENDED', 'MISSED', 'REJECTED'] },
      },
      include: {
        caller: { select: { id: true, displayName: true, avatarUrl: true } },
        receiver: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ success: true, data: calls });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch call history' });
  }
};
