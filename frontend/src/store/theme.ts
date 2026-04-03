import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect, useState } from 'react';

interface ThemeState {
  theme: string;
  chatBg: string | null;
  setTheme: (theme: string) => void;
  setChatBg: (bg: string | null) => void;
  toggleTheme: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      chatBg: null,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      },
      setChatBg: (bg) => set({ chatBg: bg }),
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', newTheme === 'dark');
          }
          return { theme: newTheme };
        }),
    }),
    {
      name: 'chat-us-theme',
      storage: createJSONStorage(() => typeof window !== 'undefined' ? localStorage : null as any),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      },
    }
  )
);

// Hook to check if theme store has hydrated (for SSR compatibility)
export const useThemeHydrated = () => {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useThemeStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    if (useThemeStore.getState()._hasHydrated) {
      setHydrated(true);
    }
    return unsub;
  }, []);
  return hydrated;
};
