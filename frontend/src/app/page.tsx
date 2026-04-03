'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useSocketStore } from '@/store/socket';
import Sidebar from '@/components/layout/Sidebar';
import ChatPanel from '@/components/layout/ChatPanel';
import { registerServiceWorker } from '@/lib/pwa';

export default function Home() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { connect, disconnect } = useSocketStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) {
      router.push('/auth/login');
      return;
    }
    connect(token);
    return () => disconnect();
  }, [isHydrated, token, connect, disconnect, router]);

  if (!isHydrated || !token) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      <ChatPanel />
    </div>
  );
}
