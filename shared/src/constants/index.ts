export const APP_NAME = 'Chat US';
export const APP_VERSION = '1.0.0';

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_DOCUMENT_SIZE = 100 * 1024 * 1024; // 100MB

export const MAX_GROUP_SIZE = 256;
export const MAX_STATUS_DURATION_HOURS = 24;
export const MAX_MESSAGE_LENGTH = 4096;
export const MAX_DISPLAY_NAME_LENGTH = 50;
export const MAX_STATUS_MESSAGE_LENGTH = 139;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4', 'audio/webm'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed',
];

export const JWT_EXPIRES_IN = '7d';
export const REFRESH_TOKEN_EXPIRES_IN = '30d';
export const ACCESS_TOKEN_EXPIRES_IN = '15m';

export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMIT_MAX_REQUESTS = 100;
export const MESSAGE_RATE_LIMIT = 30;
export const MESSAGE_RATE_WINDOW = 60 * 1000;

export const DEFAULT_AVATAR_URL = '/icons/default-avatar.png';
export const DEFAULT_CHAT_BG = '/icons/default-chat-bg.jpg';

export const STICKER_PACKS = [
  { id: 'default', name: 'Default', stickers: Array.from({ length: 30 }, (_, i) => `/stickers/default/${i + 1}.png`) },
];

export const THEMES = {
  light: {
    name: 'Light',
    primary: '#0084ff',
    background: '#ffffff',
    surface: '#f0f2f5',
    text: '#050505',
    textSecondary: '#65676b',
    border: '#e4e6eb',
    chatBg: '#efeae2',
    sentBubble: '#0084ff',
    receivedBubble: '#e4e6eb',
  },
  dark: {
    name: 'Dark',
    primary: '#0084ff',
    background: '#18191a',
    surface: '#242526',
    text: '#e4e6eb',
    textSecondary: '#b0b3b8',
    border: '#3e4042',
    chatBg: '#0b141a',
    sentBubble: '#005c4b',
    receivedBubble: '#202c33',
  },
  midnight: {
    name: 'Midnight',
    primary: '#7c3aed',
    background: '#0f0f23',
    surface: '#1a1a2e',
    text: '#e0e0e0',
    textSecondary: '#a0a0a0',
    border: '#2a2a4a',
    chatBg: '#0a0a1a',
    sentBubble: '#7c3aed',
    receivedBubble: '#1a1a2e',
  },
  ocean: {
    name: 'Ocean',
    primary: '#0ea5e9',
    background: '#f0f9ff',
    surface: '#e0f2fe',
    text: '#0c4a6e',
    textSecondary: '#0369a1',
    border: '#bae6fd',
    chatBg: '#e0f2fe',
    sentBubble: '#0284c7',
    receivedBubble: '#ffffff',
  },
};

export const WS_RECONNECT_INTERVALS = [1000, 2000, 5000, 10000, 30000];
export const WS_HEARTBEAT_INTERVAL = 30000;
export const WS_PING_TIMEOUT = 5000;

export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || '';
export const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || '';
export const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || '';
