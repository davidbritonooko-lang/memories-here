import React from 'react';
import { cn } from '@/utils/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl bg-[#FCFBF9]/60 dark:bg-[#1C1920]/40 border border-dashed border-[#E8E3E6] dark:border-[#29252C]',
        className
      )}
    >
      {icon && (
        <div className="mb-4 inline-flex items-center justify-center p-3 rounded-2xl bg-[#EEDCE4]/50 dark:bg-[#3A2934]/50 text-[#B96F91] dark:text-[#D59AB6]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-editorial font-medium text-[#171518] dark:text-[#F5F1F4]">
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-sm text-[#6F6A70] dark:text-[#AAA3AC] max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
