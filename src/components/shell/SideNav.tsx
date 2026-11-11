'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Sparkles,
  Clapperboard,
  Music2,
  Archive,
  Settings,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { APP_NAME } from '@/types/constants';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> },
  { id: 'moments', label: 'Moments', href: '/moments', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'peshtok', label: 'PeshTok', href: '/peshtok', icon: <Clapperboard className="w-4 h-4" /> },
  { id: 'soundtrack', label: 'Soundtrack', href: '/soundtrack', icon: <Music2 className="w-4 h-4" /> },
  { id: 'archive', label: 'Archive', href: '/archive', icon: <Archive className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', href: '/settings', icon: <Settings className="w-4 h-4" /> },
];

export function SideNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside
      aria-label="Main navigation"
      className="hidden lg:flex flex-col w-60 shrink-0 h-full border-r border-[#E8E3E6] dark:border-[#29252C] bg-[#FCFBF9] dark:bg-[#151319] pt-safe"
    >
      {/* Wordmark */}
      <div className="px-6 py-6 border-b border-[#E8E3E6]/50 dark:border-[#29252C]/50">
        <Link href="/" className="group inline-flex items-baseline gap-1.5">
          <span className="font-editorial text-2xl font-semibold text-[#171518] dark:text-[#F5F1F4] tracking-tight group-hover:text-[#B96F91] dark:group-hover:text-[#D59AB6] transition-colors">
            {APP_NAME}
          </span>
          <span className="font-ui text-xs text-[#9A949B] dark:text-[#77717A] tracking-widest uppercase">
            Her World
          </span>
        </Link>
      </div>

      {/* Navigation links */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 select-none',
                active
                  ? 'bg-[#EEDCE4]/70 text-[#B96F91] dark:bg-[#3A2934] dark:text-[#D59AB6]'
                  : 'text-[#6F6A70] dark:text-[#AAA3AC] hover:bg-[#F7F5F2] dark:hover:bg-[#1C1920] hover:text-[#171518] dark:hover:text-[#F5F1F4]'
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
