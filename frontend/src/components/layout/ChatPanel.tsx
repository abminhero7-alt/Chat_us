'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useChatStore } from '@/store/chat';
import { useMessageStore } from '@/store/message';
import { useAuthStore } from '@/store/auth';
import { useSocketStore } from '@/store/socket';
import api from '@/lib/api';
import { Send, Smile, Paperclip, Mic, Image, FileText, X, Phone, Video, PhoneOff, SendHorizonal, Trash2, Maximize2 } from 'lucide-react';
import MessageBubble from '@/components/chat/MessageBubble';
import EmojiPicker from '@/components/chat/EmojiPicker';
import { cn, formatTime, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const BASE_URL = API_URL.replace('/api', '');

interface PendingFile {
  file: File;
  preview: string;
  category: string;
  msgType: string;
}

export default function ChatPanel() {
  const { activeChat, setActiveChat } = useChatStore();
  const { messages, isLoading, hasMore, cursor, typingUsers, setMessages, addMessage, setHasMore, setCursor } = useMessageStore();
  const { user } = useAuthStore();
  const { emit, socket } = useSocketStore();
  const [messageText, setMessageText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [viewerFile, setViewerFile] = useState<{ url: string; type: string; name: string } | null>(null);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const callTimerRef = useRef<NodeJS.Timeout>();
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pendingCandidatesRef = useRef<any[]>([]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
      emit('message:read', { chatId: activeChat.id });
      setReplyTo(null);
      setPendingFile(null);
      // Fetch full chat data including participants for calls
      fetchChatDetails(activeChat.id);
    }
  }, [activeChat?.id]);

  const fetchChatDetails = async (chatId: string) => {
    try {
      const { data } = await api.get(`/chats/${chatId}`);
      if (data.success) {
        useChatStore.getState().setActiveChat(data.data);
        // Extract receiver ID for calls
        const other = data.data.participants?.find((p: any) => p.userId !== user?.id);
        if (other) {
          setReceiverId(other.userId);
          console.log('[Call] Receiver ID set:', other.userId);
        }
      }
    } catch {
      console.error('Failed to fetch chat details');
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages[activeChat?.id || '']?.length]);

  // ==================== CALL HANDLING ====================
  const createPeerConnection = useCallback((callId: string, targetUserId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] Sending ICE candidate', event.candidate);
        emit('call:signal', {
          callId,
          targetUserId,
          type: 'ice-candidate',
          data: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track');
      const stream = event.streams[0];
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
      if (pc.connectionState === 'connected') {
        setActiveCall((prev: any) => prev ? { ...prev, status: 'connected' } : null);
        if (!callTimerRef.current) {
          callTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
        }
      }
    };

    pc.onnegotiationneeded = async () => {
      console.log('[WebRTC] Negotiation needed');
    };

    pcRef.current = pc;
    return pc;
  }, [emit]);

  const cleanupCall = useCallback(() => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setActiveCall(null);
    setCallDuration(0);
    pendingCandidatesRef.current = [];
  }, [localStream]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: any) => {
      setActiveCall({
        callId: data.callId,
        callerId: data.callerId,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        type: data.type,
        isIncoming: true,
        status: 'ringing',
        sdpOffer: data.sdpOffer,
        chatId: data.chatId,
      });
      toast(`Incoming ${data.type?.toLowerCase()} call from ${data.callerName}`, {
        icon: data.type === 'VIDEO' ? '📹' : '📞',
        duration: 30000,
      });
    };

    const handleCallAccepted = (data: any) => {
      if (pcRef.current && data.sdpAnswer) {
        pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdpAnswer))
          .then(() => {
            for (const c of pendingCandidatesRef.current) {
              pcRef.current?.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
            }
            pendingCandidatesRef.current = [];
          })
          .catch(console.error);
      }
    };

    const handleCallRejected = () => {
      cleanupCall();
      toast.error('Call was rejected');
    };

    const handleCallEnded = (data: any) => {
      cleanupCall();
      toast.success(`Call ended${data.duration ? ` (${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, '0')})` : ''}`);
    };

    const handleCallSignal = async (data: any) => {
      console.log('[WebRTC] Received signal:', data.type, 'callId:', data.callId);
      try {
        if (data.type === 'answer' && pcRef.current) {
          console.log('[WebRTC] Setting remote description (answer)');
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.data));
          for (const c of pendingCandidatesRef.current) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidatesRef.current = [];
          console.log('[WebRTC] Answer processed, candidates added');
        } else if (data.type === 'offer' && pcRef.current) {
          console.log('[WebRTC] Setting remote description (offer)');
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.data));
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          console.log('[WebRTC] Created answer, sending back');
          emit('call:signal', {
            callId: data.callId,
            targetUserId: data.fromUserId,
            type: 'answer',
            data: answer,
          });
        } else if (data.type === 'ice-candidate') {
          if (pcRef.current) {
            if (pcRef.current.remoteDescription) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(data.data));
            } else {
              pendingCandidatesRef.current.push(data.data);
            }
          }
        }
      } catch (e) {
        console.error('[WebRTC] Signal error:', e);
      }
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:signal', handleCallSignal);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:signal', handleCallSignal);
    };
  }, [socket, emit, cleanupCall]);

  const startCall = async (type: 'audio' | 'video') => {
    if (!activeChat || !receiverId) {
      toast.error('Cannot start call: no participant found');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });

      const callId = `call-${Date.now()}`;
      const pc = createPeerConnection(callId, receiverId);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('[Call] Initiating call to:', receiverId, 'callId:', callId);

      emit('call:initiate', {
        receiverId,
        type: type.toUpperCase(),
        chatId: activeChat.id,
        sdpOffer: offer,
        callId,
      });

      setActiveCall({
        callId,
        callerId: user!.id,
        receiverId,
        type: type.toUpperCase(),
        isIncoming: false,
        status: 'ringing',
        callerName: user!.displayName,
      });
    } catch (err: any) {
      toast.error(`Cannot access ${type === 'video' ? 'camera' : 'microphone'}`);
      console.error('[Call] Error:', err);
    }
  };

  const acceptCall = async () => {
    if (!activeCall) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: activeCall.type === 'VIDEO',
      });

      const pc = createPeerConnection(activeCall.callId, activeCall.callerId);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      if (activeCall.sdpOffer) {
        await pc.setRemoteDescription(new RTCSessionDescription(activeCall.sdpOffer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        emit('call:accept', { callId: activeCall.callId, sdpAnswer: answer });
      }
    } catch (err: any) {
      toast.error('Cannot accept call');
      console.error(err);
    }
  };

  const rejectCall = () => {
    if (activeCall) {
      emit('call:reject', { callId: activeCall.callId });
      cleanupCall();
    }
  };

  const endCall = () => {
    if (activeCall) emit('call:end', { callId: activeCall.callId });
    cleanupCall();
  };

  // ==================== MESSAGES ====================
  const fetchMessages = async (chatId: string, loadMore = false) => {
    try {
      const cursorParam = loadMore ? `&cursor=${cursor[chatId]}` : '';
      const { data } = await api.get(`/chats/${chatId}/messages?limit=50${cursorParam}`);
      if (data.success) {
        const reversed = data.data.messages.reverse();
        if (loadMore) {
          const existing = messages[chatId] || [];
          setMessages(chatId, [...reversed, ...existing], data.data.hasMore, data.data.cursor);
        } else {
          setMessages(chatId, reversed, data.data.hasMore, data.data.cursor);
        }
      }
    } catch {
      toast.error('Failed to load messages');
    }
  };

  const handleSendText = async () => {
    if (!messageText.trim() || !activeChat || isSending) return;
    setIsSending(true);
    const content = messageText.trim();
    addMessage(activeChat.id, {
      id: `temp-${Date.now()}`,
      chatId: activeChat.id,
      senderId: user!.id,
      sender: { id: user!.id, displayName: user!.displayName, avatarUrl: user!.avatarUrl },
      content,
      type: 'TEXT',
      status: 'SENT',
      isEdited: false,
      isDeleted: false,
      reactions: [],
      createdAt: new Date(),
      readBy: [],
      deliveredTo: [],
    });
    emit('message:send', { chatId: activeChat.id, content, type: 'TEXT', replyToId: replyTo?.id });
    emit('typing:stop', { chatId: activeChat.id });
    setMessageText('');
    setReplyTo(null);
    setIsSending(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) return toast.error('File too large. Max 100MB');
    let category = 'document', msgType = 'DOCUMENT';
    if (file.type.startsWith('image/')) { category = 'image'; msgType = 'IMAGE'; }
    else if (file.type.startsWith('video/')) { category = 'video'; msgType = 'VIDEO'; }
    else if (file.type.startsWith('audio/')) { category = 'audio'; msgType = 'AUDIO'; }
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
    setPendingFile({ file, preview, category, msgType });
    setShowAttach(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendPendingFile = async () => {
    if (!pendingFile || !activeChat || uploadingFile) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', pendingFile.file);
      formData.append('category', pendingFile.category);
      const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.success) {
        const mediaUrl = data.data.url.startsWith('http') ? data.data.url : `${BASE_URL}${data.data.url}`;
        const thumbnailUrl = data.data.thumbnailUrl ? (data.data.thumbnailUrl.startsWith('http') ? data.data.thumbnailUrl : `${BASE_URL}${data.data.thumbnailUrl}`) : undefined;
        addMessage(activeChat.id, {
          id: `temp-${Date.now()}`,
          chatId: activeChat.id,
          senderId: user!.id,
          sender: { id: user!.id, displayName: user!.displayName, avatarUrl: user!.avatarUrl },
          content: pendingFile.file.name,
          type: pendingFile.msgType,
          mediaUrl,
          thumbnailUrl,
          status: 'SENT',
          isEdited: false,
          isDeleted: false,
          reactions: [],
          createdAt: new Date(),
          readBy: [],
          deliveredTo: [],
        });
        emit('message:send', { chatId: activeChat.id, content: pendingFile.file.name, type: pendingFile.msgType, mediaUrl: data.data.url, thumbnailUrl: data.data.thumbnailUrl });
        toast.success('File sent!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload');
    } finally {
      setUploadingFile(false);
      setPendingFile(null);
    }
  };

  const cancelPendingFile = () => {
    if (pendingFile?.preview) URL.revokeObjectURL(pendingFile.preview);
    setPendingFile(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        setPendingFile({ file, preview: '', category: 'audio', msgType: 'VOICE' });
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    setIsRecording(false);
    setMediaRecorder(null);
  };

  const handleTyping = useCallback(() => {
    if (!activeChat) return;
    emit('typing:start', { chatId: activeChat.id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emit('typing:stop', { chatId: activeChat.id }), 2000);
  }, [activeChat, emit]);

  const handleScroll = () => {
    if (!messagesContainerRef.current || !activeChat) return;
    if (messagesContainerRef.current.scrollTop < 100 && hasMore[activeChat.id]) {
      fetchMessages(activeChat.id, true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); }
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-6 shadow-lg">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Chat US</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">Select a chat or click <strong>+ New Chat</strong> to start.</p>
      </div>
    );
  }

  const chatMessages = messages[activeChat.id] || [];
  const chatTypingUsers = typingUsers[activeChat.id] || new Set<string>();

  return (
    <div className="flex-1 flex flex-col h-full bg-chat-bg dark:bg-chat-darkBg relative">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <button onClick={() => setActiveChat(null)} className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"><X size={20} /></button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <img src={activeChat.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChat.name || 'G')}&background=2563eb&color=fff`} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" />
            {activeChat.onlineStatus === 'ONLINE' && <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">{activeChat.name || 'Unknown'}</h2>
            <p className="text-xs text-gray-500 truncate">{activeChat.onlineStatus === 'ONLINE' ? 'online' : 'offline'}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button onClick={() => startCall('audio')} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400" title="Audio call"><Phone size={18} /></button>
          <button onClick={() => startCall('video')} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400" title="Video call"><Video size={18} /></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {chatMessages.map((msg, i) => {
          const showDate = i === 0 || formatDate(msg.createdAt) !== formatDate(chatMessages[i - 1]?.createdAt);
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="px-4 py-1.5 bg-white/90 dark:bg-gray-800/90 rounded-full text-xs text-gray-500 dark:text-gray-400 shadow-sm">{formatDate(msg.createdAt)}</span>
                </div>
              )}
              <MessageBubble message={msg} isOwn={msg.senderId === user?.id} onReply={() => setReplyTo(msg)} onViewFile={() => setViewerFile({ url: msg.mediaUrl || '', type: msg.type, name: msg.content || 'File' })} />
            </div>
          );
        })}
        {chatTypingUsers.size > 0 && (
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="typing-dot" style={{ animationDelay: '0ms' }} />
                <span className="typing-dot" style={{ animationDelay: '150ms' }} />
                <span className="typing-dot" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
            <span className="text-xs text-gray-500">typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 mx-3 mb-1 rounded-r-lg">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary-600 dark:text-primary-400">{replyTo.sender?.displayName}</p>
            <p className="text-xs text-gray-500 truncate">{replyTo.content || 'Media'}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-full"><X size={14} /></button>
        </div>
      )}

      {/* File preview before sending */}
      {pendingFile && (
        <div className="mx-3 mb-2 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-slide-up">
          <div className="flex items-center gap-3">
            {pendingFile.preview ? (
              <img src={pendingFile.preview} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><FileText size={24} className="text-gray-400" /></div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{pendingFile.file.name}</p>
              <p className="text-xs text-gray-500">{(pendingFile.file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={cancelPendingFile} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><Trash2 size={18} className="text-red-500" /></button>
            <button onClick={sendPendingFile} disabled={uploadingFile} className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full disabled:opacity-50">
              {uploadingFile ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <SendHorizonal size={18} />}
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="relative p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        {showEmoji && (
          <div className="absolute bottom-full left-3 mb-2 z-20 animate-slide-up">
            <EmojiPicker onSelect={(emoji) => { setMessageText((prev) => prev + emoji); setShowEmoji(false); }} onClose={() => setShowEmoji(false)} />
          </div>
        )}
        {showAttach && (
          <div className="absolute bottom-full left-16 mb-2 z-20 animate-slide-up">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 grid grid-cols-3 gap-2 w-64">
              {[
                { icon: Image, label: 'Photo', accept: 'image/*' },
                { icon: FileText, label: 'Document', accept: '*/*' },
                { icon: Mic, label: 'Voice', accept: 'audio/*' },
              ].map((item) => (
                <button key={item.label} onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = item.accept; fileInputRef.current.click(); } }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white"><item.icon size={22} /></div>
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" />
        <div className="flex items-end gap-2">
          <button onClick={() => { setShowEmoji(!showEmoji); setShowAttach(false); }} className={cn('p-2.5 rounded-full transition-colors flex-shrink-0', showEmoji ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500')}><Smile size={22} /></button>
          <button onClick={() => { setShowAttach(!showAttach); setShowEmoji(false); }} className={cn('p-2.5 rounded-full transition-colors flex-shrink-0', showAttach ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500')}><Paperclip size={22} /></button>
          <div className="flex-1 relative">
            <textarea value={messageText} onChange={(e) => { setMessageText(e.target.value); handleTyping(); }} onKeyDown={handleKeyDown} placeholder="Type a message..." rows={1} className="w-full resize-none rounded-2xl bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 placeholder:text-gray-400 max-h-32" style={{ minHeight: '42px' }} />
          </div>
          {messageText.trim() ? (
            <button onClick={handleSendText} disabled={isSending} className="p-2.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex-shrink-0"><Send size={20} /></button>
          ) : (
            <button onClick={() => { if (isRecording) stopRecording(); else startRecording(); }} className={cn('p-2.5 rounded-full transition-all flex-shrink-0', isRecording ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500')}><Mic size={22} /></button>
          )}
        </div>
      </div>

      {/* File Viewer */}
      {viewerFile && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setViewerFile(null)}>
          <button onClick={() => setViewerFile(null)} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10"><X size={24} /></button>
          <div className="max-w-4xl max-h-[90vh] w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-white text-sm mb-3 truncate max-w-full px-4">{viewerFile.name}</p>
            {viewerFile.type === 'IMAGE' ? (
              <img src={viewerFile.url} alt={viewerFile.name} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
            ) : viewerFile.type === 'VIDEO' ? (
              <video src={viewerFile.url} controls className="max-w-full max-h-[80vh] rounded-lg" />
            ) : viewerFile.type === 'AUDIO' || viewerFile.type === 'VOICE' ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 flex flex-col items-center gap-4">
                <span className="text-4xl">🎵</span>
                <audio src={viewerFile.url} controls autoPlay className="w-80" />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 flex flex-col items-center gap-4">
                <FileText size={48} className="text-gray-400" />
                <p className="text-gray-600 dark:text-gray-300 font-medium">{viewerFile.name}</p>
                <a href={viewerFile.url} download={viewerFile.name} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Download</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Call Overlay */}
      {activeCall && (
        <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center">
          {/* Video elements for video calls */}
          {activeCall.type === 'VIDEO' && (
            <div className="absolute inset-0">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-black" />
              <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-28 right-4 w-32 h-44 rounded-xl object-cover border-2 border-white shadow-lg bg-black" />
            </div>
          )}

          {/* Hidden audio element for audio calls */}
          {activeCall.type === 'AUDIO' && remoteStream && (
            <audio ref={(el) => { if (el && remoteStream) el.srcObject = remoteStream; }} autoPlay playsInline />
          )}

          <div className="relative z-10 flex flex-col items-center">
            <img src={activeCall.callerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeCall.callerName || 'User')}&background=2563eb&color=fff&size=128`} alt="" className="w-24 h-24 rounded-full mb-4 border-4 border-white/20" />
            <h2 className="text-2xl font-bold text-white mb-1">{activeCall.callerName || 'Unknown'}</h2>
            <p className="text-white/60 mb-2">
              {activeCall.status === 'ringing' ? (activeCall.isIncoming ? 'Incoming call...' : 'Ringing...') : 'Connected'}
            </p>
            {activeCall.status === 'connected' && (
              <p className="text-white/80 text-lg font-mono">{Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}</p>
            )}
          </div>
          <div className="relative z-10 flex items-center gap-6 mt-8">
            {activeCall.isIncoming && activeCall.status === 'ringing' && (
              <button onClick={acceptCall} className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all hover:scale-105" title="Accept"><Phone size={24} className="text-white" /></button>
            )}
            <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all hover:scale-105 shadow-lg" title="End call"><PhoneOff size={28} className="text-white" /></button>
            {activeCall.isIncoming && activeCall.status === 'ringing' && (
              <button onClick={rejectCall} className="w-14 h-14 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center transition-all hover:scale-105" title="Reject"><X size={24} className="text-white" /></button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
