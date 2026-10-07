'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: readonly TabItem[] | TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  layoutId?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
  layoutId = 'active-tab-indicator',
}: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-2xl bg-[#FFFFFF] dark:bg-[#151319] border border-[#E8E3E6] dark:border-[#29252C]',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors select-none z-10 cursor-pointer min-h-[38px]',
              isActive
                ? 'text-[#171518] dark:text-[#F5F1F4]'
                : 'text-[#6F6A70] hover:text-[#171518] dark:text-[#AAA3AC] dark:hover:text-[#F5F1F4]'
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
                className="absolute inset-0 rounded-xl bg-[#EEDCE4]/70 dark:bg-[#3A2934] -z-10 shadow-xs"
              />
            )}
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#B96F91]/15 text-[#B96F91] dark:bg-[#D59AB6]/20 dark:text-[#D59AB6]">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
