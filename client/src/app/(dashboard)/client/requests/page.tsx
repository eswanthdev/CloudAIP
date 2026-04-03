'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PageSpinner } from '@/components/ui/Spinner';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { ServiceRequest } from '@/types';
import { FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ClientRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

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

  const filtered = useMemo(() => {
    if (activeTab === 'all') return requests;
    return requests.filter((r) => r.status === activeTab);
  }, [requests, activeTab]);

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
        <p className="text-text-muted mt-1">Track all your service requests</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No requests found" description="No service requests match the current filter" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Timeline</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((req) => (
              <TableRow key={req.id} onClick={() => window.location.href = `/client/requests/${req.id}`}>
                <TableCell>
                  <span className="font-medium text-white">{req.service?.title || 'Service Request'}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(req.status)}>{req.status.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell>{req.budget || '-'}</TableCell>
                <TableCell>{req.timeline || '-'}</TableCell>
                <TableCell>{formatDate(req.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
