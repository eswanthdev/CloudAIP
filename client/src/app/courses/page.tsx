'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PageSpinner } from '@/components/ui/Spinner';
import CourseCard from '@/components/courses/CourseCard';
import EmptyState from '@/components/ui/EmptyState';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { Course } from '@/types';
import { BookOpen, Search, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = ['All', 'AWS', 'Azure', 'GCP', 'DevOps', 'AI/ML', 'Security', 'Data'];

export default function PublicCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    async function fetchCourses() {
      try {
        const { data } = await api.get('/courses');
        setCourses(data.data || []);
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const filtered = useMemo(() => {
    let result = courses;
    if (category !== 'All') result = result.filter((c) => c.category === category);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [courses, category, search]);

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
            <Link href="/courses" className="text-sm text-cyan font-medium">Courses</Link>
            <Link href="/services" className="text-sm text-text-muted hover:text-white transition-colors">Services</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link href="/register"><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Course Catalog</h1>
          <p className="text-text-muted max-w-xl mx-auto">
            Browse our expert-led cloud and AI training programs
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan/50"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  category === cat
                    ? 'bg-cyan/10 text-cyan border-cyan/30'
                    : 'text-text-muted border-border hover:text-white hover:border-white/20'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <PageSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon={BookOpen} title="No courses found" description="Try adjusting your search or filters" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
