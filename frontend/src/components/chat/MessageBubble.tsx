'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useSocketStore } from '@/store/socket';
import { cn, formatTime, getInitials } from '@/utils/helpers';
import { Check, CheckCheck, Edit2, Trash2, Copy, Reply, Forward, Star, Smile, FileText, Maximize2 } from 'lucide-react';
import EmojiPicker from '@/components/chat/EmojiPicker';
import toast from 'react-hot-toast';

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  onReply?: () => void;
  onViewFile?: () => void;
}

export default function MessageBubble({ message, isOwn, onReply, onViewFile }: MessageBubbleProps) {
  const { user } = useAuthStore();
  const { emit } = useSocketStore();
  const [showActions, setShowActions] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || '');
  const [showReactions, setShowReactions] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      toast.success('Copied to clipboard');
    }
  };

  const handleReply = () => {
    onReply?.();
    setShowActions(false);
  };

  const handleDelete = () => {
    emit('message:delete', { messageId: message.id, deleteForEveryone: isOwn });
    setShowActions(false);
  };

  const handleEdit = () => {
    if (editText.trim() && editText !== message.content) {
      emit('message:edit', { messageId: message.id, content: editText.trim() });
      toast.success('Message edited');
    }
    setIsEditing(false);
    setShowActions(false);
  };

  const handleReaction = (emoji: string) => {
    emit('message:react', { messageId: message.id, emoji });
    setShowEmoji(false);
    setShowReactions(false);
  };

  const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

  if (message.isDeleted) {
    return (
      <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
        <div className={cn(
          'max-w-[75%] sm:max-w-[65%] px-4 py-2 text-sm italic text-gray-400',
          isOwn ? 'message-bubble-sent opacity-60' : 'message-bubble-received opacity-60'
        )}>
          🚫 This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('flex group relative', isOwn ? 'justify-end' : 'justify-start')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Actions overlay */}
      {showActions && (
        <div
          ref={actionsRef}
          className={cn(
            'absolute top-1 z-10 flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 animate-scale-in',
            isOwn ? 'right-0' : 'left-0'
          )}
        >
          <button onClick={() => setShowReactions(!showReactions)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors" title="React">
            <Smile size={16} />
          </button>
          <button onClick={handleReply} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors" title="Reply">
            <Reply size={16} />
          </button>
          {isOwn && message.type === 'TEXT' && (
            <button onClick={() => setIsEditing(true)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors" title="Edit">
              <Edit2 size={16} />
            </button>
          )}
          <button onClick={handleCopy} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors" title="Copy">
            <Copy size={16} />
          </button>
          {isOwn && (
            <button onClick={handleDelete} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-md transition-colors" title="Delete">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}

      {/* Quick reactions */}
      {showReactions && (
        <div className={cn(
          'absolute z-20 flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 px-1 py-0.5 animate-scale-in',
          isOwn ? 'right-12 -top-10' : 'left-12 -top-10'
        )}>
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-transform hover:scale-125 text-lg"
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => setShowEmoji(true)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <Smile size={16} className="text-gray-400" />
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div className={cn('absolute z-30', isOwn ? 'right-0 -top-80' : 'left-0 -top-80')}>
          <EmojiPicker
            onSelect={handleReaction}
            onClose={() => setShowEmoji(false)}
          />
        </div>
      )}

      {/* Message content */}
      <div className={cn(
        'max-w-[75%] sm:max-w-[65%] px-3.5 py-2 text-sm relative transition-all duration-200',
        isOwn ? 'message-bubble-sent' : 'message-bubble-received'
      )}>
        {/* Reply preview */}
        {message.replyTo && (
          <div className={cn(
            'mb-1.5 pl-2 border-l-2 rounded text-xs',
            isOwn ? 'border-white/40 bg-white/10' : 'border-primary-500/40 bg-primary-50 dark:bg-primary-900/20'
          )}>
            <p className={cn('font-medium', isOwn ? 'text-white/80' : 'text-primary-600 dark:text-primary-400')}>
              {message.replyTo.sender?.displayName || 'Unknown'}
            </p>
            <p className={cn('truncate', isOwn ? 'text-white/60' : 'text-gray-500')}>
              {message.replyTo.content || '📷 Photo'}
            </p>
          </div>
        )}

        {/* Edit mode */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
              rows={2}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setIsEditing(false)} className="text-xs text-white/60 hover:text-white">Cancel</button>
              <button onClick={handleEdit} className="text-xs font-medium text-white">Save</button>
            </div>
          </div>
        ) : (
          <>
            {/* Media */}
            {message.type === 'IMAGE' && message.mediaUrl && (
              <div className="mb-1 -mx-1 -mt-1 rounded-xl overflow-hidden cursor-pointer" onClick={onViewFile}>
                <img src={message.mediaUrl} alt="Shared image" className="max-w-full h-auto rounded-xl" loading="lazy" />
              </div>
            )}

            {message.type === 'VIDEO' && message.mediaUrl && (
              <div className="mb-1 -mx-1 -mt-1 rounded-xl overflow-hidden cursor-pointer" onClick={onViewFile}>
                <video src={message.mediaUrl} controls className="max-w-full rounded-xl" />
              </div>
            )}

            {message.type === 'AUDIO' && message.mediaUrl && (
              <div className="mb-1">
                <audio src={message.mediaUrl} controls className="w-full max-w-xs" />
              </div>
            )}

            {message.type === 'VOICE' && (
              <div className="mb-1 flex items-center gap-2">
                <span className="text-lg">🎤</span>
                {message.mediaUrl ? (
                  <audio src={message.mediaUrl} controls className="flex-1 max-w-xs" />
                ) : (
                  <span className="text-xs opacity-70">Voice message</span>
                )}
              </div>
            )}

            {message.type === 'DOCUMENT' && message.mediaUrl && (
              <button onClick={onViewFile} className={cn('mb-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs', isOwn ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600')}>
                <FileText size={16} />
                <span className="truncate max-w-[200px]">{message.content || 'Document'}</span>
                <Maximize2 size={12} className="opacity-50" />
              </button>
            )}

            {/* Text content */}
            {message.content && (
              <p className="break-words whitespace-pre-wrap leading-relaxed">{message.content}</p>
            )}

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {Object.entries(
                  message.reactions.reduce((acc: any, r: any) => {
                    if (!acc[r.emoji]) acc[r.emoji] = [];
                    acc[r.emoji].push(r);
                    return acc;
                  }, {})
                ).map(([emoji, reactions]: [string, any]) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji as string)}
                    className={cn(
                      'flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors',
                      isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    <span>{emoji}</span>
                    <span className={cn('text-[10px]', isOwn ? 'text-white/70' : 'text-gray-500')}>
                      {reactions.length}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Meta */}
            <div className={cn(
              'flex items-center justify-end gap-1 mt-1',
              isOwn ? 'text-white/60' : 'text-gray-400'
            )}>
              {message.isEdited && <span className="text-[10px] italic">edited</span>}
              <span className="text-[10px]">{formatTime(message.createdAt)}</span>
              {isOwn && (
                message.status === 'READ' ? (
                  <CheckCheck size={14} className="text-primary-300" />
                ) : message.status === 'DELIVERED' ? (
                  <CheckCheck size={14} />
                ) : (
                  <Check size={14} />
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
