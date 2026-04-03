'use client';

import React from 'react';
import Link from 'next/link';
import { Cloud, BookOpen, Briefcase, ArrowRight, Zap, Shield, BarChart3 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-primary">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-primary/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan to-teal flex items-center justify-center">
              <Cloud className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CloudAIP</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/courses" className="text-sm text-text-muted hover:text-white transition-colors">
              Courses
            </Link>
            <Link href="/services" className="text-sm text-text-muted hover:text-white transition-colors">
              Services
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan/5 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan/10 border border-cyan/20 text-cyan text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Cloud & AI Training Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Master Cloud & AI with{' '}
              <span className="bg-gradient-to-r from-cyan to-teal bg-clip-text text-transparent">
                Expert-Led Training
              </span>
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto mb-10">
              Advance your career with industry-leading cloud training programs. From AWS to Azure,
              AI/ML to DevOps — get certified and job-ready with CloudAIP.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/courses">
                <Button size="lg" className="min-w-[200px]">
                  <BookOpen className="h-5 w-5" />
                  Browse Courses
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="outline" size="lg" className="min-w-[200px]">
                  <Briefcase className="h-5 w-5" />
                  Our Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-4">Why CloudAIP?</h2>
            <p className="text-text-muted max-w-xl mx-auto">
              We combine expert instruction, hands-on labs, and real-world projects to accelerate your cloud career.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: 'Expert-Led Courses',
                description: 'Learn from certified cloud architects and AI engineers with real industry experience.',
              },
              {
                icon: Shield,
                title: 'Certification Prep',
                description: 'Comprehensive preparation for AWS, Azure, GCP, and AI/ML certifications.',
              },
              {
                icon: BarChart3,
                title: 'Track Your Progress',
                description: 'Monitor your learning journey with detailed progress tracking and analytics.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-6 hover:border-cyan/30 hover:shadow-cyan-glow transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-lg bg-cyan/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-cyan" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-text-muted text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to start your cloud journey?</h2>
          <p className="text-text-muted mb-8 max-w-xl mx-auto">
            Join thousands of professionals who have advanced their careers with CloudAIP training programs.
          </p>
          <Link href="/register">
            <Button size="lg">
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
