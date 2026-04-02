'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';

interface StoreProviderProps {
  children: ReactNode;
}

const StoreContext = createContext<null>(null);

export function StoreProvider({ children }: StoreProviderProps) {
  const { token } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  return <StoreContext.Provider value={null}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
