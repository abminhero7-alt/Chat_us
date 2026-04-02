import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import logger from '../config/logger.js';

interface AuthSocket extends Socket {
  userId?: string;
  userName?: string;
}

const userSockets = new Map<string, Set<string>>();

export const initializeSocket = (io: Server) => {
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, displayName: true },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.userName = user.displayName;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: AuthSocket) => {
    const userId = socket.userId!;

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    // Join all chats this user is part of
    const userChats = await prisma.chatParticipant.findMany({
      where: { userId },
      select: { chatId: true },
    });
    userChats.forEach((cp) => {
      socket.join(cp.chatId);
      logger.debug(`User ${userId} joined chat room ${cp.chatId}`);
    });

    await prisma.user.update({
      where: { id: userId },
      data: { onlineStatus: 'ONLINE', lastSeen: new Date() },
    });

    // Broadcast to everyone that this user is online
    io.emit('presence:updated', {
      userId,
      status: 'ONLINE',
      lastSeen: new Date(),
    });

    logger.info(`User connected: ${userId} (${socket.userName})`);

    // ==================== MESSAGES ====================
    socket.on('message:send', async (data) => {
      try {
        const { chatId, content, type, mediaUrl, thumbnailUrl, replyToId } = data;

        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          include: { participants: true },
        });

        if (!chat) {
          socket.emit('error', 'Chat not found');
          return;
        }

        const isParticipant = chat.participants.some((p) => p.userId === userId);
        if (!isParticipant) {
          socket.emit('error', 'Not a participant');
          return;
        }

        const message = await prisma.message.create({
          data: {
            chatId,
            senderId: userId,
            content,
            type: type || 'TEXT',
            mediaUrl,
            thumbnailUrl,
            replyToId,
          },
          include: {
            sender: { select: { id: true, displayName: true, avatarUrl: true } },
            replyTo: {
              select: {
                id: true,
                content: true,
                type: true,
                sender: { select: { id: true, displayName: true } },
              },
            },
          },
        });

        const formattedMessage = {
          id: message.id,
          chatId: message.chatId,
          senderId: message.senderId,
          sender: message.sender,
          content: message.content,
          type: message.type,
          mediaUrl: message.mediaUrl,
          thumbnailUrl: message.thumbnailUrl,
          status: 'SENT',
          isEdited: false,
          isDeleted: false,
          replyTo: message.replyTo,
          reactions: [],
          createdAt: message.createdAt,
          readBy: [],
          deliveredTo: [],
        };

        // Broadcast to the chat room (all participants)
        io.to(chatId).emit('message:new', formattedMessage);
        logger.info(`Message sent in chat ${chatId} by ${userId}`);

        // Mark as delivered to sender
        await prisma.messageDelivery.create({
          data: { messageId: message.id, userId },
        });

        socket.emit('message:delivered', {
          messageId: message.id,
          chatId,
          userId,
        });
      } catch (error: any) {
        logger.error('Error sending message:', error);
        socket.emit('error', 'Failed to send message');
      }
    });

    socket.on('message:edit', async (data) => {
      try {
        const { messageId, content } = data;

        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message || message.senderId !== userId) {
          socket.emit('error', 'Cannot edit this message');
          return;
        }

        const updated = await prisma.message.update({
          where: { id: messageId },
          data: { content, isEdited: true },
          include: {
            sender: { select: { id: true, displayName: true, avatarUrl: true } },
          },
        });

        io.to(updated.chatId).emit('message:edited', {
          id: updated.id,
          chatId: updated.chatId,
          senderId: updated.senderId,
          sender: updated.sender,
          content: updated.content,
          type: updated.type,
          isEdited: true,
          updatedAt: updated.updatedAt,
        });
      } catch {
        socket.emit('error', 'Failed to edit message');
      }
    });

    socket.on('message:delete', async (data) => {
      try {
        const { messageId, deleteForEveryone } = data;

        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) {
          socket.emit('error', 'Message not found');
          return;
        }

        if (!deleteForEveryone && message.senderId !== userId) {
          socket.emit('error', 'Cannot delete this message');
          return;
        }

        await prisma.message.update({
          where: { id: messageId },
          data: { isDeleted: true, content: null },
        });

        io.to(message.chatId).emit('message:deleted', {
          messageId,
          chatId: message.chatId,
          deletedForEveryone: deleteForEveryone,
        });
      } catch {
        socket.emit('error', 'Failed to delete message');
      }
    });

    socket.on('message:react', async (data) => {
      try {
        const { messageId, emoji } = data;

        const message = await prisma.message.findUnique({
          where: { id: messageId },
          include: { chat: { include: { participants: true } } },
        });

        if (!message) {
          socket.emit('error', 'Message not found');
          return;
        }

        const reaction = await prisma.reaction.upsert({
          where: { messageId_userId: { messageId, userId } },
          update: { emoji },
          create: { messageId, userId, emoji },
          include: { user: { select: { id: true, displayName: true } } },
        });

        io.to(message.chatId).emit('message:reacted', { messageId, reaction });
      } catch {
        socket.emit('error', 'Failed to react');
      }
    });

    socket.on('message:read', async (data) => {
      try {
        const { chatId } = data;

        const messages = await prisma.message.findMany({
          where: {
            chatId,
            senderId: { not: userId },
            readBy: { none: { userId } },
          },
        });

        if (messages.length > 0) {
          await prisma.messageRead.createMany({
            data: messages.map((m) => ({ messageId: m.id, userId })),
          });

          messages.forEach((m) => {
            io.to(m.senderId).emit('message:read', {
              messageId: m.id,
              chatId,
              userId,
            });
          });
        }
      } catch (error) {
        logger.error('Error marking read:', error);
      }
    });

    socket.on('typing:start', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('typing:user', {
        chatId,
        userId,
        userName: socket.userName,
      });
    });

    socket.on('typing:stop', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('typing:stop', { chatId, userId });
    });

    // ==================== CALLS ====================
    socket.on('call:initiate', async (data) => {
      try {
        const { receiverId, type, chatId, sdpOffer, callId } = data;

        const call = await prisma.call.create({
          data: {
            id: callId || undefined,
            callerId: userId,
            receiverId,
            chatId,
            type,
            status: 'RINGING',
            startedAt: new Date(),
          },
        });

        const caller = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, displayName: true, avatarUrl: true },
        });

        const receiverSockets = userSockets.get(receiverId);
        if (receiverSockets) {
          receiverSockets.forEach((sid) => {
            io.to(sid).emit('call:incoming', {
              callId: call.id,
              callerId: userId,
              callerName: caller?.displayName,
              callerAvatar: caller?.avatarUrl,
              type,
              chatId,
              sdpOffer,
            });
          });
          logger.info(`Call initiated from ${userId} to ${receiverId}`);
        } else {
          logger.warn(`Receiver ${receiverId} has no active sockets`);
        }
      } catch (err) {
        logger.error('Failed to initiate call:', err);
        socket.emit('error', 'Failed to initiate call');
      }
    });

    socket.on('call:signal', (data) => {
      const { targetUserId, type: signalType, callId, data: signalData } = data;

      const targetSockets = userSockets.get(targetUserId);
      if (targetSockets) {
        targetSockets.forEach((sid) => {
          io.to(sid).emit('call:signal', {
            callId,
            type: signalType,
            data: signalData,
            fromUserId: userId,
          });
        });
      }
    });

    socket.on('call:accept', async (data) => {
      try {
        const { callId, sdpAnswer } = data;

        await prisma.call.update({
          where: { id: callId },
          data: { status: 'CONNECTED' },
        });

        const call = await prisma.call.findUnique({ where: { id: callId } });
        if (call) {
          const callerSockets = userSockets.get(call.callerId);
          if (callerSockets) {
            callerSockets.forEach((sid) => {
              io.to(sid).emit('call:accepted', { callId, sdpAnswer });
            });
          }
        }
      } catch {
        socket.emit('error', 'Failed to accept call');
      }
    });

    socket.on('call:reject', async (data) => {
      try {
        const { callId, reason } = data;

        await prisma.call.update({
          where: { id: callId },
          data: { status: 'REJECTED', endedAt: new Date() },
        });

        const call = await prisma.call.findUnique({ where: { id: callId } });
        if (call) {
          const callerSockets = userSockets.get(call.callerId);
          if (callerSockets) {
            callerSockets.forEach((sid) => {
              io.to(sid).emit('call:rejected', { callId, reason });
            });
          }
        }
      } catch {
        socket.emit('error', 'Failed to reject call');
      }
    });

    socket.on('call:end', async (data) => {
      try {
        const { callId } = data;

        const call = await prisma.call.findUnique({ where: { id: callId } });
        if (!call) return;

        const duration = call.startedAt
          ? Math.round((Date.now() - call.startedAt.getTime()) / 1000)
          : 0;

        await prisma.call.update({
          where: { id: callId },
          data: { status: 'ENDED', endedAt: new Date(), duration },
        });

        const otherUserId = call.callerId === userId ? call.receiverId : call.callerId;
        if (otherUserId) {
          const otherSockets = userSockets.get(otherUserId);
          if (otherSockets) {
            otherSockets.forEach((sid) => {
              io.to(sid).emit('call:ended', { callId, duration });
            });
          }
        }
      } catch {
        socket.emit('error', 'Failed to end call');
      }
    });

    socket.on('status:view', async (statusId) => {
      try {
        const status = await prisma.status.findUnique({ where: { id: statusId } });
        if (!status || status.userId === userId) return;

        await prisma.statusView.upsert({
          where: { statusId_userId: { statusId, userId } },
          update: { viewedAt: new Date() },
          create: { statusId, userId },
        });

        const ownerSockets = userSockets.get(status.userId);
        if (ownerSockets) {
          ownerSockets.forEach((sid) => {
            io.to(sid).emit('status:viewed', { statusId, viewerId: userId });
          });
        }
      } catch {
        logger.error('Error viewing status:', statusId);
      }
    });

    socket.on('presence:update', async (status) => {
      await prisma.user.update({
        where: { id: userId },
        data: { onlineStatus: status, lastSeen: new Date() },
      });

      io.emit('presence:updated', {
        userId,
        status,
        lastSeen: new Date(),
      });
    });

    socket.on('chat:pin', async (chatId) => {
      try {
        await prisma.chatPin.upsert({
          where: { chatId_userId: { chatId, userId } },
          update: {},
          create: { chatId, userId },
        });

        socket.emit('chat:updated', { id: chatId, isPinned: true });
      } catch {
        socket.emit('error', 'Failed to pin chat');
      }
    });

    socket.on('chat:archive', async (chatId) => {
      try {
        await prisma.chatArchive.upsert({
          where: { chatId_userId: { chatId, userId } },
          update: {},
          create: { chatId, userId },
        });

        socket.emit('chat:updated', { id: chatId, isArchived: true });
      } catch {
        socket.emit('error', 'Failed to archive chat');
      }
    });

    socket.on('disconnect', async () => {
      const userSocketSet = userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(userId);

          await prisma.user.update({
            where: { id: userId },
            data: { onlineStatus: 'OFFLINE', lastSeen: new Date() },
          });

          io.emit('presence:updated', {
            userId,
            status: 'OFFLINE',
            lastSeen: new Date(),
          });

          logger.info(`User disconnected: ${userId}`);
        }
      }
    });
  });
};

export { userSockets };
