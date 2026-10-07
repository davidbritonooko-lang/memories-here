'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium tracking-wider uppercase text-[#6F6A70] dark:text-[#AAA3AC]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <span className="absolute left-3.5 text-[#9A949B] dark:text-[#77717A] pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full min-h-[44px] rounded-xl px-4 py-2.5 text-sm transition-all duration-200',
              'bg-[#FFFFFF] dark:bg-[#151319] text-[#171518] dark:text-[#F5F1F4]',
              'border border-[#E8E3E6] dark:border-[#29252C]',
              'placeholder:text-[#9A949B] dark:placeholder:text-[#77717A]',
              'focus:outline-none focus:border-[#B96F91] focus:ring-2 focus:ring-[#B96F91]/20 dark:focus:border-[#D59AB6] dark:focus:ring-[#D59AB6]/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3.5 text-[#9A949B] dark:text-[#77717A] pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#9A949B] dark:text-[#77717A]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
