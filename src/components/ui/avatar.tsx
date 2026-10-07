import React from 'react';
import Image from 'next/image';
import { cn } from '@/utils/cn';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({
  src,
  alt = 'Avatar',
  name = 'Peshie',
  size = 'md',
  className,
}: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  const getInitials = (str: string) => {
    return str
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none border-2 border-[#FFFFFF] dark:border-[#151319] shadow-xs',
        'bg-[#EEDCE4] text-[#B96F91] dark:bg-[#3A2934] dark:text-[#D59AB6] font-semibold',
        sizes[size],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="80px"
          className="object-cover"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
