'use client';

import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useSocketStore } from '@/store/socket';
import { useMessageStore } from '@/store/message';
import { useChatStore } from '@/store/chat';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';

interface SocketProviderProps {
  children: ReactNode;
}

const SocketContext = createContext<null>(null);

export function SocketProvider({ children }: SocketProviderProps) {
  const { socket, isConnected, on, off } = useSocketStore();
  const { addMessage, updateMessage, deleteMessage, addReaction, setTyping } = useMessageStore();
  const { updateChat, addMessage: updateChatLastMessage } = useChatStore();
  const { user } = useAuthStore();
  const handlersRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!socket || !user) return;

    // Remove old handlers first
    if (handlersRef.current.messageNew) off('message:new', handlersRef.current.messageNew);
    if (handlersRef.current.messageEdited) off('message:edited', handlersRef.current.messageEdited);
    if (handlersRef.current.messageDeleted) off('message:deleted', handlersRef.current.messageDeleted);
    if (handlersRef.current.messageReacted) off('message:reacted', handlersRef.current.messageReacted);
    if (handlersRef.current.messageRead) off('message:read', handlersRef.current.messageRead);
    if (handlersRef.current.typingUser) off('typing:user', handlersRef.current.typingUser);
    if (handlersRef.current.typingStop) off('typing:stop', handlersRef.current.typingStop);
    if (handlersRef.current.presenceUpdated) off('presence:updated', handlersRef.current.presenceUpdated);

    const handleNewMessage = (message: any) => {
      // Don't add our own messages again - they're already added locally
      if (message.senderId === user.id) {
        // Just update the temp message status
        const msgs = useMessageStore.getState().messages[message.chatId] || [];
        const tempMsg = msgs.find((m: any) => m.id.startsWith('temp-'));
        if (tempMsg) {
          updateMessage(message.chatId, tempMsg.id, {
            id: message.id,
            status: 'DELIVERED',
            createdAt: message.createdAt,
          });
        }
        return;
      }
      addMessage(message.chatId, message);
      updateChatLastMessage(message.chatId, message);

      const chat = useChatStore.getState().activeChat;
      if (chat?.id !== message.chatId) {
        toast.success(`New message from ${message.sender?.displayName || 'Someone'}`);
      }
    };

    const handleMessageEdited = (data: any) => {
      updateMessage(data.chatId, data.id, {
        content: data.content,
        isEdited: true,
      });
    };

    const handleMessageDeleted = (data: any) => {
      deleteMessage(data.chatId, data.messageId);
    };

    const handleMessageReacted = (data: any) => {
      const msgs = useMessageStore.getState().messages;
      let chatId = '';
      for (const [cid, msgsArr] of Object.entries(msgs)) {
        if ((msgsArr as any[]).find((m: any) => m.id === data.messageId)) {
          chatId = cid;
          break;
        }
      }
      addReaction(chatId, data.messageId, data.reaction);
    };

    const handleMessageRead = (data: any) => {
      updateMessage(data.chatId, data.messageId, {
        status: 'READ',
      });
    };

    const handleTypingUser = (data: any) => {
      setTyping(data.chatId, data.userId, true);
    };

    const handleTypingStop = (data: any) => {
      setTyping(data.chatId, data.userId, false);
    };

    const handlePresenceUpdated = (data: any) => {
      updateChat(data.userId, { onlineStatus: data.status });
    };

    handlersRef.current = {
      messageNew: handleNewMessage,
      messageEdited: handleMessageEdited,
      messageDeleted: handleMessageDeleted,
      messageReacted: handleMessageReacted,
      messageRead: handleMessageRead,
      typingUser: handleTypingUser,
      typingStop: handleTypingStop,
      presenceUpdated: handlePresenceUpdated,
    };

    on('message:new', handleNewMessage);
    on('message:edited', handleMessageEdited);
    on('message:deleted', handleMessageDeleted);
    on('message:reacted', handleMessageReacted);
    on('message:read', handleMessageRead);
    on('typing:user', handleTypingUser);
    on('typing:stop', handleTypingStop);
    on('presence:updated', handlePresenceUpdated);

    return () => {
      if (handlersRef.current.messageNew) off('message:new', handlersRef.current.messageNew);
      if (handlersRef.current.messageEdited) off('message:edited', handlersRef.current.messageEdited);
      if (handlersRef.current.messageDeleted) off('message:deleted', handlersRef.current.messageDeleted);
      if (handlersRef.current.messageReacted) off('message:reacted', handlersRef.current.messageReacted);
      if (handlersRef.current.messageRead) off('message:read', handlersRef.current.messageRead);
      if (handlersRef.current.typingUser) off('typing:user', handlersRef.current.typingUser);
      if (handlersRef.current.typingStop) off('typing:stop', handlersRef.current.typingStop);
      if (handlersRef.current.presenceUpdated) off('presence:updated', handlersRef.current.presenceUpdated);
    };
  }, [socket, user?.id]);

  return <SocketContext.Provider value={null}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
