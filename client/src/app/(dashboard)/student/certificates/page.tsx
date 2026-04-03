'use client';

import React, { useState, useEffect } from 'react';
import { PageSpinner } from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { Certificate } from '@/types';
import { Award, Download, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCertificates() {
      try {
        const { data } = await api.get('/certificates/my');
        setCertificates(data.data || []);
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    fetchCertificates();
  }, []);

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Certificates</h1>
        <p className="text-text-muted mt-1">View and download your earned certificates</p>
      </div>

      {certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Complete a course to earn your first certificate"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <Card key={cert.id} className="flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan/20 to-purple/20 border border-cyan/30 flex items-center justify-center">
                  <Award className="h-6 w-6 text-cyan" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-sm line-clamp-1">{cert.course.title}</h3>
                  <p className="text-xs text-text-muted">#{cert.certificateNumber}</p>
                </div>
              </div>
              <p className="text-sm text-text-muted mb-4">
                Issued on {formatDate(cert.issuedAt)}
              </p>
              <div className="mt-auto flex gap-2">
                <a href={cert.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
