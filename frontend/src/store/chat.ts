import { create } from 'zustand';

interface Chat {
  id: string;
  type: string;
  name?: string;
  avatarUrl?: string;
  lastMessage?: any;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  onlineStatus?: string;
  updatedAt: Date;
  participants?: any[];
}

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  isLoading: boolean;
  searchQuery: string;
  showArchived: boolean;
  setChats: (chats: Chat[]) => void;
  setActiveChat: (chat: Chat | null) => void;
  setSearchQuery: (query: string) => void;
  toggleArchived: () => void;
  addChat: (chat: Chat) => void;
  updateChat: (id: string, updates: Partial<Chat>) => void;
  addMessage: (chatId: string, message: any) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChat: null,
  isLoading: false,
  searchQuery: '',
  showArchived: false,
  setChats: (chats) => set({ chats }),
  setActiveChat: (chat) => set({ activeChat: chat }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleArchived: () => set((state) => ({ showArchived: !state.showArchived })),
  addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats] })),
  updateChat: (id, updates) =>
    set((state) => ({
      chats: state.chats.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      activeChat: state.activeChat?.id === id ? { ...state.activeChat, ...updates } : state.activeChat,
    })),
  addMessage: (chatId, message) =>
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId
          ? { ...c, lastMessage: message, updatedAt: new Date(message.createdAt) }
          : c
      ),
    })),
}));
