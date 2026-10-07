import React from 'react';
import { cn } from '@/utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-[#E8E3E6]/60 dark:bg-[#29252C]/60',
        shimmer && 'animate-pulse',
        className
      )}
      {...props}
    />
  );
}
