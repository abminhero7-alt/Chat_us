'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, Video, Search, MoreVertical, Star, Info, X } from 'lucide-react';
import { useChatStore } from '@/store/chat';
import Avatar from '@/components/common/Avatar';
import { cn } from '@/utils/helpers';

interface ChatHeaderProps {
  chat: any;
}

export default function ChatHeader({ chat }: ChatHeaderProps) {
  const { setActiveChat } = useChatStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const otherUser = chat.type === 'PRIVATE' ? {
    name: chat.name,
    avatar: chat.avatarUrl,
    status: chat.onlineStatus,
  } : null;

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <button
          onClick={() => setActiveChat(null)}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <button
          onClick={() => setShowInfo(true)}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <Avatar
            name={chat.name || 'G'}
            src={chat.avatarUrl}
            size="md"
            status={otherUser?.status}
          />
          <div>
            <h2 className="font-semibold text-sm text-gray-900 dark:text-white">
              {chat.name || 'Unknown'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {otherUser?.status === 'ONLINE'
                ? 'online'
                : otherUser?.status === 'AWAY'
                ? 'away'
                : otherUser?.status === 'BUSY'
                ? 'busy'
                : 'offline'}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">
            <Phone size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">
            <Video size={20} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-scale-in">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Search size={16} /> Search
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Star size={16} /> Starred Messages
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Info size={16} /> Chat Info
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  Block User
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Info Panel */}
      {showInfo && (
        <div className="absolute inset-0 z-50 bg-white dark:bg-gray-900 animate-slide-in">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setShowInfo(false)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="font-semibold">Chat Info</h2>
          </div>
          <div className="p-6 flex flex-col items-center">
            <Avatar name={chat.name || 'G'} src={chat.avatarUrl} size="xxl" status={otherUser?.status} />
            <h3 className="mt-4 text-xl font-bold">{chat.name || 'Unknown'}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {chat.type === 'GROUP' ? chat.description || 'No description' : otherUser?.status === 'ONLINE' ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
