import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline';
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      interactive = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-2xl transition-all duration-200 overflow-hidden';

    const variants = {
      default:
        'bg-[#FFFFFF] border border-[#E8E3E6] dark:bg-[#151319] dark:border-[#29252C] shadow-sm',
      elevated:
        'bg-[#FCFBF9] border border-[#E8E3E6]/60 dark:bg-[#1C1920] dark:border-[#29252C]/80 shadow-md',
      outline:
        'bg-transparent border border-[#E8E3E6] dark:border-[#29252C]',
    };

    const interactiveStyles = interactive
      ? 'cursor-pointer hover:border-[#B96F91]/50 dark:hover:border-[#D59AB6]/50 hover:shadow-md active:scale-[0.99]'
      : '';

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], interactiveStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
