'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { IconButton } from './icon-button';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export function Sheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  showCloseButton = true,
}: SheetProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={cn(
              'relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#FFFFFF] dark:bg-[#151319] border-t sm:border border-[#E8E3E6] dark:border-[#29252C] p-6 pb-8 shadow-2xl z-10 pb-safe',
              className
            )}
          >
            {/* Grab Handle for Mobile */}
            <div className="flex justify-center -mt-2 mb-4 sm:hidden">
              <div className="w-12 h-1.5 rounded-full bg-[#E8E3E6] dark:bg-[#29252C]" />
            </div>

            {(title || showCloseButton) && (
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  {title && (
                    <h2 className="text-xl font-editorial font-semibold tracking-wide text-[#171518] dark:text-[#F5F1F4]">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-[#6F6A70] dark:text-[#AAA3AC]">
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <IconButton
                    aria-label="Close sheet"
                    size="sm"
                    variant="ghost"
                    onClick={onClose}
                    className="shrink-0 -mr-2 -mt-2 text-[#6F6A70] hover:text-[#171518] dark:text-[#AAA3AC] dark:hover:text-[#F5F1F4]"
                  >
                    <X className="w-5 h-5" />
                  </IconButton>
                )}
              </div>
            )}

            <div>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
