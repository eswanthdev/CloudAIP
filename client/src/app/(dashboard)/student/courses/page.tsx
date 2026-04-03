'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PageSpinner } from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import Tabs from '@/components/ui/Tabs';
import api from '@/lib/api';
import { Enrollment } from '@/types';
import { BookOpen, Search } from 'lucide-react';

export default function StudentCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    async function fetchEnrollments() {
      try {
        const { data } = await api.get('/enrollments/my');
        setEnrollments(data.data || []);
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    fetchEnrollments();
  }, []);

  const filtered = useMemo(() => {
    let result = enrollments;
    if (activeTab !== 'all') {
      result = result.filter((e) => e.status === activeTab);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.course.title.toLowerCase().includes(q) ||
          e.course.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [enrollments, activeTab, search]);

  const tabs = [
    { id: 'all', label: 'All', count: enrollments.length },
    { id: 'active', label: 'Active', count: enrollments.filter((e) => e.status === 'active').length },
    { id: 'completed', label: 'Completed', count: enrollments.filter((e) => e.status === 'completed').length },
  ];

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Courses</h1>
        <p className="text-text-muted mt-1">Manage and track your enrolled courses</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-navy-900 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan/50"
          />
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description={search ? 'Try adjusting your search' : 'You have not enrolled in any courses yet'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((enrollment) => (
            <Link key={enrollment.id} href={`/student/courses/${enrollment.courseId}`}>
              <Card hover className="h-full flex flex-col">
                <div className="aspect-video bg-navy-800 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                  {enrollment.course.thumbnail ? (
                    <img src={enrollment.course.thumbnail} alt={enrollment.course.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="h-8 w-8 text-text-muted" />
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={enrollment.status === 'completed' ? 'green' : 'cyan'}>
                    {enrollment.status}
                  </Badge>
                  <Badge>{enrollment.course.category}</Badge>
                </div>
                <h3 className="font-semibold text-white mb-1 line-clamp-2 flex-1">{enrollment.course.title}</h3>
                <div className="mt-3">
                  <ProgressBar value={enrollment.progress} showLabel size="sm" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
