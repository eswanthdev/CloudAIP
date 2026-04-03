'use client';

import React, { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';

interface LeadCaptureFormProps {
  serviceId: string;
  serviceTitle: string;
}

export default function LeadCaptureForm({ serviceId, serviceTitle }: LeadCaptureFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    cloudSpend: '',
    requirements: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.requirements) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/leads', {
        ...form,
        source: `service:${serviceId}`,
        serviceTitle,
      });
      setSubmitted(true);
      toast.success('Request submitted successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">Thank you!</h3>
        <p className="text-sm text-text-muted">
          We&apos;ve received your request and will get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full Name *"
        name="name"
        placeholder="John Doe"
        value={form.name}
        onChange={handleChange}
      />
      <Input
        label="Work Email *"
        name="email"
        type="email"
        placeholder="john@company.com"
        value={form.email}
        onChange={handleChange}
      />
      <Input
        label="Company"
        name="company"
        placeholder="Company name"
        value={form.company}
        onChange={handleChange}
      />
      <div>
        <label className="block text-sm font-medium text-text-light mb-1.5">Monthly Cloud Spend</label>
        <select
          name="cloudSpend"
          value={form.cloudSpend}
          onChange={handleChange}
          className="w-full bg-navy-900 border border-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan/50"
        >
          <option value="">Select range</option>
          <option value="<$5k">Less than $5,000</option>
          <option value="$5k-$25k">$5,000 - $25,000</option>
          <option value="$25k-$100k">$25,000 - $100,000</option>
          <option value="$100k+">$100,000+</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-light mb-1.5">Requirements *</label>
        <textarea
          name="requirements"
          rows={3}
          placeholder="Tell us about your project requirements..."
          value={form.requirements}
          onChange={handleChange}
          className="w-full bg-navy-900 border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan/50 resize-none"
        />
      </div>
      <Button type="submit" loading={loading} className="w-full">
        Submit Request
      </Button>
    </form>
  );
}
