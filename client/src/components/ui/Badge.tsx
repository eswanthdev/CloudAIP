'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'cyan' | 'green' | 'yellow' | 'red' | 'purple' | 'blue';
  className?: string;
}

const variantClasses = {
  default: 'bg-white/10 text-text-light',
  cyan: 'bg-cyan/10 text-cyan border-cyan/20',
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  purple: 'bg-purple/10 text-purple-400 border-purple/20',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Helper to get badge variant from status string
export function getStatusVariant(
  status: string
): 'cyan' | 'green' | 'yellow' | 'red' | 'purple' | 'blue' | 'default' {
  const map: Record<string, 'cyan' | 'green' | 'yellow' | 'red' | 'purple' | 'blue' | 'default'> = {
    active: 'cyan',
    completed: 'green',
    pending: 'yellow',
    in_review: 'blue',
    approved: 'cyan',
    in_progress: 'purple',
    rejected: 'red',
    failed: 'red',
    expired: 'red',
    new: 'cyan',
    contacted: 'blue',
    qualified: 'purple',
    proposal: 'yellow',
    won: 'green',
    lost: 'red',
    published: 'green',
    draft: 'yellow',
    refunded: 'yellow',
  };
  return map[status] || 'default';
}
