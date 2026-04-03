'use client';

import React from 'react';
import Link from 'next/link';
import { Cloud } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan to-teal flex items-center justify-center">
                <Cloud className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">CloudAIP</span>
            </div>
            <p className="text-text-muted text-sm max-w-md">
              Advance your cloud and AI skills with expert-led training programs. Enterprise cloud
              consulting and managed services for modern businesses.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/courses" className="text-sm text-text-muted hover:text-cyan transition-colors">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-sm text-text-muted hover:text-cyan transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-text-muted hover:text-cyan transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-text-muted hover:text-cyan transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-text-muted hover:text-cyan transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-text-muted hover:text-cyan transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text-muted">&copy; {new Date().getFullYear()} CloudAIP. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
