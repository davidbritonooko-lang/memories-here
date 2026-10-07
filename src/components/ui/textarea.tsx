'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, disabled, rows = 3, ...props }, ref) => {
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
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          disabled={disabled}
          className={cn(
            'w-full rounded-xl px-4 py-3 text-sm transition-all duration-200 resize-y',
            'bg-[#FFFFFF] dark:bg-[#151319] text-[#171518] dark:text-[#F5F1F4]',
            'border border-[#E8E3E6] dark:border-[#29252C]',
            'placeholder:text-[#9A949B] dark:placeholder:text-[#77717A]',
            'focus:outline-none focus:border-[#B96F91] focus:ring-2 focus:ring-[#B96F91]/20 dark:focus:border-[#D59AB6] dark:focus:ring-[#D59AB6]/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-rose-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#9A949B] dark:text-[#77717A]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
