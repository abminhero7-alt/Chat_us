'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuthStore, useAuthHydrated } from '@/store/auth';
import { useThemeStore, useThemeHydrated } from '@/store/theme';

interface StoreProviderProps {
  children: ReactNode;
}

const StoreContext = createContext<null>(null);

export function StoreProvider({ children }: StoreProviderProps) {
  const authHydrated = useAuthHydrated();
  const themeHydrated = useThemeHydrated();
  const [mounted, setMounted] = useState(false);
  
  const { token } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme, mounted]);

  // Prevent hydration mismatch by not rendering until hydrated
  if (!authHydrated || !themeHydrated || !mounted) {
    return (
      <StoreContext.Provider value={null}>
        <div style={{ visibility: 'hidden' }}>{children}</div>
      </StoreContext.Provider>
    );
  }

  return <StoreContext.Provider value={null}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
