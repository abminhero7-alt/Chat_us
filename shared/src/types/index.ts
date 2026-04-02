export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  VOICE = 'VOICE',
  DOCUMENT = 'DOCUMENT',
  GIF = 'GIF',
  STICKER = 'STICKER',
  SYSTEM = 'SYSTEM',
}

export enum ChatType {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
}

export enum ChatStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  PINNED = 'PINNED',
  MUTED = 'MUTED',
}

export enum OnlineStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  AWAY = 'AWAY',
  BUSY = 'BUSY',
}

export enum LastSeenPrivacy {
  EVERYONE = 'EVERYONE',
  CONTACTS = 'CONTACTS',
  NOBODY = 'NOBODY',
}

export enum ProfilePhotoPrivacy {
  EVERYONE = 'EVERYONE',
  CONTACTS = 'CONTACTS',
  NOBODY = 'NOBODY',
}

export enum StatusPrivacy {
  EVERYONE = 'EVERYONE',
  CONTACTS = 'CONTACTS',
  CUSTOM = 'CUSTOM',
}

export enum ReactionType {
  HEART = '❤️',
  THUMBS_UP = '👍',
  THUMBS_DOWN = '👎',
  LAUGH = '😂',
  SAD = '😢',
  ANGRY = '😡',
  WOW = '😮',
  FIRE = '🔥',
}

export enum CallType {
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
}

export enum CallStatus {
  INITIATED = 'INITIATED',
  RINGING = 'RINGING',
  CONNECTED = 'CONNECTED',
  ENDED = 'ENDED',
  MISSED = 'MISSED',
  REJECTED = 'REJECTED',
  BUSY = 'BUSY',
}

export enum StatusType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum NotificationType {
  MESSAGE = 'MESSAGE',
  CALL = 'CALL',
  MENTION = 'MENTION',
  REACTION = 'REACTION',
  SYSTEM = 'SYSTEM',
}

export interface IUser {
  id: string;
  email?: string;
  phone?: string;
  displayName: string;
  avatarUrl?: string;
  statusMessage?: string;
  onlineStatus: OnlineStatus;
  lastSeen?: Date;
  role: UserRole;
  isVerified: boolean;
  isTwoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChat {
  id: string;
  type: ChatType;
  name?: string;
  description?: string;
  avatarUrl?: string;
  status: ChatStatus[];
  lastMessage?: IMessage;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  isMuted: boolean;
  mutedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  id: string;
  chatId: string;
  senderId: string;
  content?: string;
  type: MessageType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  status: MessageStatus;
  isEdited: boolean;
  isDeleted: boolean;
  isStarred: boolean;
  replyToId?: string;
  forwardedFromId?: string;
  reactions: IReaction[];
  createdAt: Date;
  updatedAt: Date;
  readBy: string[];
  deliveredTo: string[];
}

export interface IReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: ReactionType;
  createdAt: Date;
}

export interface IGroupMember {
  id: string;
  chatId: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: Date;
}

export interface ICall {
  id: string;
  callerId: string;
  receiverId?: string;
  chatId?: string;
  type: CallType;
  status: CallStatus;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
}

export interface IStatus {
  id: string;
  userId: string;
  type: StatusType;
  content?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  views: string[];
  expiresAt: Date;
  createdAt: Date;
}

export interface IContact {
  id: string;
  userId: string;
  contactUserId: string;
  isBlocked: boolean;
  addedAt: Date;
}

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export interface SocketEvents {
  client: {
    'auth:token': (token: string) => void;
    'message:send': (data: SendMessagePayload) => void;
    'message:edit': (data: EditMessagePayload) => void;
    'message:delete': (data: DeleteMessagePayload) => void;
    'message:react': (data: ReactMessagePayload) => void;
    'message:read': (data: ReadMessagePayload) => void;
    'typing:start': (data: TypingPayload) => void;
    'typing:stop': (data: TypingPayload) => void;
    'call:initiate': (data: InitiateCallPayload) => void;
    'call:signal': (data: SignalPayload) => void;
    'call:accept': (data: AcceptCallPayload) => void;
    'call:reject': (data: RejectCallPayload) => void;
    'call:end': (data: EndCallPayload) => void;
    'status:view': (statusId: string) => void;
    'presence:update': (status: OnlineStatus) => void;
    'chat:pin': (chatId: string) => void;
    'chat:archive': (chatId: string) => void;
    'chat:mute': (data: MuteChatPayload) => void;
  };
  server: {
    'auth:success': (user: IUser) => void;
    'auth:error': (error: string) => void;
    'message:new': (message: IMessage) => void;
    'message:edited': (message: IMessage) => void;
    'message:deleted': (messageId: string, chatId: string) => void;
    'message:reacted': (data: { messageId: string; reaction: IReaction }) => void;
    'message:read': (data: { messageId: string; chatId: string; userId: string }) => void;
    'message:delivered': (data: { messageId: string; chatId: string; userId: string }) => void;
    'typing:user': (data: { chatId: string; userId: string; userName: string }) => void;
    'call:incoming': (data: IncomingCallPayload) => void;
    'call:signal': (data: SignalPayload) => void;
    'call:accepted': (data: AcceptedCallPayload) => void;
    'call:rejected': (data: RejectedCallPayload) => void;
    'call:ended': (data: EndedCallPayload) => void;
    'status:new': (status: IStatus) => void;
    'status:viewed': (data: { statusId: string; viewerId: string }) => void;
    'presence:updated': (data: { userId: string; status: OnlineStatus; lastSeen?: Date }) => void;
    'chat:updated': (chat: IChat) => void;
    'chat:new': (chat: IChat) => void;
    'notification:new': (notification: INotification) => void;
    'error': (error: string) => void;
  };
}

export interface SendMessagePayload {
  chatId: string;
  content?: string;
  type: MessageType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  replyToId?: string;
  forwardedFromId?: string;
  mentions?: string[];
}

export interface EditMessagePayload {
  messageId: string;
  content: string;
}

export interface DeleteMessagePayload {
  messageId: string;
  deleteForEveryone?: boolean;
}

export interface ReactMessagePayload {
  messageId: string;
  emoji: ReactionType;
}

export interface ReadMessagePayload {
  chatId: string;
  messageIds?: string[];
}

export interface TypingPayload {
  chatId: string;
}

export interface InitiateCallPayload {
  chatId?: string;
  receiverId?: string;
  type: CallType;
  sdpOffer?: RTCSessionDescriptionInit;
}

export interface SignalPayload {
  callId: string;
  targetUserId: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
}

export interface AcceptCallPayload {
  callId: string;
  sdpAnswer?: RTCSessionDescriptionInit;
}

export interface RejectCallPayload {
  callId: string;
  reason?: string;
}

export interface EndCallPayload {
  callId: string;
}

export interface IncomingCallPayload {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  type: CallType;
  chatId?: string;
  sdpOffer?: RTCSessionDescriptionInit;
}

export interface AcceptedCallPayload {
  callId: string;
  sdpAnswer?: RTCSessionDescriptionInit;
}

export interface RejectedCallPayload {
  callId: string;
  reason?: string;
}

export interface EndedCallPayload {
  callId: string;
  duration?: number;
}

export interface MuteChatPayload {
  chatId: string;
  duration?: number;
}

export interface ChatListResponse {
  chats: IChat[];
  total: number;
  hasMore: boolean;
}

export interface MessageListResponse {
  messages: IMessage[];
  total: number;
  hasMore: boolean;
  cursor?: string;
}

export interface AuthResponse {
  user: IUser;
  token: string;
  refreshToken: string;
  requires2FA?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
