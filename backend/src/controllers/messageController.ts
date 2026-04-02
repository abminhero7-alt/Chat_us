import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { cursor, limit = '50' } = req.query;
    const limitNum = parseInt(limit as string);

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: { where: { userId: req.user!.id } } },
    });

    if (!chat || chat.participants.length === 0) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        isDeleted: false,
        ...(cursor ? { createdAt: { lt: new Date(cursor as string) } } : {}),
      },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
        reactions: {
          include: { user: { select: { id: true, displayName: true } } },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            type: true,
            sender: { select: { id: true, displayName: true } },
          },
        },
        readBy: { select: { userId: true } },
        deliveredTo: { select: { userId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limitNum + 1,
    });

    const hasMore = messages.length > limitNum;
    const resultMessages = hasMore ? messages.slice(0, -1) : messages;
    const formattedMessages = resultMessages.reverse().map((msg) => ({
      id: msg.id,
      chatId: msg.chatId,
      senderId: msg.senderId,
      sender: msg.sender,
      content: msg.isDeleted ? undefined : msg.content,
      type: msg.type,
      mediaUrl: msg.mediaUrl,
      thumbnailUrl: msg.thumbnailUrl,
      status: msg.status,
      isEdited: msg.isEdited,
      isDeleted: msg.isDeleted,
      replyTo: msg.replyTo,
      forwardedFromId: msg.forwardedFromId,
      reactions: msg.reactions,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      readBy: msg.readBy.map((r) => r.userId),
      deliveredTo: msg.deliveredTo.map((d) => d.userId),
    }));

    res.json({
      success: true,
      data: {
        messages: formattedMessages,
        hasMore,
        cursor: hasMore ? resultMessages[resultMessages.length - 1].createdAt.toISOString() : undefined,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
};

export const searchMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'Search query required' });
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        content: { contains: query as string, mode: 'insensitive' },
        isDeleted: false,
      },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: messages });
  } catch {
    res.status(500).json({ success: false, error: 'Search failed' });
  }
};

export const starMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.body;

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: message.chatId },
      include: { participants: { where: { userId: req.user!.id } } },
    });

    if (!chat || chat.participants.length === 0) {
      return res.status(403).json({ success: false, error: 'Not a participant' });
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        starredBy: { connect: { id: req.user!.id } },
      },
    });

    res.json({ success: true, message: 'Message starred' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to star message' });
  }
};

export const unstarMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.body;

    await prisma.message.update({
      where: { id: messageId },
      data: {
        starredBy: { disconnect: { id: req.user!.id } },
      },
    });

    res.json({ success: true, message: 'Message unstarred' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to unstar message' });
  }
};

export const getStarredMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        starredBy: { some: { id: req.user!.id } },
        isDeleted: false,
      },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: messages });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch starred messages' });
  }
};

export const forwardMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId, chatIds } = req.body;

    const originalMessage = await prisma.message.findUnique({ where: { id: messageId } });
    if (!originalMessage) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    const forwardedMessages = await Promise.all(
      chatIds.map(async (chatId: string) => {
        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          include: { participants: { where: { userId: req.user!.id } } },
        });

        if (!chat || chat.participants.length === 0) {
          throw new Error(`Not a participant of chat ${chatId}`);
        }

        return prisma.message.create({
          data: {
            chatId,
            senderId: req.user!.id,
            content: originalMessage.content,
            type: originalMessage.type,
            mediaUrl: originalMessage.mediaUrl,
            thumbnailUrl: originalMessage.thumbnailUrl,
            forwardedFromId: messageId,
          },
        });
      })
    );

    res.json({ success: true, data: forwardedMessages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to forward message' });
  }
};
