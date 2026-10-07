'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string; // Enforce accessible labeling for icon buttons
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = 'ghost',
      size = 'md',
      type = 'button',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-full transition-all duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

    const variants = {
      primary:
        'bg-[#B96F91] text-white hover:bg-[#a55f80] active:scale-95 shadow-sm dark:bg-[#D59AB6] dark:text-[#171518] dark:hover:bg-[#c487a3] focus-visible:ring-[#B96F91]',
      secondary:
        'bg-[#EEDCE4] text-[#171518] hover:bg-[#e4ccd7] active:scale-95 dark:bg-[#3A2934] dark:text-[#F5F1F4] dark:hover:bg-[#483341] focus-visible:ring-[#B96F91]',
      outline:
        'border border-[#E8E3E6] bg-transparent text-[#171518] hover:bg-white/60 active:scale-95 dark:border-[#29252C] dark:text-[#F5F1F4] dark:hover:bg-[#1C1920]/60 focus-visible:ring-[#B96F91]',
      ghost:
        'bg-transparent text-[#6F6A70] hover:text-[#171518] hover:bg-black/5 active:scale-95 dark:text-[#AAA3AC] dark:hover:text-[#F5F1F4] dark:hover:bg-white/5',
    };

    const sizes = {
      sm: 'w-9 h-9 min-w-[36px] min-h-[36px] text-sm',
      md: 'w-11 h-11 min-w-[44px] min-h-[44px] text-base', // 44px mobile touch target standard
      lg: 'w-13 h-13 min-w-[52px] min-h-[52px] text-lg',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
