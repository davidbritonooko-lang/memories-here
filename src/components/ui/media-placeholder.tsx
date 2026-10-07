import React from 'react';
import { Image as ImageIcon, Film } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface MediaPlaceholderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'photo' | 'video';
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'video';
  label?: string;
}

export function MediaPlaceholder({
  type = 'photo',
  aspectRatio = 'portrait',
  label,
  className,
  ...props
}: MediaPlaceholderProps) {
  const aspectRatios = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    video: 'aspect-[9/16]',
  };

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center rounded-2xl bg-[#FCFBF9] dark:bg-[#1C1920] border border-[#E8E3E6] dark:border-[#29252C] overflow-hidden text-[#9A949B] dark:text-[#77717A]',
        aspectRatios[aspectRatio],
        className
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 p-4 text-center select-none">
        {type === 'video' ? (
          <Film className="w-8 h-8 opacity-60" />
        ) : (
          <ImageIcon className="w-8 h-8 opacity-60" />
        )}
        {label && <span className="text-xs font-medium">{label}</span>}
      </div>
    </div>
  );
}
