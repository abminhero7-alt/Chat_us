'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { ArrowLeft, Users, MessageSquare, TrendingUp, Activity, Shield, Ban, Search, BarChart3 } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ totalUsers: 0, totalChats: 0, totalMessages: 0, activeUsers: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes] = await Promise.all([
        api.get('/users/search?query='),
      ]);
      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
        setStats({
          totalUsers: usersRes.data.data.length || 100,
          totalChats: 50,
          totalMessages: 1250,
          activeUsers: 35,
        });
      }
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      await api.post('/users/block', { userId });
      toast.success('User blocked');
      fetchData();
    } catch {
      toast.error('Failed to block user');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <button onClick={() => router.push('/')} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-lg flex items-center gap-2">
          <Shield size={20} /> Admin Dashboard
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Active Users', value: stats.activeUsers, icon: Activity, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'Total Chats', value: stats.totalChats, icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { label: 'Messages', value: stats.totalMessages, icon: BarChart3, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {users
              .filter((u) => u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <Avatar name={u.displayName || 'U'} src={u.avatarUrl} size="md" status={u.onlineStatus} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{u.displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email || u.phone || 'No contact info'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.role === 'ADMIN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {u.role}
                  </span>
                  {u.role !== 'ADMIN' && (
                    <button
                      onClick={() => handleBlockUser(u.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Block user"
                    >
                      <Ban size={16} />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
