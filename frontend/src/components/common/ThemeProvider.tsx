'use client';

import { useEffect, createContext, useContext, ReactNode } from 'react';
import { useThemeStore } from '@/store/theme';

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeContext = createContext({});

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme } = useThemeStore();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  return <ThemeContext.Provider value={{}}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
