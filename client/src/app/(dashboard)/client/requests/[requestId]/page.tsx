'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageSpinner } from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import api from '@/lib/api';
import { ServiceRequest } from '@/types';
import { formatDate } from '@/lib/utils';
import { CheckCircle, Circle, Clock, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const statusSteps = ['pending', 'in_review', 'approved', 'in_progress', 'completed'];
const statusLabels: Record<string, string> = {
  pending: 'Submitted',
  in_review: 'In Review',
  approved: 'Approved',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = params.requestId as string;
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequest() {
      try {
        const { data } = await api.get(`/service-requests/${requestId}`);
        setRequest(data.data);
      } catch {
        // handle
      } finally {
        setLoading(false);
      }
    }
    fetchRequest();
  }, [requestId]);

  if (loading) return <PageSpinner />;
  if (!request) return <div className="text-text-muted text-center py-20">Request not found</div>;

  const currentStepIndex = request.status === 'rejected'
    ? -1
    : statusSteps.indexOf(request.status);

  return (
    <div className="space-y-6">
      <Link href="/client/requests" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-cyan transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Requests
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{request.service?.title || 'Service Request'}</h1>
          <p className="text-text-muted mt-1">Submitted on {formatDate(request.createdAt)}</p>
        </div>
        <Badge variant={getStatusVariant(request.status)} className="text-sm px-3 py-1">
          {request.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Status Timeline */}
      {request.status !== 'rejected' && (
        <Card>
          <h2 className="text-sm font-semibold text-white mb-6">Progress Timeline</h2>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={step} className="flex flex-col items-center flex-1 relative">
                  {index > 0 && (
                    <div
                      className={cn(
                        'absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2',
                        index <= currentStepIndex ? 'bg-cyan' : 'bg-border'
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      'relative z-10 h-8 w-8 rounded-full flex items-center justify-center',
                      isCompleted
                        ? 'bg-cyan text-white'
                        : 'bg-navy-800 border border-border text-text-muted'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs mt-2 text-center',
                      isCurrent ? 'text-cyan font-medium' : 'text-text-muted'
                    )}
                  >
                    {statusLabels[step]}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-sm font-semibold text-white mb-3">Request Details</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-text-muted">Requirements</dt>
              <dd className="text-sm text-text-light mt-1">{request.requirements}</dd>
            </div>
            {request.budget && (
              <div>
                <dt className="text-xs text-text-muted">Budget</dt>
                <dd className="text-sm text-text-light mt-1">{request.budget}</dd>
              </div>
            )}
            {request.timeline && (
              <div>
                <dt className="text-xs text-text-muted">Timeline</dt>
                <dd className="text-sm text-text-light mt-1">{request.timeline}</dd>
              </div>
            )}
          </dl>
        </Card>
        {request.adminNotes && (
          <Card>
            <h2 className="text-sm font-semibold text-white mb-3">Admin Notes</h2>
            <p className="text-sm text-text-light">{request.adminNotes}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
