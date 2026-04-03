'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import api from '@/lib/api';
import { DashboardStats, ActivityItem } from '@/types';
import { Users, BookOpen, DollarSign, Target, TrendingUp, Clock } from 'lucide-react';
import { formatRelativeTime, formatCurrency } from '@/lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data } = await api.get('/admin/dashboard');
        setStats(data.data);
      } catch {
        // Use defaults
        setStats({
          totalUsers: 0,
          totalEnrollments: 0,
          totalRevenue: 0,
          totalLeads: 0,
          recentActivity: [],
        });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <PageSpinner />;

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-cyan',
      bg: 'bg-cyan/10',
    },
    {
      title: 'Enrollments',
      value: stats?.totalEnrollments ?? 0,
      icon: BookOpen,
      color: 'text-purple-400',
      bg: 'bg-purple/10',
    },
    {
      title: 'Revenue',
      value: formatCurrency(stats?.totalRevenue ?? 0),
      icon: DollarSign,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Leads',
      value: stats?.totalLeads ?? 0,
      icon: Target,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-text-muted mt-1">Overview of platform metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-text-muted">{stat.title}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <Clock className="h-5 w-5 text-text-muted" />
        </div>
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="h-8 w-8 rounded-full bg-cyan/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-cyan" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-light">{activity.message}</p>
                  <p className="text-xs text-text-muted">{formatRelativeTime(activity.timestamp)}</p>
                </div>
                <Badge variant={getStatusVariant(activity.type)}>{activity.type}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm py-4 text-center">No recent activity</p>
        )}
      </Card>
    </div>
  );
}
