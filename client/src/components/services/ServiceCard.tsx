'use client';

import React from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Service } from '@/types';
import { ArrowRight, Server } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Link href={`/services/${service.id}`}>
      <Card hover className="h-full flex flex-col group">
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan/20 to-purple/20 border border-cyan/20 flex items-center justify-center mb-4">
          <Server className="h-6 w-6 text-cyan" />
        </div>

        <Badge variant="cyan" className="mb-3 self-start">{service.category}</Badge>

        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan transition-colors">
          {service.title}
        </h3>
        <p className="text-sm text-text-muted line-clamp-3 mb-4 flex-1">
          {service.shortDescription || service.description}
        </p>

        {service.features.length > 0 && (
          <ul className="space-y-1 mb-4">
            {service.features.slice(0, 3).map((feature, i) => (
              <li key={i} className="text-xs text-text-light flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-cyan flex-shrink-0" />
                {feature}
              </li>
            ))}
            {service.features.length > 3 && (
              <li className="text-xs text-text-muted">+{service.features.length - 3} more</li>
            )}
          </ul>
        )}

        <div className="pt-3 border-t border-border flex items-center justify-between">
          <span className="text-sm font-medium text-white">
            {service.pricing || 'Custom pricing'}
          </span>
          <ArrowRight className="h-4 w-4 text-cyan group-hover:translate-x-1 transition-transform" />
        </div>
      </Card>
    </Link>
  );
}
