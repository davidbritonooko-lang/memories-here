import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { COLOR_TOKENS, TYPOGRAPHY_ROLES, BREAKPOINTS } from '@/styles/tokens';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ThemeProvider, useTheme } from '@/features/settings/ThemeProvider';

describe('Phase 2: Design System Acceptance Tests', () => {
  describe('Color Tokens (Spec Section 7)', () => {
    it('defines warm editorial palette tokens for light mode', () => {
      expect(COLOR_TOKENS.light.background).toBe('#F7F5F2');
      expect(COLOR_TOKENS.light.surface).toBe('#FFFFFF');
      expect(COLOR_TOKENS.light.elevated).toBe('#FCFBF9');
      expect(COLOR_TOKENS.light.primaryText).toBe('#171518');
      expect(COLOR_TOKENS.light.secondaryText).toBe('#6F6A70');
      expect(COLOR_TOKENS.light.mutedText).toBe('#9A949B');
      expect(COLOR_TOKENS.light.border).toBe('#E8E3E6');
      expect(COLOR_TOKENS.light.accent).toBe('#B96F91');
      expect(COLOR_TOKENS.light.accentSoft).toBe('#EEDCE4');
    });

    it('defines near-black cinematic palette tokens for dark mode', () => {
      expect(COLOR_TOKENS.dark.background).toBe('#0C0B0F');
      expect(COLOR_TOKENS.dark.surface).toBe('#151319');
      expect(COLOR_TOKENS.dark.elevated).toBe('#1C1920');
      expect(COLOR_TOKENS.dark.primaryText).toBe('#F5F1F4');
      expect(COLOR_TOKENS.dark.secondaryText).toBe('#AAA3AC');
      expect(COLOR_TOKENS.dark.mutedText).toBe('#77717A');
      expect(COLOR_TOKENS.dark.border).toBe('#29252C');
      expect(COLOR_TOKENS.dark.accent).toBe('#D59AB6');
      expect(COLOR_TOKENS.dark.accentSoft).toBe('#3A2934');
    });
  });

  describe('Typography Roles (Spec Section 8)', () => {
    it('defines Inter for Primary UI, Cormorant for Emotional Editorial, and Space Grotesk for PeshTok', () => {
      expect(TYPOGRAPHY_ROLES.primaryUI.fontFamily).toBe('var(--font-inter)');
      expect(TYPOGRAPHY_ROLES.emotionalEditorial.fontFamily).toBe('var(--font-cormorant)');
      expect(TYPOGRAPHY_ROLES.peshTok.fontFamily).toBe('var(--font-space-grotesk)');
    });
  });

  describe('Mobile Target Breakpoints (Spec Section 5)', () => {
    it('contains primary phone targets 360, 375, 390, 412', () => {
      expect(BREAKPOINTS.mobileSmall).toBe(360);
      expect(BREAKPOINTS.mobileMedium).toBe(375);
      expect(BREAKPOINTS.mobileStandard).toBe(390);
      expect(BREAKPOINTS.mobileLarge).toBe(412);
    });
  });

  describe('UI Component Primitives (Spec Section 39)', () => {
    it('renders Button with variants and complies with mobile touch target minimum height', () => {
      render(<Button variant="primary">Begin Moment</Button>);
      const button = screen.getByRole('button', { name: /begin moment/i });
      expect(button).toBeDefined();
      // Verifies mobile 44px min-height tap-target class
      expect(button.className).toContain('min-h-[44px]');
    });

    it('disables Button when isLoading is true and renders spinner', () => {
      render(<Button isLoading>Saving</Button>);
      const button = screen.getByRole('button', { name: /saving/i }) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('renders IconButton with accessible aria-label and mobile tap target', () => {
      render(
        <IconButton aria-label="Play Soundtrack">
          <span>▶</span>
        </IconButton>
      );
      const iconButton = screen.getByRole('button', { name: /play soundtrack/i });
      expect(iconButton).toBeDefined();
      expect(iconButton.className).toContain('min-w-[44px]');
      expect(iconButton.className).toContain('min-h-[44px]');
    });

    it('renders Card with surface tokens and border', () => {
      render(
        <Card data-testid="card-element">
          <p>Card Content</p>
        </Card>
      );
      const card = screen.getByTestId('card-element');
      expect(card).toBeDefined();
      expect(card.className).toContain('rounded-2xl');
    });

    it('renders Input with label and error state', () => {
      render(
        <Input
          label="Memory Title"
          error="Title is required"
          placeholder="Enter title..."
        />
      );
      expect(screen.getByText('Memory Title')).toBeDefined();
      expect(screen.getByText('Title is required')).toBeDefined();
      expect(screen.getByPlaceholderText('Enter title...')).toBeDefined();
    });

    it('renders Badge with subtle styling', () => {
      render(<Badge variant="accent">Keep Offline</Badge>);
      const badge = screen.getByText('Keep Offline');
      expect(badge.className).toContain('rounded-full');
    });

    it('renders EmptyState with editorial tone and title', () => {
      render(
        <EmptyState
          title="No moments collected yet"
          description="Every quiet observation starts somewhere."
        />
      );
      expect(screen.getByText('No moments collected yet')).toBeDefined();
      expect(screen.getByText('Every quiet observation starts somewhere.')).toBeDefined();
    });

    it('renders ErrorState with calm non-technical product tone', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorState
          title="Something got in the way."
          message="This memory needs the internet before it can be played."
          onRetry={handleRetry}
        />
      );
      expect(screen.getByText('Something got in the way.')).toBeDefined();
      expect(screen.getByText('This memory needs the internet before it can be played.')).toBeDefined();
      const retryBtn = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledOnce();
    });
  });

  describe('Theme System (Spec Section 6)', () => {
    it('defaults to system theme and allows switching to dark or light', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe('system');
      expect(['light', 'dark']).toContain(result.current.resolvedTheme);

      act(() => {
        result.current.setTheme('dark');
      });
      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');

      act(() => {
        result.current.setTheme('light');
      });
      expect(result.current.theme).toBe('light');
      expect(result.current.resolvedTheme).toBe('light');
    });
  });
});
