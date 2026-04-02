'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import api from '@/lib/api';
import { ArrowLeft, User, Bell, Lock, Palette, Moon, Sun, Eye, EyeOff, Shield, LogOut, Camera, Check, X, Image } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUser, logout, token } = useAuthStore();
  const { theme, setTheme, setChatBg } = useThemeStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [statusMessage, setStatusMessage] = useState(user?.statusMessage || '');
  const [lastSeenPrivacy, setLastSeenPrivacy] = useState(user?.lastSeenPrivacy || 'EVERYONE');
  const [profilePhotoPrivacy, setProfilePhotoPrivacy] = useState(user?.profilePhotoPrivacy || 'EVERYONE');
  const [statusPrivacy, setStatusPrivacy] = useState(user?.statusPrivacy || 'EVERYONE');
  const [selectedChatBg, setSelectedChatBg] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({
    messages: true,
    calls: true,
    sound: true,
    vibration: false,
    preview: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setStatusMessage(user.statusMessage || '');
      setLastSeenPrivacy(user.lastSeenPrivacy || 'EVERYONE');
      setProfilePhotoPrivacy(user.profilePhotoPrivacy || 'EVERYONE');
      setStatusPrivacy(user.statusPrivacy || 'EVERYONE');
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'privacy') {
      fetchBlockedUsers();
    }
  }, [activeTab]);

  const fetchBlockedUsers = async () => {
    try {
      const { data } = await api.get('/users/contacts');
      if (data.success) {
        setBlockedUsers(data.data.filter((c: any) => c.isBlocked));
      }
    } catch {
      console.error('Failed to fetch blocked users');
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      return toast.error('Display name is required');
    }
    setIsSaving(true);
    try {
      const { data } = await api.put('/users/me', {
        displayName: displayName.trim(),
        statusMessage: statusMessage.trim(),
        lastSeenPrivacy,
        profilePhotoPrivacy,
        statusPrivacy,
      });
      if (data.success) {
        updateUser(data.data);
        setIsEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrivacy = async (field: string, value: string) => {
    try {
      const { data } = await api.put('/users/me', {
        [field]: value,
      });
      if (data.success) {
        updateUser(data.data);
        toast.success(`${field.replace(/([A-Z])/g, ' $1').trim()} updated`);
      }
    } catch {
      toast.error('Failed to update privacy setting');
    }
  };

  const handleSaveNotification = async (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
    toast.success(`Notification ${key} ${value ? 'enabled' : 'disabled'}`);
  };

  const handleChatBgSelect = (color: string) => {
    setSelectedChatBg(color);
    setChatBg(color);
    toast.success('Chat background updated');
  };

  const handleUploadAvatar = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) {
        return toast.error('Image too large. Max 20MB');
      }
      try {
        const formData = new FormData();
        formData.append('avatar', file);
        const { data } = await api.post('/users/me/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (data.success) {
          updateUser(data.data);
          toast.success('Avatar updated');
        }
      } catch {
        toast.error('Failed to upload avatar');
      }
    };
    input.click();
  };

  const handleUnblockUser = async (contactUserId: string) => {
    try {
      await api.post('/users/unblock', { userId: contactUserId });
      toast.success('User unblocked');
      fetchBlockedUsers();
    } catch {
      toast.error('Failed to unblock user');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const wallpaperColors = [
    { color: '#efeae2', name: 'Default' },
    { color: '#e5ddd5', name: 'Warm' },
    { color: '#d4e8d0', name: 'Mint' },
    { color: '#c9d6df', name: 'Steel' },
    { color: '#f5e6cc', name: 'Sand' },
    { color: '#e8d5e0', name: 'Rose' },
    { color: '#d5e8d4', name: 'Sage' },
    { color: '#d4dfe8', name: 'Sky' },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => router.push('/')}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-lg">Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto w-full">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="relative group cursor-pointer" onClick={handleUploadAvatar}>
                <Avatar name={user?.displayName || 'U'} src={user?.avatarUrl} size="xxl" />
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <Camera size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Tap to change photo</p>
              <h2 className="mt-2 text-xl font-bold">{user?.displayName}</h2>
              <p className="text-sm text-gray-500">{user?.email || user?.phone}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={!isEditing}
                  maxLength={50}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-60 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status Message</label>
                <input
                  type="text"
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  disabled={!isEditing}
                  maxLength={139}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-60 transition-all"
                  placeholder="What's on your mind?"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{statusMessage.length}/139</p>
              </div>

              {isEditing ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving || !displayName.trim()}
                    className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setDisplayName(user?.displayName || '');
                      setStatusMessage(user?.statusMessage || '');
                    }}
                    className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={16} /> Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield size={20} /> Privacy Settings
            </h2>

            {[
              { label: 'Last Seen', field: 'lastSeenPrivacy', value: lastSeenPrivacy, set: setLastSeenPrivacy, icon: Eye },
              { label: 'Profile Photo', field: 'profilePhotoPrivacy', value: profilePhotoPrivacy, set: setProfilePhotoPrivacy, icon: EyeOff },
              { label: 'Status', field: 'statusPrivacy', value: statusPrivacy, set: setStatusPrivacy, icon: Eye },
            ].map((item) => (
              <div key={item.field} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-3">
                  <item.icon size={18} className="text-gray-500" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex gap-2">
                  {['EVERYONE', 'CONTACTS', 'NOBODY'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        item.set(option);
                        handleSavePrivacy(item.field, option);
                      }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        item.value === option
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {option.charAt(0) + option.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              <h3 className="font-medium mb-3">Blocked Users ({blockedUsers.length})</h3>
              {blockedUsers.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No blocked users</p>
              ) : (
                <div className="space-y-2">
                  {blockedUsers.map((contact: any) => (
                    <div key={contact.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Avatar name={contact.contactUser.displayName} src={contact.contactUser.avatarUrl} size="sm" />
                        <span className="text-sm font-medium">{contact.contactUser.displayName}</span>
                      </div>
                      <button
                        onClick={() => handleUnblockUser(contact.contactUserId)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Palette size={20} /> Appearance
            </h2>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              <h3 className="font-medium mb-3">Theme</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      theme === t.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <t.icon size={20} />
                    <span className="font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              <h3 className="font-medium mb-3">Chat Wallpaper</h3>
              <div className="grid grid-cols-4 gap-2">
                {wallpaperColors.map((wp) => (
                  <button
                    key={wp.color}
                    onClick={() => handleChatBgSelect(wp.color)}
                    className={`w-full aspect-square rounded-lg transition-all hover:scale-105 ${
                      selectedChatBg === wp.color
                        ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900'
                        : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600'
                    }`}
                    style={{ backgroundColor: wp.color }}
                    title={wp.name}
                  />
                ))}
              </div>
              {selectedChatBg && (
                <button
                  onClick={() => {
                    setSelectedChatBg(null);
                    setChatBg(null);
                    toast.success('Chat background reset');
                  }}
                  className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Reset to default
                </button>
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
              <Bell size={20} /> Notifications
            </h2>

            {[
              { key: 'messages', label: 'Message Notifications', desc: 'Get notified for new messages' },
              { key: 'calls', label: 'Call Notifications', desc: 'Get notified for incoming calls' },
              { key: 'sound', label: 'Sound', desc: 'Play sound for notifications' },
              { key: 'vibration', label: 'Vibration', desc: 'Vibrate on notifications' },
              { key: 'preview', label: 'Show Preview', desc: 'Show message preview in notifications' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleSaveNotification(item.key, !notifications[item.key as keyof typeof notifications])}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    notifications[item.key as keyof typeof notifications] ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      notifications[item.key as keyof typeof notifications] ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Logout */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
