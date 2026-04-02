'use client';

import { ThemeProvider } from '@/components/common/ThemeProvider';
import { StoreProvider } from '@/store/provider';
import { SocketProvider } from '@/lib/socket';
import { Toaster } from 'react-hot-toast';
import InstallPrompt from '@/components/common/InstallPrompt';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ThemeProvider>
        <SocketProvider>
          {children}
          <InstallPrompt />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
                borderRadius: '12px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: { primary: '#2563eb', secondary: '#fff' },
              },
            }}
          />
        </SocketProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}
