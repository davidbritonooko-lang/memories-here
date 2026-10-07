import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'Something got in the way.',
  message = 'Take a breath and try again.',
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl bg-[#FCFBF9] dark:bg-[#1C1920] border border-[#E8E3E6] dark:border-[#29252C]',
        className
      )}
      role="alert"
    >
      <div className="mb-4 inline-flex items-center justify-center p-3 rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-editorial font-medium text-[#171518] dark:text-[#F5F1F4]">
        {title}
      </h3>
      {message && (
        <p className="mt-2 text-sm text-[#6F6A70] dark:text-[#AAA3AC] max-w-sm">
          {message}
        </p>
      )}
      {onRetry && (
        <div className="mt-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
