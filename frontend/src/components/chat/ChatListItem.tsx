'use client';

import { cn, formatTime, formatMessageDate, getInitials, truncate } from '@/utils/helpers';
import Avatar from '@/components/common/Avatar';
import { Check, CheckCheck, Pin, VolumeX, Volume2 } from 'lucide-react';

interface ChatListItemProps {
  chat: any;
  isActive: boolean;
  onClick: () => void;
}

export default function ChatListItem({ chat, isActive, onClick }: ChatListItemProps) {
  if (!chat) return null;
  
  const lastMsg = chat.lastMessage;
  const isOwn = lastMsg?.senderId === (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 border-l-4',
        isActive
          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500'
          : 'border-transparent'
      )}
    >
      <div className="relative flex-shrink-0">
        <Avatar
          name={chat.name || 'U'}
          src={chat.avatarUrl}
          size="lg"
          status={chat.onlineStatus}
        />
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {chat.name || 'Unknown'}
            </h3>
            {chat.isPinned && <Pin size={12} className="text-gray-400 flex-shrink-0" />}
          </div>
          {lastMsg && (
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
              {formatMessageDate(lastMsg.createdAt)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
            {lastMsg ? (
              <>
                {lastMsg.type === 'TEXT' && !lastMsg.isDeleted && (
                  <>
                    {isOwn && (
                      <CheckCheck
                        size={14}
                        className={cn(
                          'flex-shrink-0',
                          lastMsg.status === 'READ'
                            ? 'text-primary-500'
                            : 'text-gray-400'
                        )}
                      />
                    )}
                    {truncate(lastMsg.content || '', 40)}
                  </>
                )}
                {lastMsg.type === 'IMAGE' && '📷 Photo'}
                {lastMsg.type === 'VIDEO' && '🎬 Video'}
                {lastMsg.type === 'VOICE' && '🎤 Voice message'}
                {lastMsg.type === 'AUDIO' && '🎵 Audio'}
                {lastMsg.type === 'DOCUMENT' && '📎 Document'}
                {lastMsg.type === 'GIF' && 'GIF'}
                {lastMsg.type === 'STICKER' && '🎭 Sticker'}
                {lastMsg.isDeleted && '🚫 Deleted message'}
              </>
            ) : (
              <span className="italic">Start a conversation</span>
            )}
          </p>

          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {chat.isMuted && <VolumeX size={12} className="text-gray-400" />}
            {chat.unreadCount > 0 && (
              <span className="bg-primary-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                {chat.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
