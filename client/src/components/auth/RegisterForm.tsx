'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'client'>('student');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register } = useAuth();
  const router = useRouter();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email address';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register({ name, email, password, role });
      router.push(`/${role}`);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Full Name"
        type="text"
        placeholder="John Doe"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
      />

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />

      <Input
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />

      <Input
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
      />

      {/* Role Selector */}
      <div>
        <label className="block text-sm font-medium text-text-light mb-2">I want to</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={cn(
              'px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-200 text-center',
              role === 'student'
                ? 'border-cyan bg-cyan/10 text-cyan'
                : 'border-border text-text-muted hover:border-cyan/30 hover:text-white'
            )}
          >
            Learn Skills
          </button>
          <button
            type="button"
            onClick={() => setRole('client')}
            className={cn(
              'px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-200 text-center',
              role === 'client'
                ? 'border-cyan bg-cyan/10 text-cyan'
                : 'border-border text-text-muted hover:border-cyan/30 hover:text-white'
            )}
          >
            Get Services
          </button>
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Create Account
      </Button>
    </form>
  );
}
