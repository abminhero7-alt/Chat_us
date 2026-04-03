import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect, useState } from 'react';

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
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

// Use sessionStorage so each tab has its own session
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
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
      storage: createJSONStorage(() => typeof window !== 'undefined' ? sessionStorage : null as any),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      },
    }
  )
);

// Hook to check if auth store has hydrated (for SSR compatibility)
export const useAuthHydrated = () => {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    // Check if already hydrated
    if (useAuthStore.getState()._hasHydrated) {
      setHydrated(true);
    }
    return unsub;
  }, []);
  return hydrated;
};
