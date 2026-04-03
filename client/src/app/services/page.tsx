'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageSpinner } from '@/components/ui/Spinner';
import ServiceCard from '@/components/services/ServiceCard';
import EmptyState from '@/components/ui/EmptyState';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { Service } from '@/types';
import { Briefcase, Cloud } from 'lucide-react';

export default function PublicServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      try {
        const { data } = await api.get('/services');
        setServices(data.data || []);
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

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
          <div className="hidden md:flex items-center gap-8">
            <Link href="/courses" className="text-sm text-text-muted hover:text-white transition-colors">Courses</Link>
            <Link href="/services" className="text-sm text-cyan font-medium">Services</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link href="/register"><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Cloud Services</h1>
          <p className="text-text-muted max-w-xl mx-auto">
            Enterprise-grade cloud consulting, migration, and managed services
          </p>
        </div>

        {loading ? (
          <PageSpinner />
        ) : services.length === 0 ? (
          <EmptyState icon={Briefcase} title="No services available" description="Services will be listed here soon" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
