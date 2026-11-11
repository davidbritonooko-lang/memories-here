'use client';

import React, { useState } from 'react';
import { Archive, Sparkles } from 'lucide-react';
import { useWorldIdentity } from './WorldIdentityProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { APP_NAME } from '@/types/constants';

export interface PlayfulIdentityGateProps {
  children: React.ReactNode;
}

export function PlayfulIdentityGate({ children }: PlayfulIdentityGateProps) {
  const { isIdentified, isLoading, identityError, identifyWorld } = useWorldIdentity();
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-[var(--bg-primary)]">
        <div className="w-8 h-8 rounded-full border-2 border-[#B96F91] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isIdentified) {
    return <>{children}</>;
  }

  if (identityError) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-6 bg-[#F7F5F2] text-center dark:bg-[#0C0B0F]">
        <p role="alert" className="max-w-sm text-sm text-secondary-text">
          {identityError}
        </p>
        <Button type="button" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a name for your private space.');
      return;
    }

    setError(null);
    setIsCreating(true);
    try {
      await identifyWorld(trimmed);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Your private space could not be created. Please try again.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#F7F5F2] dark:bg-[#0C0B0F] transition-colors duration-500">
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-[#EEDCE4]/40 dark:bg-[#3A2934]/30 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm flex flex-col items-center text-center z-10">
        <div className="mb-6 inline-flex p-3.5 rounded-full bg-[#FFFFFF] dark:bg-[#151319] border border-[#E8E3E6] dark:border-[#29252C] shadow-sm text-[#B96F91] dark:text-[#D59AB6]">
          <Archive className="w-5 h-5" />
        </div>

        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#171518] dark:text-[#F5F1F4] tracking-tight leading-snug">
          Welcome to {APP_NAME}
        </h1>

        <p className="mt-3 text-xs sm:text-sm text-[#6F6A70] dark:text-[#AAA3AC] max-w-xs font-ui">
          A private space for your moments, photos, videos, notes, and soundtracks.
        </p>

        <form onSubmit={handleSubmit} className="w-full mt-8 flex flex-col gap-4">
          <Input
            autoFocus
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError(null);
            }}
            placeholder="Name your private space"
            aria-label="Private space name"
            error={error || undefined}
            className="text-center font-editorial text-lg"
            disabled={isCreating}
          />

          <Button
            type="submit"
            size="md"
            className="w-full mt-2"
            disabled={isCreating || !name.trim()}
          >
            {isCreating ? (
              'Creating private space...'
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Create private space
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
