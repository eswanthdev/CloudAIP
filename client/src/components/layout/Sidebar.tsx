'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Award,
  Users,
  Briefcase,
  FileText,
  Settings,
  DollarSign,
  Target,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Server,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const studentNav: NavItem[] = [
  { label: 'Dashboard', href: '/student', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'My Courses', href: '/student/courses', icon: <BookOpen className="h-5 w-5" /> },
  { label: 'Progress', href: '/student/progress', icon: <BarChart3 className="h-5 w-5" /> },
  { label: 'Certificates', href: '/student/certificates', icon: <Award className="h-5 w-5" /> },
];

const clientNav: NavItem[] = [
  { label: 'Dashboard', href: '/client', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Services', href: '/client/services', icon: <Server className="h-5 w-5" /> },
  { label: 'My Requests', href: '/client/requests', icon: <FileText className="h-5 w-5" /> },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Users', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
  { label: 'Courses', href: '/admin/courses', icon: <BookOpen className="h-5 w-5" /> },
  { label: 'Services', href: '/admin/services', icon: <Briefcase className="h-5 w-5" /> },
  { label: 'Requests', href: '/admin/requests', icon: <FileText className="h-5 w-5" /> },
  { label: 'Leads', href: '/admin/leads', icon: <Target className="h-5 w-5" /> },
  { label: 'Payments', href: '/admin/payments', icon: <DollarSign className="h-5 w-5" /> },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, isAdmin, isStudent, isClient } = useAuth();

  const navItems = isAdmin ? adminNav : isClient ? clientNav : studentNav;

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen sticky top-0 bg-card border-r border-border transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan to-teal flex items-center justify-center flex-shrink-0">
          <Cloud className="h-5 w-5 text-white" />
        </div>
        {!collapsed && <span className="text-lg font-bold text-white">CloudAIP</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-cyan/10 text-cyan border border-cyan/20'
                  : 'text-text-muted hover:text-white hover:bg-white/5'
              )}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div className="px-3 py-3 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </aside>
  );
}
