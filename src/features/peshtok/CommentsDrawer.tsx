'use client';

import React, { useState, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { peshtokRepo } from '@/lib/supabase/db';
import type { Comment } from '@/types';
import { generateRandomSimulatedComment } from './simulated-comments';
import { formatMomentDate } from '@/features/moments/utils';
import { useToast } from '@/components/ui/toast';

export interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  worldId: string;
  currentUserName: string;
}

export function CommentsDrawer({
  isOpen,
  onClose,
  videoId,
  worldId,
  currentUserName,
}: CommentsDrawerProps) {
  const { showToast } = useToast();
  const [commentsState, setCommentsState] = useState<{
    videoId: string;
    comments: Comment[];
    status: 'loading' | 'loaded';
  }>({ videoId: '', comments: [], status: 'loading' });
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadComments = async () => {
      try {
        const data = await peshtokRepo.listComments(videoId);
        if (!cancelled) {
          setCommentsState({
            videoId,
            comments: (data || []) as unknown as Comment[],
            status: 'loaded',
          });
        }
      } catch {
        if (!cancelled) {
          setCommentsState({ videoId, comments: [], status: 'loaded' });
          showToast("Couldn't load comments.", 'error');
        }
      }
    };

    void loadComments();
    return () => {
      cancelled = true;
    };
  }, [isOpen, videoId, showToast]);

  const comments = commentsState.videoId === videoId ? commentsState.comments : [];
  const isLoading = commentsState.videoId !== videoId || commentsState.status === 'loading';

  const appendComment = (comment: Comment) => {
    setCommentsState((previous) => ({
      videoId,
      comments: previous.videoId === videoId
        ? [...previous.comments, comment]
        : [comment],
      status: 'loaded',
    }));
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    if (!worldId) {
      showToast('Your private space is unavailable. Reconnect and try again.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await peshtokRepo.addComment({
        world_id: worldId,
        video_id: videoId,
        author_name: currentUserName || 'Me',
        content: newCommentText.trim(),
        is_simulated: false,
      });

      appendComment(created as unknown as Comment);
      setNewCommentText('');
    } catch {
      showToast("Couldn't add your comment.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddExampleComment = async () => {
    if (!worldId) {
      showToast('Your private space is unavailable. Reconnect and try again.', 'error');
      return;
    }

    try {
      const simulated = generateRandomSimulatedComment();
      const created = await peshtokRepo.addComment({
        world_id: worldId,
        video_id: videoId,
        author_name: simulated.author_name,
        content: simulated.content,
        is_simulated: true,
      });

      setComments((prev) => [...prev, created as unknown as Comment]);
    } catch {
      showToast("Couldn't add the sample comment.", 'error');
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Comments (${comments.length})`}
      description="Comments and notes for this clip."
    >
      <div className="flex flex-col gap-4 max-h-[60vh]">
        {/* Comments List */}
        <div className="flex flex-col gap-3 overflow-y-auto max-h-80 pr-1">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Spinner size="md" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-text">
              <p className="text-xs">No comments yet.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddExampleComment}
                disabled={!worldId}
                className="mt-2 text-accent text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Add example comment
              </Button>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="flex items-start gap-3 p-3 rounded-2xl bg-surface border border-border/60"
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold shrink-0">
                  {comment.author_name.charAt(0).toUpperCase()}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-primary-text">
                      {comment.author_name}
                    </span>
                    {comment.is_simulated && (
                      <span className="text-[10px] text-accent/80 font-mono">SAMPLE</span>
                    )}
                    <span className="text-[10px] text-muted-text ml-auto">
                      {formatMomentDate(comment.created_at, 'short')}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-secondary-text leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2 border-t border-border">
          <Input
            placeholder="Add a comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            className="flex-1 text-xs"
          />

          <Button type="submit" size="sm" disabled={isSubmitting || !newCommentText.trim() || !worldId}>
            {isSubmitting ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddExampleComment}
            disabled={!worldId}
            title="Add generated sample comment"
          >
            <Sparkles className="w-4 h-4 text-accent" />
          </Button>
        </form>
      </div>
    </Sheet>
  );
}
