'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Image, Mic, Camera, FileText, X } from 'lucide-react';
import { cn } from '@/utils/helpers';
import EmojiPicker from '@/components/chat/EmojiPicker';
import toast from 'react-hot-toast';

interface MessageInputProps {
  onSend: (content: string, type?: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  replyTo?: any;
  onCancelReply?: () => void;
}

export default function MessageInput({ onSend, onTyping, disabled, replyTo, onCancelReply }: MessageInputProps) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
    setShowEmoji(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      setShowEmoji(false);
      setShowAttach(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error('File too large. Max 100MB');
        return;
      }
      toast.success(`File "${file.name}" selected`);
      setShowAttach(false);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast('Recording started...', { icon: '🎤' });
    } else {
      toast('Voice message sent', { icon: '🎤' });
      onSend('', 'VOICE');
    }
  };

  return (
    <div className="relative">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 mx-3 mb-2 rounded-r-lg">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary-600 dark:text-primary-400">{replyTo.sender?.displayName}</p>
            <p className="text-xs text-gray-500 truncate">{replyTo.content || '📷 Photo'}</p>
          </div>
          <button onClick={onCancelReply} className="p-1 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-full">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div className="absolute bottom-full left-3 mb-2 z-20 animate-slide-up">
          <EmojiPicker
            onSelect={(emoji) => {
              setText((prev) => prev + emoji);
              textareaRef.current?.focus();
            }}
            onClose={() => setShowEmoji(false)}
          />
        </div>
      )}

      {/* Attachment menu */}
      {showAttach && (
        <div className="absolute bottom-full left-16 mb-2 z-20 animate-slide-up">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 grid grid-cols-3 gap-2">
            {[
              { icon: Image, label: 'Photo', color: 'bg-purple-500' },
              { icon: Camera, label: 'Camera', color: 'bg-red-500' },
              { icon: FileText, label: 'Document', color: 'bg-blue-500' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  if (item.label === 'Document') fileInputRef.current?.click();
                  else toast.success(`${item.label} selected`);
                  setShowAttach(false);
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white', item.color)}>
                  <item.icon size={22} />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
      />

      <div className="flex items-end gap-2 px-3 py-2">
        <button
          onClick={() => { setShowAttach(!showAttach); setShowEmoji(false); }}
          className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 flex-shrink-0"
        >
          <Paperclip size={22} />
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onTyping?.();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={disabled}
            className="w-full resize-none rounded-2xl bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 placeholder:text-gray-400 max-h-32 disabled:opacity-50"
            style={{ minHeight: '42px' }}
          />
        </div>

        {text.trim() ? (
          <button
            onClick={handleSend}
            disabled={disabled}
            className="p-2.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex-shrink-0"
          >
            <Send size={20} />
          </button>
        ) : (
          <button
            onClick={toggleRecording}
            className={cn(
              'p-2.5 rounded-full transition-all hover:scale-105 active:scale-95 flex-shrink-0',
              isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
            )}
          >
            <Mic size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
