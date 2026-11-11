'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import { ResponsiveVideoPlayer } from '@/components/media/responsive-video-player';

export interface LightboxMediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  aspectRatio?: string;
}

export interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  items: LightboxMediaItem[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export function MediaLightbox({
  isOpen,
  onClose,
  items,
  currentIndex,
  onIndexChange,
}: MediaLightboxProps) {
  const currentItem = items[currentIndex];

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  }, [currentIndex, onIndexChange]);

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  }, [currentIndex, items.length, onIndexChange]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    },
    [onClose, handlePrev, handleNext]
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

  if (!isOpen || !currentItem) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Control Bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          <span className="text-xs font-mono text-white/70 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {items.length}
          </span>

          <IconButton
            aria-label="Close lightbox"
            size="md"
            variant="ghost"
            onClick={onClose}
            className="text-white/80 hover:text-white bg-black/40 rounded-full backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        {/* Previous Button */}
        {currentIndex > 0 && (
          <button
            type="button"
            aria-label="Previous image"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white z-20 backdrop-blur-sm transition-transform active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {currentIndex < items.length - 1 && (
          <button
            type="button"
            aria-label="Next image"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white z-20 backdrop-blur-sm transition-transform active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Media Container */}
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-5xl max-h-[85vh] w-full flex flex-col items-center justify-center p-4 select-none"
        >
          {currentItem.type === 'photo' ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentItem.url}
              alt={currentItem.caption || 'Moment photo'}
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          ) : (
            <div className="w-full max-w-2xl">
              <ResponsiveVideoPlayer
                src={currentItem.url}
                poster={currentItem.thumbnailUrl || undefined}
                aspectRatio="aspect-video"
                autoPlay
              />
            </div>
          )}

          {currentItem.caption && (
            <p className="mt-3 text-sm text-white/90 text-center max-w-lg bg-black/60 px-4 py-2 rounded-xl backdrop-blur-sm">
              {currentItem.caption}
            </p>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
