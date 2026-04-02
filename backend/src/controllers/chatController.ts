import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';

export const getChats = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', archived = 'false' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const showArchived = archived === 'true';

    const chats = await prisma.chat.findMany({
      where: {
        participants: { some: { userId: req.user!.id } },
        ...(showArchived
          ? { archivedBy: { some: { userId: req.user!.id } } }
          : { archivedBy: { none: { userId: req.user!.id } } }),
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                onlineStatus: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, displayName: true } },
          },
        },
        pinnedBy: { where: { userId: req.user!.id } },
        mutedBy: { where: { userId: req.user!.id } },
        archivedBy: { where: { userId: req.user!.id } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    const total = await prisma.chat.count({
      where: {
        participants: { some: { userId: req.user!.id } },
        ...(showArchived
          ? { archivedBy: { some: { userId: req.user!.id } } }
          : { archivedBy: { none: { userId: req.user!.id } } }),
      },
    });

    const formattedChats = chats.map((chat) => {
      const unreadCount = 0;
      const isPinned = chat.pinnedBy.length > 0;
      const isMuted = chat.mutedBy.length > 0;
      const isArchived = chat.archivedBy.length > 0;

      return {
        id: chat.id,
        type: chat.type,
        name: chat.type === 'GROUP' ? chat.name : chat.participants.find((p) => p.userId !== req.user!.id)?.user.displayName,
        avatarUrl: chat.type === 'GROUP' ? chat.avatarUrl : chat.participants.find((p) => p.userId !== req.user!.id)?.user.avatarUrl,
        lastMessage: chat.messages[0]
          ? {
              id: chat.messages[0].id,
              content: chat.messages[0].isDeleted ? '🚫 Deleted message' : chat.messages[0].content,
              senderId: chat.messages[0].senderId,
              senderName: chat.messages[0].sender.displayName,
              type: chat.messages[0].type,
              createdAt: chat.messages[0].createdAt,
            }
          : null,
        unreadCount,
        isPinned,
        isMuted,
        isArchived,
        onlineStatus: chat.type === 'PRIVATE' ? chat.participants.find((p) => p.userId !== req.user!.id)?.user.onlineStatus : null,
        updatedAt: chat.updatedAt,
      };
    });

    res.json({
      success: true,
      data: {
        chats: formattedChats,
        total,
        hasMore: pageNum * limitNum < total,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch chats' });
  }
};

export const getChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                onlineStatus: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    const isParticipant = chat.participants.some((p) => p.userId === req.user!.id);
    if (!isParticipant) {
      return res.status(403).json({ success: false, error: 'Not a participant' });
    }

    res.json({ success: true, data: chat });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch chat' });
  }
};

export const createChat = async (req: AuthRequest, res: Response) => {
  try {
    const { type, name, description, participantIds } = req.body;

    if (type === 'PRIVATE' && participantIds?.length === 1) {
      const existingChat = await prisma.chat.findFirst({
        where: {
          type: 'PRIVATE',
          AND: [
            { participants: { some: { userId: req.user!.id } } },
            { participants: { some: { userId: participantIds[0] } } },
          ],
        },
      });

      if (existingChat) {
        return res.json({ success: true, data: existingChat });
      }
    }

    const chat = await prisma.chat.create({
      data: {
        type,
        name: type === 'GROUP' ? name : undefined,
        description: type === 'GROUP' ? description : undefined,
        ownerId: type === 'GROUP' ? req.user!.id : undefined,
        participants: {
          create: [
            { userId: req.user!.id, role: type === 'GROUP' ? 'ADMIN' : 'MEMBER' },
            ...(participantIds || []).map((userId: string) => ({ userId, role: 'MEMBER' })),
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, displayName: true, avatarUrl: true } },
          },
        },
      },
    });

    res.status(201).json({ success: true, data: chat });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create chat' });
  }
};

export const updateChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, avatarUrl } = req.body;

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    const isAdmin = chat.participants.some(
      (p) => p.userId === req.user!.id && p.role === 'ADMIN'
    );

    if (chat.type === 'GROUP' && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Only admins can update group' });
    }

    const updated = await prisma.chat.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(avatarUrl && { avatarUrl }),
      },
    });

    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update chat' });
  }
};

export const deleteChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    const isAdmin = chat.ownerId === req.user!.id ||
      chat.participants.some((p) => p.userId === req.user!.id && p.role === 'ADMIN');

    if (chat.type === 'GROUP' && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Only admins can delete group' });
    }

    await prisma.chat.delete({ where: { id } });
    res.json({ success: true, message: 'Chat deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete chat' });
  }
};

export const addParticipant = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;

    const chat = await prisma.chat.findUnique({ where: { id }, include: { participants: true } });
    if (!chat || chat.type !== 'GROUP') {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const isAdmin = chat.participants.some(
      (p) => p.userId === req.user!.id && p.role === 'ADMIN'
    );
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Only admins can add members' });
    }

    const existingIds = chat.participants.map((p) => p.userId);
    const newIds = userIds.filter((uid: string) => !existingIds.includes(uid));

    await prisma.chatParticipant.createMany({
      data: newIds.map((userId: string) => ({ chatId: id, userId })),
    });

    res.json({ success: true, message: 'Participants added' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to add participants' });
  }
};

export const removeParticipant = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const chat = await prisma.chat.findUnique({ where: { id }, include: { participants: true } });
    if (!chat || chat.type !== 'GROUP') {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const isAdmin = chat.participants.some(
      (p) => p.userId === req.user!.id && p.role === 'ADMIN'
    );
    const isSelf = userId === req.user!.id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await prisma.chatParticipant.delete({
      where: { chatId_userId: { chatId: id, userId } },
    });

    res.json({ success: true, message: 'Participant removed' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to remove participant' });
  }
};

export const pinChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.chatPin.upsert({
      where: { chatId_userId: { chatId: id, userId: req.user!.id } },
      update: {},
      create: { chatId: id, userId: req.user!.id },
    });

    res.json({ success: true, message: 'Chat pinned' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to pin chat' });
  }
};

export const unpinChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.chatPin.deleteMany({
      where: { chatId: id, userId: req.user!.id },
    });

    res.json({ success: true, message: 'Chat unpinned' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to unpin chat' });
  }
};

export const archiveChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.chatArchive.upsert({
      where: { chatId_userId: { chatId: id, userId: req.user!.id } },
      update: {},
      create: { chatId: id, userId: req.user!.id },
    });

    res.json({ success: true, message: 'Chat archived' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to archive chat' });
  }
};

export const unarchiveChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.chatArchive.deleteMany({
      where: { chatId: id, userId: req.user!.id },
    });

    res.json({ success: true, message: 'Chat unarchived' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to unarchive chat' });
  }
};

export const muteChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { duration } = req.body;

    const mutedUntil = duration ? new Date(Date.now() + duration) : null;

    await prisma.chatMute.upsert({
      where: { chatId_userId: { chatId: id, userId: req.user!.id } },
      update: { mutedUntil },
      create: { chatId: id, userId: req.user!.id, mutedUntil },
    });

    res.json({ success: true, message: 'Chat muted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to mute chat' });
  }
};

export const unmuteChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.chatMute.deleteMany({
      where: { chatId: id, userId: req.user!.id },
    });

    res.json({ success: true, message: 'Chat unmuted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to unmute chat' });
  }
};
