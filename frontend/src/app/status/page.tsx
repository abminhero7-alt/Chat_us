'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { ArrowLeft, Plus, X, Eye, Clock, Camera, Image, Type, Trash2 } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import toast from 'react-hot-toast';

export default function StatusPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [myStatuses, setMyStatuses] = useState<any[]>([]);
  const [contactsStatuses, setContactsStatuses] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newStatus, setNewStatus] = useState({ type: 'TEXT', content: '' });
  const [viewingStatus, setViewingStatus] = useState<any>(null);
  const [viewIndex, setViewIndex] = useState(0);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      const [myRes, contactsRes] = await Promise.all([
        api.get('/statuses/me'),
        api.get('/statuses'),
      ]);
      if (myRes.data.success) setMyStatuses(myRes.data.data);
      if (contactsRes.data.success) setContactsStatuses(contactsRes.data.data);
    } catch {
      toast.error('Failed to load statuses');
    }
  };

  const createStatus = async () => {
    if (!newStatus.content.trim()) return toast.error('Status content required');

    try {
      const { data } = await api.post('/statuses', newStatus);
      if (data.success) {
        toast.success('Status posted!');
        setShowCreate(false);
        setNewStatus({ type: 'TEXT', content: '' });
        fetchStatuses();
      }
    } catch {
      toast.error('Failed to create status');
    }
  };

  const viewStatus = async (statusGroup: any) => {
    setViewingStatus(statusGroup);
    setViewIndex(0);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <button onClick={() => router.push('/')} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-lg">Status</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* My Status */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">My Status</h2>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <Plus size={16} /> Add
            </button>
          </div>

          <button
            onClick={() => myStatuses.length > 0 ? viewStatus({ user, statuses: myStatuses }) : setShowCreate(true)}
            className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all"
          >
            <div className="relative">
              <Avatar name={user?.displayName || 'U'} src={user?.avatarUrl} size="lg" />
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                <Plus size={14} className="text-white" />
              </div>
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">My Status</p>
              <p className="text-xs text-gray-500">
                {myStatuses.length > 0 ? `${myStatuses.length} update${myStatuses.length > 1 ? 's' : ''}` : 'Tap to add status'}
              </p>
            </div>
          </button>
        </div>

        {/* Contact Statuses */}
        {contactsStatuses.length > 0 && (
          <div className="px-4 pb-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Recent Updates
            </h2>
            <div className="space-y-2">
              {contactsStatuses.map((group: any) => (
                <button
                  key={group.user.id}
                  onClick={() => viewStatus(group)}
                  className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all"
                >
                  <div className={`p-0.5 rounded-full ${group.hasViewed ? 'border-2 border-gray-300 dark:border-gray-600' : 'border-2 border-primary-500'}`}>
                    <Avatar name={group.user.displayName} src={group.user.avatarUrl} size="lg" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-sm">{group.user.displayName}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {group.statuses[0]?.content || '📷 Photo'}
                    </p>
                  </div>
                  <Clock size={14} className="text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Status Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold">New Status</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex gap-2">
                {[
                  { type: 'TEXT', icon: Type, label: 'Text' },
                  { type: 'IMAGE', icon: Image, label: 'Photo' },
                ].map((t) => (
                  <button
                    key={t.type}
                    onClick={() => setNewStatus({ ...newStatus, type: t.type })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      newStatus.type === t.type
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <t.icon size={16} /> {t.label}
                  </button>
                ))}
              </div>

              {newStatus.type === 'TEXT' && (
                <textarea
                  value={newStatus.content}
                  onChange={(e) => setNewStatus({ ...newStatus, content: e.target.value })}
                  placeholder="What's on your mind?"
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                />
              )}

              <button
                onClick={createStatus}
                disabled={!newStatus.content.trim()}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Post Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Status Modal */}
      {viewingStatus && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <button
            onClick={() => setViewingStatus(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10"
          >
            <X size={24} />
          </button>

          <div className="w-full max-w-md">
            {/* Progress bars */}
            <div className="flex gap-1 px-4 pt-4">
              {viewingStatus.statuses.map((_: any, i: number) => (
                <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-300"
                    style={{ width: i < viewIndex ? '100%' : i === viewIndex ? '50%' : '0%' }}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 px-4 py-3">
              <Avatar name={viewingStatus.user.displayName} src={viewingStatus.user.avatarUrl} size="sm" />
              <div>
                <p className="text-white font-medium text-sm">{viewingStatus.user.displayName}</p>
                <p className="text-white/60 text-xs">
                  {new Date(viewingStatus.statuses[viewIndex]?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center min-h-[400px] px-4">
              <p className="text-white text-xl text-center leading-relaxed">
                {viewingStatus.statuses[viewIndex]?.content}
              </p>
            </div>

            <div className="flex justify-between px-4 pb-8">
              {viewIndex > 0 && (
                <button
                  onClick={() => setViewIndex(viewIndex - 1)}
                  className="px-4 py-2 text-white/80 hover:text-white"
                >
                  Previous
                </button>
              )}
              {viewIndex < viewingStatus.statuses.length - 1 && (
                <button
                  onClick={() => setViewIndex(viewIndex + 1)}
                  className="px-4 py-2 text-white/80 hover:text-white ml-auto"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
