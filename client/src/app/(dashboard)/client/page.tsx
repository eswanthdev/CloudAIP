'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { ServiceRequest } from '@/types';
import { FileText, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const { data } = await api.get('/service-requests/my');
        setRequests(data.data || []);
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  if (loading) return <PageSpinner />;

  const pending = requests.filter((r) => ['pending', 'in_review'].includes(r.status));
  const inProgress = requests.filter((r) => ['approved', 'in_progress'].includes(r.status));
  const completed = requests.filter((r) => r.status === 'completed');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome, {user?.name?.split(' ')[0]}</h1>
        <p className="text-text-muted mt-1">Manage your service requests and projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
            <Clock className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{pending.length}</p>
            <p className="text-sm text-text-muted">Pending</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-purple/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{inProgress.length}</p>
            <p className="text-sm text-text-muted">In Progress</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{completed.length}</p>
            <p className="text-sm text-text-muted">Completed</p>
          </div>
        </Card>
      </div>

      {/* Recent Requests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Requests</h2>
          <Link href="/client/requests" className="text-sm text-cyan hover:text-cyan-400 flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No service requests"
            description="Submit a request to get started with our services"
            action={
              <Link href="/services">
                <Button size="sm">Browse Services</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {requests.slice(0, 5).map((req) => (
              <Link key={req.id} href={`/client/requests/${req.id}`}>
                <Card hover className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white text-sm">{req.service?.title || 'Service Request'}</h3>
                    <p className="text-xs text-text-muted mt-1">{formatRelativeTime(req.createdAt)}</p>
                  </div>
                  <Badge variant={getStatusVariant(req.status)}>
                    {req.status.replace('_', ' ')}
                  </Badge>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
