'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  Sparkles,
  Clapperboard,
  Music2,
  Archive,
  Settings,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', href: '/', icon: <Home className="w-5 h-5" /> },
  { id: 'moments', label: 'Moments', href: '/moments', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'peshtok', label: 'PeshTok', href: '/peshtok', icon: <Clapperboard className="w-5 h-5" /> },
  { id: 'soundtrack', label: 'Soundtrack', href: '/soundtrack', icon: <Music2 className="w-5 h-5" /> },
  { id: 'archive', label: 'Archive', href: '/archive', icon: <Archive className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around
        bg-[#FFFFFF]/90 dark:bg-[#0C0B0F]/90 backdrop-blur-xl
        border-t border-[#E8E3E6] dark:border-[#29252C]
        pb-safe px-2 pt-1"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex flex-col items-center justify-center gap-0.5 min-w-[52px] min-h-[52px] px-2 py-1.5 rounded-2xl',
              'transition-all duration-200 select-none tap-target',
              active
                ? 'text-[#B96F91] dark:text-[#D59AB6]'
                : 'text-[#9A949B] dark:text-[#77717A] hover:text-[#6F6A70] dark:hover:text-[#AAA3AC]'
            )}
          >
            {active && (
              <motion.div
                layoutId="nav-active-bg"
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="absolute inset-0 rounded-2xl bg-[#EEDCE4]/50 dark:bg-[#3A2934]/60"
              />
            )}
            <span className="relative z-10">{item.icon}</span>
            <span
              className={cn(
                'relative z-10 text-[10px] font-medium tracking-wide leading-none font-ui',
                active ? 'opacity-100' : 'opacity-80'
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
