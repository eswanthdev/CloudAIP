'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageSpinner } from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LeadCaptureForm from '@/components/services/LeadCaptureForm';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { Service } from '@/types';
import { Cloud, ArrowLeft, CheckCircle } from 'lucide-react';

export default function PublicServiceDetailPage() {
  const params = useParams();
  const serviceId = params.serviceId as string;
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchService() {
      try {
        const { data } = await api.get(`/services/${serviceId}`);
        setService(data.data);
      } catch {
        // handle
      } finally {
        setLoading(false);
      }
    }
    fetchService();
  }, [serviceId]);

  if (loading) return <PageSpinner />;
  if (!service) return <div className="text-text-muted text-center py-20">Service not found</div>;

  return (
    <div className="min-h-screen bg-primary">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-primary/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan to-teal flex items-center justify-center">
              <Cloud className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CloudAIP</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link href="/register"><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/services" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-cyan transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Services
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Badge variant="cyan" className="mb-3">{service.category}</Badge>
              <h1 className="text-3xl font-bold text-white mb-3">{service.title}</h1>
              <p className="text-text-muted leading-relaxed">{service.description}</p>
            </div>

            {service.features.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">What&apos;s Included</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {service.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-cyan flex-shrink-0 mt-0.5" />
                      <span className="text-text-light text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {service.pricing && (
              <Card>
                <h2 className="text-sm font-semibold text-text-muted mb-1">Starting at</h2>
                <p className="text-2xl font-bold text-white">{service.pricing}</p>
              </Card>
            )}
          </div>

          {/* Lead Capture Sidebar */}
          <div>
            <Card className="sticky top-20">
              <h2 className="text-lg font-semibold text-white mb-1">Get Started</h2>
              <p className="text-sm text-text-muted mb-4">
                Tell us about your project and we&apos;ll get back to you within 24 hours
              </p>
              <LeadCaptureForm serviceId={serviceId} serviceTitle={service.title} />
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
