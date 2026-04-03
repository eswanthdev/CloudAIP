'use client';

import React, { useState, useEffect } from 'react';
import { PageSpinner } from '@/components/ui/Spinner';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { Lead } from '@/types';
import { Target } from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

const statusOptions = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'] as const;

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      try {
        const { data } = await api.get('/admin/leads');
        setLeads(data.data || []);
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  const updateStatus = async (leadId: string, status: string) => {
    try {
      await api.patch(`/admin/leads/${leadId}`, { status });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: status as Lead['status'] } : l))
      );
      toast.success('Lead status updated');
    } catch {
      toast.error('Failed to update lead');
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Leads</h1>
        <p className="text-text-muted mt-1">Manage sales pipeline and leads</p>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statusOptions.map((status) => {
          const count = leads.filter((l) => l.status === status).length;
          return (
            <div key={status} className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-white">{count}</p>
              <Badge variant={getStatusVariant(status)} className="mt-1">
                {status}
              </Badge>
            </div>
          );
        })}
      </div>

      {leads.length === 0 ? (
        <EmptyState icon={Target} title="No leads yet" description="Leads will appear here when captured" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell><span className="font-medium text-white">{lead.name}</span></TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.company || '-'}</TableCell>
                <TableCell>{lead.source}</TableCell>
                <TableCell>
                  <select
                    value={lead.status}
                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                    className="bg-navy-900 border border-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan/50"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>{formatDate(lead.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
