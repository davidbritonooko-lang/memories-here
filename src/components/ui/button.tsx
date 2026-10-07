'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Spinner } from './spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-full';

    const variants = {
      primary:
        'bg-[#B96F91] text-white hover:bg-[#a55f80] active:scale-[0.98] shadow-sm dark:bg-[#D59AB6] dark:text-[#171518] dark:hover:bg-[#c487a3] focus-visible:ring-[#B96F91]',
      secondary:
        'bg-[#EEDCE4] text-[#171518] hover:bg-[#e4ccd7] active:scale-[0.98] dark:bg-[#3A2934] dark:text-[#F5F1F4] dark:hover:bg-[#483341] focus-visible:ring-[#B96F91]',
      outline:
        'border border-[#E8E3E6] bg-transparent text-[#171518] hover:bg-[#FFFFFF]/60 active:scale-[0.98] dark:border-[#29252C] dark:text-[#F5F1F4] dark:hover:bg-[#1C1920]/60 focus-visible:ring-[#B96F91]',
      ghost:
        'bg-transparent text-[#6F6A70] hover:text-[#171518] hover:bg-black/5 dark:text-[#AAA3AC] dark:hover:text-[#F5F1F4] dark:hover:bg-white/5 active:scale-[0.98]',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98] focus-visible:ring-rose-500',
    };

    const sizes = {
      sm: 'text-xs px-3.5 py-1.5 min-h-[36px] gap-1.5',
      md: 'text-sm px-5 py-2.5 min-h-[44px] gap-2', // Meets 44px mobile touch target
      lg: 'text-base px-6 py-3 min-h-[48px] gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Spinner size="sm" className="text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
