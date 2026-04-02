import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email?: string;
  phone?: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  statusMessage?: string;
  onlineStatus: string;
  isVerified: boolean;
  isTwoFactorEnabled: boolean;
  theme?: string;
  lastSeenPrivacy?: string;
  profilePhotoPrivacy?: string;
  statusPrivacy?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

// Use sessionStorage so each tab has its own session
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (user, token, refreshToken) =>
        set({ user, token, refreshToken, isAuthenticated: true }),
      logout: () =>
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'chat-us-auth',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
