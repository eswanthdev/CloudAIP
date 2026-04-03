'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export default function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 border-b border-border', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px',
            activeTab === tab.id
              ? 'text-cyan border-cyan'
              : 'text-text-muted border-transparent hover:text-white hover:border-white/20'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                'ml-2 px-1.5 py-0.5 rounded-full text-xs',
                activeTab === tab.id ? 'bg-cyan/20 text-cyan' : 'bg-white/10 text-text-muted'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

interface TabContentProps {
  children: React.ReactNode;
  className?: string;
}

export function TabContent({ children, className }: TabContentProps) {
  return <div className={cn('mt-4 animate-fade-in', className)}>{children}</div>;
}
