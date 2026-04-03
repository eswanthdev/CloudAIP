'use client';

import React from 'react';
import Link from 'next/link';
import RegisterForm from '@/components/auth/RegisterForm';
import { Cloud } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan to-teal flex items-center justify-center">
            <Cloud className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">CloudAIP</span>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-text-muted mt-1">Start your cloud learning journey</p>
          </div>

          <RegisterForm />

          <p className="text-center text-sm text-text-muted mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-cyan hover:text-cyan-400 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
