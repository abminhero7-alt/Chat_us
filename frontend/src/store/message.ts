import { create } from 'zustand';

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  sender?: { id: string; displayName: string; avatarUrl?: string };
  content?: string;
  type: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  status: string;
  isEdited: boolean;
  isDeleted: boolean;
  replyTo?: any;
  reactions: any[];
  createdAt: Date;
  readBy: string[];
  deliveredTo: string[];
}

interface MessageState {
  messages: Record<string, Message[]>;
  isLoading: boolean;
  hasMore: Record<string, boolean>;
  cursor: Record<string, string | undefined>;
  typingUsers: Record<string, Set<string>>;
  setMessages: (chatId: string, messages: Message[], hasMore?: boolean, cursor?: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  addReaction: (chatId: string, messageId: string, reaction: any) => void;
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;
  setHasMore: (chatId: string, hasMore: boolean) => void;
  setCursor: (chatId: string, cursor: string | undefined) => void;
  clearMessages: (chatId: string) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: {},
  isLoading: false,
  hasMore: {},
  cursor: {},
  typingUsers: {},
  setMessages: (chatId, messages, hasMore = false, cursor) =>
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
      hasMore: { ...state.hasMore, [chatId]: hasMore },
      cursor: { ...state.cursor, [chatId]: cursor },
    })),
  addMessage: (chatId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      },
    })),
  updateMessage: (chatId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((m) =>
          m.id === messageId ? { ...m, ...updates } : m
        ),
      },
    })),
  deleteMessage: (chatId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: null } : m
        ),
      },
    })),
  addReaction: (chatId, messageId, reaction) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((m) => {
          if (m.id !== messageId) return m;
          const existingIdx = m.reactions.findIndex((r) => r.userId === reaction.userId);
          const newReactions =
            existingIdx >= 0
              ? m.reactions.map((r, i) => (i === existingIdx ? reaction : r))
              : [...m.reactions, reaction];
          return { ...m, reactions: newReactions };
        }),
      },
    })),
  setTyping: (chatId, userId, isTyping) =>
    set((state) => {
      const current = state.typingUsers[chatId] || new Set<string>();
      const updated = new Set(current);
      if (isTyping) {
        updated.add(userId);
      } else {
        updated.delete(userId);
      }
      return { typingUsers: { ...state.typingUsers, [chatId]: updated } };
    }),
  setHasMore: (chatId, hasMore) =>
    set((state) => ({ hasMore: { ...state.hasMore, [chatId]: hasMore } })),
  setCursor: (chatId, cursor) =>
    set((state) => ({ cursor: { ...state.cursor, [chatId]: cursor } })),
  clearMessages: (chatId) =>
    set((state) => ({
      messages: { ...state.messages, [chatId]: [] },
      hasMore: { ...state.hasMore, [chatId]: false },
      cursor: { ...state.cursor, [chatId]: undefined },
    })),
}));
