'use client';

import React, { useState, useEffect } from 'react';
import { PageSpinner } from '@/components/ui/Spinner';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Tabs from '@/components/ui/Tabs';
import api from '@/lib/api';
import { ServiceRequest } from '@/types';
import { FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const allStatuses = ['pending', 'in_review', 'approved', 'in_progress', 'completed', 'rejected'] as const;

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    async function fetchRequests() {
      try {
        const { data } = await api.get('/admin/service-requests');
        setRequests(data.data || []);
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const filtered = activeTab === 'all' ? requests : requests.filter((r) => r.status === activeTab);

  const updateStatus = async (requestId: string, status: string) => {
    try {
      await api.patch(`/admin/service-requests/${requestId}`, { status });
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: status as ServiceRequest['status'] } : r))
      );
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const tabs = [
    { id: 'all', label: 'All', count: requests.length },
    { id: 'pending', label: 'Pending', count: requests.filter((r) => r.status === 'pending').length },
    { id: 'in_progress', label: 'In Progress', count: requests.filter((r) => r.status === 'in_progress').length },
    { id: 'completed', label: 'Completed', count: requests.filter((r) => r.status === 'completed').length },
  ];

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Service Requests</h1>
        <p className="text-text-muted mt-1">Manage all client service requests</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No requests" description="No service requests match this filter" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((req) => (
              <TableRow key={req.id}>
                <TableCell>
                  <span className="font-medium text-white">{req.user?.name || 'Unknown'}</span>
                </TableCell>
                <TableCell>{req.service?.title || '-'}</TableCell>
                <TableCell>{req.budget || '-'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(req.status)}>{req.status.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell>{formatDate(req.createdAt)}</TableCell>
                <TableCell>
                  <select
                    value={req.status}
                    onChange={(e) => updateStatus(req.id, e.target.value)}
                    className="bg-navy-900 border border-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan/50"
                  >
                    {allStatuses.map((s) => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
