'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chat';
import { useAuthStore } from '@/store/auth';
import { useSocketStore } from '@/store/socket';
import api from '@/lib/api';
import { Search, Plus, Archive, Settings, LogOut, Menu, X, Moon, Sun, MoreVertical, Users, MessageSquare, Check, UserPlus } from 'lucide-react';
import ChatListItem from '@/components/chat/ChatListItem';
import Avatar from '@/components/common/Avatar';
import { cn } from '@/utils/helpers';
import { useThemeStore } from '@/store/theme';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const { chats, activeChat, setActiveChat, searchQuery, setSearchQuery, showArchived, toggleArchived, setChats, addChat } = useChatStore();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { emit } = useSocketStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatType, setNewChatType] = useState<'private' | 'group'>('private');
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchChats();
    fetchAllUsers();
  }, [showArchived]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(() => searchUsers(), 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get(`/chats?archived=${showArchived}`);
      if (data.success) {
        setChats(data.data.chats);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data } = await api.get('/users/search?query=');
      if (data.success) {
        setAllUsers(data.data);
      }
    } catch {
      console.error('Failed to fetch users');
    }
  };

  const searchUsers = async () => {
    try {
      const { data } = await api.get(`/users/search?query=${searchQuery}`);
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleStartChat = async () => {
    if (newChatType === 'private' && selectedUsers.length !== 1) {
      return toast.error('Select exactly one person');
    }
    if (newChatType === 'group' && selectedUsers.length < 2) {
      return toast.error('Select at least 2 people for a group');
    }
    if (newChatType === 'group' && !groupName.trim()) {
      return toast.error('Enter a group name');
    }

    setIsLoading(true);
    try {
      const payload: any = {
        type: newChatType === 'private' ? 'PRIVATE' : 'GROUP',
        participantIds: selectedUsers,
      };
      if (newChatType === 'group') {
        payload.name = groupName.trim();
        payload.description = groupDesc.trim();
      }

      const { data } = await api.post('/chats', payload);
      if (data.success) {
        addChat(data.data);
        setActiveChat(data.data);
        setShowNewChatModal(false);
        setSelectedUsers([]);
        setGroupName('');
        setGroupDesc('');
        setSearchQuery('');
        fetchChats();
        toast.success(newChatType === 'group' ? 'Group created!' : 'Chat started!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create chat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;
    return chat.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedChats = [...filteredChats].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const filteredAllUsers = allUsers.filter(
    (u) => !selectedUsers.includes(u.id) && u.id !== user?.id
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={cn(
          'w-full sm:w-80 lg:w-96 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'absolute lg:relative z-40'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar name={user?.displayName || 'U'} src={user?.avatarUrl} size="md" />
              <div>
                <h1 className="font-semibold text-gray-900 dark:text-white">Chats</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.onlineStatus === 'ONLINE' ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <MoreVertical size={18} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-scale-in">
                    <button
                      onClick={() => { setShowNewChatModal(true); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Plus size={16} /> New Chat
                    </button>
                    <button
                      onClick={() => { router.push('/status'); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <MessageSquare size={16} /> Status
                    </button>
                    <button
                      onClick={() => { router.push('/calls'); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Archive size={16} /> Calls
                    </button>
                    <button
                      onClick={() => { toggleArchived(); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Archive size={16} /> {showArchived ? 'Active Chats' : 'Archived'}
                    </button>
                    <button
                      onClick={() => { router.push('/settings'); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Settings size={16} /> Settings
                    </button>
                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={() => { handleLogout(); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search chats or people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Search Results */}
        {searchQuery.length >= 2 && searchResults.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-800 max-h-60 overflow-y-auto">
            <p className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">People</p>
            {searchResults.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  startPrivateChat(u.id);
                  setSearchQuery('');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Avatar name={u.displayName} src={u.avatarUrl} size="md" status={u.onlineStatus} />
                <div className="text-left flex-1 min-w-0">
                  <p className="font-medium text-sm">{u.displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{u.statusMessage || 'Tap to chat'}</p>
                </div>
                <MessageSquare size={16} className="text-primary-500 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {sortedChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <MessageSquare size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {showArchived ? 'No archived chats' : 'No chats yet'}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Click <strong>+ New Chat</strong> to start
              </p>
            </div>
          ) : (
            sortedChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={activeChat?.id === chat.id}
                onClick={() => {
                  setActiveChat(chat);
                  setSidebarOpen(false);
                }}
              />
            ))
          )}
        </div>

        {/* FAB */}
        <button
          onClick={() => setShowNewChatModal(true)}
          className="absolute bottom-6 right-6 lg:hidden w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={24} />
        </button>
      </aside>

      {/* New Chat / Group Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold">New Chat</h2>
              <button onClick={() => { setShowNewChatModal(false); setSelectedUsers([]); setGroupName(''); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <X size={20} />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setNewChatType('private')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                  newChatType === 'private'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageSquare size={16} /> Private Chat
              </button>
              <button
                onClick={() => setNewChatType('group')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                  newChatType === 'group'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users size={16} /> Group Chat
              </button>
            </div>

            {/* Group Name Input */}
            {newChatType === 'group' && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name *"
                  maxLength={50}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
                <input
                  type="text"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Description (optional)"
                  maxLength={200}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
            )}

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Selected ({selectedUsers.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((uid) => {
                    const u = allUsers.find((u) => u.id === uid);
                    return (
                      <span
                        key={uid}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-xs font-medium"
                      >
                        <Avatar name={u?.displayName || '?'} src={u?.avatarUrl} size="sm" />
                        {u?.displayName || 'Unknown'}
                        <button onClick={() => toggleUserSelection(uid)} className="ml-1 hover:text-red-500">
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* User List */}
            <div className="flex-1 overflow-y-auto">
              <p className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {newChatType === 'private' ? 'Select a person' : 'Select members'}
              </p>
              {filteredAllUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    if (newChatType === 'private') {
                      setSelectedUsers([u.id]);
                    } else {
                      toggleUserSelection(u.id);
                    }
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                    selectedUsers.includes(u.id) && 'bg-primary-50 dark:bg-primary-900/20'
                  )}
                >
                  <div className="relative">
                    <Avatar name={u.displayName} src={u.avatarUrl} size="md" status={u.onlineStatus} />
                    {selectedUsers.includes(u.id) && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-sm">{u.displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{u.statusMessage || u.email || 'Tap to select'}</p>
                  </div>
                  {newChatType === 'private' && (
                    <MessageSquare size={16} className="text-gray-400" />
                  )}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={handleStartChat}
                disabled={
                  isLoading ||
                  (newChatType === 'private' && selectedUsers.length !== 1) ||
                  (newChatType === 'group' && (selectedUsers.length < 2 || !groupName.trim()))
                }
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {newChatType === 'private' ? <MessageSquare size={18} /> : <Users size={18} />}
                    {newChatType === 'private' ? 'Start Chat' : 'Create Group'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

async function startPrivateChat(userId: string) {
  try {
    const { data } = await api.post('/chats', { type: 'PRIVATE', participantIds: [userId] });
    if (data.success) {
      useChatStore.getState().setActiveChat(data.data);
    }
  } catch {
    toast.error('Failed to start chat');
  }
}
