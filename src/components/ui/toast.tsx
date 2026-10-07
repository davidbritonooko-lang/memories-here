'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface Toast {
  id: string;
  type?: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: Toast['type'] = 'info', duration = 3500) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div
        className="fixed bottom-6 right-6 left-6 sm:left-auto z-50 flex flex-col gap-2 pointer-events-none pb-safe"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const icons = {
              success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
              error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
              info: <Info className="w-4 h-4 text-[#B96F91] dark:text-[#D59AB6] shrink-0" />,
            };

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className={cn(
                  'pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm max-w-sm',
                  'bg-[#FFFFFF] dark:bg-[#151319] border-[#E8E3E6] dark:border-[#29252C] text-[#171518] dark:text-[#F5F1F4]'
                )}
              >
                <div className="flex items-center gap-2.5">
                  {icons[toast.type || 'info']}
                  <span className="font-medium text-xs sm:text-sm leading-tight">
                    {toast.message}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Dismiss notification"
                  className="p-1 rounded-full text-[#9A949B] hover:text-[#171518] dark:text-[#77717A] dark:hover:text-[#F5F1F4] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
