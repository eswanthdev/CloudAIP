'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { X, Cloud, LayoutDashboard, BookOpen, BarChart3, Award, Briefcase, FileText, Users, Target, DollarSign, Server } from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const studentNav = [
  { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
  { label: 'My Courses', href: '/student/courses', icon: BookOpen },
  { label: 'Progress', href: '/student/progress', icon: BarChart3 },
  { label: 'Certificates', href: '/student/certificates', icon: Award },
];

const clientNav = [
  { label: 'Dashboard', href: '/client', icon: LayoutDashboard },
  { label: 'Services', href: '/client/services', icon: Server },
  { label: 'My Requests', href: '/client/requests', icon: FileText },
];

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Courses', href: '/admin/courses', icon: BookOpen },
  { label: 'Services', href: '/admin/services', icon: Briefcase },
  { label: 'Requests', href: '/admin/requests', icon: FileText },
  { label: 'Leads', href: '/admin/leads', icon: Target },
  { label: 'Payments', href: '/admin/payments', icon: DollarSign },
];

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { isAdmin, isClient } = useAuth();

  const navItems = isAdmin ? adminNav : isClient ? clientNav : studentNav;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan to-teal flex items-center justify-center">
              <Cloud className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">CloudAIP</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-cyan/10 text-cyan border border-cyan/20'
                    : 'text-text-muted hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
