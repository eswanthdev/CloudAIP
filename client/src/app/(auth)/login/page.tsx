'use client';

import React from 'react';
import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';
import { Cloud } from 'lucide-react';

export default function LoginPage() {
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
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-text-muted mt-1">Sign in to your account to continue</p>
          </div>

          <LoginForm />

          <p className="text-center text-sm text-text-muted mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-cyan hover:text-cyan-400 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
