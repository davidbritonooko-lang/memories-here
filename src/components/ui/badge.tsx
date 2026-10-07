import React from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'outline' | 'success' | 'neutral';
  size?: 'sm' | 'md';
}

export function Badge({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-full select-none tracking-wide';

  const variants = {
    default:
      'bg-[#EEDCE4] text-[#B96F91] dark:bg-[#3A2934] dark:text-[#D59AB6]',
    accent:
      'bg-[#B96F91] text-white dark:bg-[#D59AB6] dark:text-[#171518]',
    outline:
      'border border-[#E8E3E6] text-[#6F6A70] dark:border-[#29252C] dark:text-[#AAA3AC]',
    success:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40',
    neutral:
      'bg-black/5 text-[#6F6A70] dark:bg-white/10 dark:text-[#AAA3AC]',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
}
