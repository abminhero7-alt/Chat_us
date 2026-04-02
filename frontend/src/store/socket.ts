import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  connect: (token: string) => {
    // Use same host as the page (works on PC, phone, any device)
    const wsUrl = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : 'http://localhost:3001';

    console.log('[Socket] Connecting to:', wsUrl);

    const socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected, id:', socket.id);
      set({ isConnected: true });
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      set({ isConnected: false });
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    set({ socket });
  },
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
  emit: (event: string, data: any) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit(event, data);
    }
  },
  on: (event: string, callback: (...args: any[]) => void) => {
    const { socket } = get();
    if (socket) {
      socket.on(event, callback);
    }
  },
  off: (event: string, callback: (...args: any[]) => void) => {
    const { socket } = get();
    if (socket) {
      socket.off(event, callback);
    }
  },
}));
