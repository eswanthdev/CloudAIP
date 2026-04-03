'use client';

import React, { useState, useEffect } from 'react';
import { PageSpinner } from '@/components/ui/Spinner';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { Service } from '@/types';
import { Briefcase, Plus, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      try {
        const { data } = await api.get('/admin/services');
        setServices(data.data || []);
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  const togglePublish = async (serviceId: string, published: boolean) => {
    try {
      await api.patch(`/admin/services/${serviceId}`, { published: !published });
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, published: !published } : s))
      );
      toast.success(published ? 'Service unpublished' : 'Service published');
    } catch {
      toast.error('Failed to update service');
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Services</h1>
          <p className="text-text-muted mt-1">Manage cloud services offerings</p>
        </div>
      </div>

      {services.length === 0 ? (
        <EmptyState icon={Briefcase} title="No services" description="No services have been created yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Pricing</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell><span className="font-medium text-white">{service.title}</span></TableCell>
                <TableCell><Badge>{service.category}</Badge></TableCell>
                <TableCell>{service.pricing || 'Custom'}</TableCell>
                <TableCell>
                  <Badge variant={service.published ? 'green' : 'yellow'}>
                    {service.published ? 'Published' : 'Draft'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => togglePublish(service.id, service.published)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                  >
                    {service.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
