import { create } from 'zustand';

interface ThemeState {
  theme: string;
  chatBg: string | null;
  setTheme: (theme: string) => void;
  setChatBg: (bg: string | null) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  (set) => ({
    theme: 'light',
    chatBg: null,
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
  })
);
