'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { ArrowLeft, Phone, Video, Clock, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import { formatMessageDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

export default function CallsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [calls, setCalls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      const { data } = await api.get('/calls/history');
      if (data.success) setCalls(data.data);
    } catch {
      toast.error('Failed to load calls');
    } finally {
      setIsLoading(false);
    }
  };

  const getCallIcon = (call: any) => {
    if (call.status === 'MISSED') return <PhoneMissed size={18} className="text-red-500" />;
    if (call.callerId === user?.id) return <PhoneOutgoing size={18} className="text-green-500" />;
    return <PhoneIncoming size={18} className="text-blue-500" />;
  };

  const getOtherUser = (call: any) => {
    if (call.callerId === user?.id) return call.receiver;
    return call.caller;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <button onClick={() => router.push('/')} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-lg">Calls</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Phone size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No calls yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your call history will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {calls.map((call) => {
              const otherUser = getOtherUser(call);
              return (
                <div key={call.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <Avatar name={otherUser?.displayName || 'U'} src={otherUser?.avatarUrl} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${call.status === 'MISSED' ? 'text-red-500' : ''}`}>
                      {otherUser?.displayName || 'Unknown'}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {getCallIcon(call)}
                      <span>{formatMessageDate(call.createdAt)}</span>
                      {call.duration && <span>• {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}</span>}
                    </div>
                  </div>
                  <button className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${call.type === 'VIDEO' ? 'text-green-500' : 'text-primary-500'}`}>
                    {call.type === 'VIDEO' ? <Video size={20} /> : <Phone size={20} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
