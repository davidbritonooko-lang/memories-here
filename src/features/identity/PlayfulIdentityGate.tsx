'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart } from 'lucide-react';
import { useWorldIdentity } from './WorldIdentityProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface PlayfulIdentityGateProps {
  children: React.ReactNode;
}

export function PlayfulIdentityGate({ children }: PlayfulIdentityGateProps) {
  const { isIdentified, isLoading, identityError, identifyWorld } = useWorldIdentity();
  const [name, setName] = useState('');
  const [step, setStep] = useState<'prompt' | 'remembering'>('prompt');
  const [error, setError] = useState<string | null>(null);
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (submitTimer.current) clearTimeout(submitTimer.current);
    },
    []
  );

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

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Tell me what you like to be called.');
      return;
    }

    setError(null);
    setStep('remembering');

    // Display "I'll remember you forever." for an emotional beat before entering
    const delay = process.env.NODE_ENV === 'test' ? 1200 : 1800;
    submitTimer.current = setTimeout(() => {
      void identifyWorld(trimmed).catch((cause: unknown) => {
        setStep('prompt');
        setError(
          cause instanceof Error
            ? cause.message
            : 'Could not create your private world. Please try again.'
        );
      });
    }, delay);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#F7F5F2] dark:bg-[#0C0B0F] transition-colors duration-500">
      {/* Ambient background glow */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-[#EEDCE4]/40 dark:bg-[#3A2934]/30 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm flex flex-col items-center text-center z-10">
        <AnimatePresence mode="wait">
          {step === 'prompt' ? (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col items-center"
            >
              {/* Subtle poetic icon */}
              <div className="mb-6 inline-flex p-3.5 rounded-full bg-[#FFFFFF] dark:bg-[#151319] border border-[#E8E3E6] dark:border-[#29252C] shadow-sm text-[#B96F91] dark:text-[#D59AB6]">
                <Sparkles className="w-5 h-5" />
              </div>

              {/* Specification exact phrase: "who's the pretty girl around here?" */}
              <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#171518] dark:text-[#F5F1F4] tracking-tight leading-snug">
                who&apos;s the pretty girl
                <br />
                around here?
              </h1>

              <p className="mt-3 text-xs sm:text-sm text-[#6F6A70] dark:text-[#AAA3AC] max-w-xs font-ui">
                A little corner of the internet that belongs to you.
              </p>

              <form onSubmit={handleSubmit} className="w-full mt-8 flex flex-col gap-4">
                <Input
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Your name..."
                  aria-label="Your name"
                  error={error || undefined}
                  className="text-center font-editorial text-lg"
                />

                <Button
                  type="submit"
                  size="md"
                  className="w-full mt-2"
                  disabled={step !== 'prompt'}
                >
                  It&apos;s me
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="remembering"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="mb-6 inline-flex p-3.5 rounded-full bg-[#EEDCE4]/60 dark:bg-[#3A2934]/60 text-[#B96F91] dark:text-[#D59AB6] animate-pulse">
                <Heart className="w-6 h-6 fill-current" />
              </div>

              {/* Specification exact phrase: "I'll remember you forever." */}
              <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#171518] dark:text-[#F5F1F4] tracking-tight">
                I&apos;ll remember you forever.
              </h2>

              <p className="mt-3 font-editorial italic text-lg text-[#B96F91] dark:text-[#D59AB6]">
                Welcome home, {name.trim()}.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
