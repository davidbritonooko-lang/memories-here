'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusic } from '@/engines/music';
import { peshtokRepo } from '@/lib/supabase/db';
import type { PeshTokVideo } from '@/types';
import { CommentsDrawer } from './CommentsDrawer';

export interface PeshTokVideoCardProps {
  item: PeshTokVideo;
  videoUrl: string;
  thumbnailUrl?: string | null;
  worldId: string;
  currentUserName: string;
  isActive: boolean;
}

export function PeshTokVideoCard({
  item,
  videoUrl,
  thumbnailUrl,
  worldId,
  currentUserName,
  isActive,
}: PeshTokVideoCardProps) {
  const { engine } = useMusic();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [likesCount, setLikesCount] = useState(item.likes_count || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  // Autoplay / Pause when active in view
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {});
      engine.duck();
    } else {
      video.pause();
    }

    return () => {
      if (isActive) {
        engine.unduck();
      }
    };
  }, [isActive, engine]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      engine.unduck();
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
      engine.duck();
    }
  };

  const handleLike = async () => {
    const nextState = !hasLiked;
    setHasLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    if (nextState) setShowHeartAnim(true);

    try {
      await peshtokRepo.toggleLike(worldId, item.id);
    } catch {
      // Revert on error
      setHasLiked(!nextState);
      setLikesCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleDoubleTap = () => {
    if (!hasLiked) {
      handleLike();
    } else {
      setShowHeartAnim(true);
    }
  };

  return (
    <div className="relative w-full max-w-sm sm:max-w-md h-[80vh] sm:h-[84vh] mx-auto rounded-3xl overflow-hidden bg-black shadow-2xl snap-center shrink-0 select-none">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl || undefined}
        loop
        playsInline
        muted={isMuted}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
        onDoubleClick={handleDoubleTap}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* Floating Animated Heart on Double Tap */}
      <AnimatePresence>
        {showHeartAnim && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6 }}
            onAnimationComplete={() => setShowHeartAnim(false)}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <Heart className="w-24 h-24 fill-red-500 text-red-500 drop-shadow-lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play / Pause Center Overlay Indicator */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-auto cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
            <Sparkles className="w-8 h-8 opacity-80" />
          </div>
        </div>
      )}

      {/* Right-Hand Action Bar */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 z-20">
        {/* Like Button */}
        <button
          type="button"
          aria-label="Like video"
          onClick={handleLike}
          className="flex flex-col items-center gap-1 group"
        >
          <div
            className={`p-3 rounded-full backdrop-blur-md transition-transform active:scale-90 ${
              hasLiked ? 'bg-red-500/80 text-white' : 'bg-black/40 text-white hover:bg-black/60'
            }`}
          >
            <Heart className={`w-6 h-6 ${hasLiked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-[11px] font-semibold text-white drop-shadow">
            {likesCount}
          </span>
        </button>

        {/* Comment Button */}
        <button
          type="button"
          aria-label="Open comments"
          onClick={() => setIsCommentsOpen(true)}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white transition-transform active:scale-90">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-semibold text-white drop-shadow">
            {item.comments_count || 0}
          </span>
        </button>

        {/* Mute / Unmute Button */}
        <button
          type="button"
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          onClick={() => setIsMuted((prev) => !prev)}
          className="p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white transition-transform active:scale-90"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Bottom Creator & Caption Info */}
      <div className="absolute bottom-4 left-4 right-16 flex flex-col gap-1.5 z-20 text-white drop-shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {currentUserName ? currentUserName.charAt(0).toUpperCase() : 'P'}
          </div>
          <span className="text-sm font-semibold tracking-wide">
            @{currentUserName || 'peshie'}
          </span>
        </div>

        {item.caption && (
          <p className="text-xs sm:text-sm line-clamp-2 text-white/90 font-light">
            {item.caption}
          </p>
        )}
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

      {/* Comments Drawer */}
      <CommentsDrawer
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        videoId={item.id}
        worldId={worldId}
        currentUserName={currentUserName}
      />
    </div>
  );
}
