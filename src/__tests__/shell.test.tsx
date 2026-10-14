import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { APPROVED_NAVIGATION } from '@/types/constants';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
}));

import { BottomNav } from '@/components/shell/BottomNav';
import { SideNav } from '@/components/shell/SideNav';

describe('Phase 3: Application Shell Acceptance Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Information Architecture — Approved Navigation (Spec Section 3)', () => {
    it('approved navigation contains exactly 6 areas in order', () => {
      const ids = APPROVED_NAVIGATION.map(item => item.id);
      expect(ids).toHaveLength(6);
      expect(ids).toEqual(['home', 'moments', 'peshtok', 'soundtrack', 'archive', 'settings']);
    });

    it('all approved navigation items have valid hrefs starting with /', () => {
      for (const item of APPROVED_NAVIGATION) {
        expect(item.href).toMatch(/^\//);
      }
    });
  });

  describe('BottomNav (Mobile Navigation Shell)', () => {
    it('renders the nav element with accessible label', () => {
      render(<BottomNav />);
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(nav).toBeDefined();
    });

    it('renders all 6 approved navigation links', () => {
      render(<BottomNav />);
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      const links = within(nav).getAllByRole('link');
      expect(links.length).toBe(6);
    });

    it('marks Home link as active (aria-current=page) on root path', () => {
      render(<BottomNav />);
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      const links = within(nav).getAllByRole('link');
      const homeLink = links.find(l => l.getAttribute('href') === '/');
      expect(homeLink).toBeDefined();
      expect(homeLink!.getAttribute('aria-current')).toBe('page');
    });

    it('non-active links do not have aria-current=page', () => {
      render(<BottomNav />);
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      const links = within(nav).getAllByRole('link');
      const nonHomeLinks = links.filter(l => l.getAttribute('href') !== '/');
      for (const link of nonHomeLinks) {
        expect(link.getAttribute('aria-current')).not.toBe('page');
      }
    });

    it('all nav links have accessible aria-labels', () => {
      render(<BottomNav />);
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      const links = within(nav).getAllByRole('link');
      for (const link of links) {
        const label = link.getAttribute('aria-label') ?? link.textContent;
        expect(label).toBeTruthy();
      }
    });

    it('nav links have minimum 52px mobile touch target via className', () => {
      render(<BottomNav />);
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      const links = within(nav).getAllByRole('link');
      for (const link of links) {
        expect(link.className).toContain('min-h-[52px]');
      }
    });
  });

  describe('SideNav (Desktop Navigation Shell)', () => {
    it('renders an aside element with accessible label', () => {
      const { container } = render(<SideNav />);
      const aside = container.querySelector('aside');
      expect(aside).not.toBeNull();
      expect(aside!.getAttribute('aria-label')).toBe('Main navigation');
    });

    it('contains a Peshie wordmark link', () => {
      render(<SideNav />);
      const wordmark = screen.getByText('Peshie');
      expect(wordmark).toBeDefined();
      // Closest link should point to /
      const link = wordmark.closest('a');
      expect(link?.getAttribute('href')).toBe('/');
    });

    it('contains exactly 6 approved navigation links inside inner nav', () => {
      const { container } = render(<SideNav />);
      const innerNav = container.querySelector('nav');
      expect(innerNav).not.toBeNull();
      const links = innerNav!.querySelectorAll('a');
      expect(links.length).toBe(6);
    });

    it('Home link is marked active on root path', () => {
      const { container } = render(<SideNav />);
      const innerNav = container.querySelector('nav');
      const homeLink = Array.from(innerNav!.querySelectorAll('a')).find(
        l => l.getAttribute('href') === '/'
      );
      expect(homeLink).toBeDefined();
      expect(homeLink!.getAttribute('aria-current')).toBe('page');
    });
  });
});
