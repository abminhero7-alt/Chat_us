'use client';

import { cn, getInitials } from '@/utils/helpers';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const BASE_URL = API_URL.replace('/api', '');

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  status?: string | null;
  className?: string;
}

export default function Avatar({ name, src, size = 'md', status, className }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    xxl: 'w-24 h-24 text-2xl',
  };

  const statusColors: Record<string, string> = {
    ONLINE: 'bg-green-500',
    AWAY: 'bg-yellow-500',
    BUSY: 'bg-red-500',
    OFFLINE: 'bg-gray-400',
  };

  const statusSizes = {
    sm: 'w-2.5 h-2.5 border',
    md: 'w-3 h-3 border-2',
    lg: 'w-3.5 h-3.5 border-2',
    xl: 'w-4 h-4 border-2',
    xxl: 'w-5 h-5 border-3',
  };

  const resolveSrc = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url}`;
  };

  const resolvedSrc = resolveSrc(src);

  return (
    <div className="relative inline-flex flex-shrink-0">
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={name}
          className={cn('rounded-full object-cover', sizeClasses[size], className)}
          loading="lazy"
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold',
            sizeClasses[size],
            className
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full',
            statusColors[status] || statusColors.OFFLINE,
            statusSizes[size]
          )}
        />
      )}
    </div>
  );
}
