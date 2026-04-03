'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import ProgressBar from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { Enrollment } from '@/types';
import { BookOpen, Award, BarChart3, Play, ArrowRight } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await api.get('/enrollments/my');
        setEnrollments(data.data || []);
      } catch {
        // Will show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <PageSpinner />;

  const activeEnrollments = enrollments.filter((e) => e.status === 'active');
  const completedEnrollments = enrollments.filter((e) => e.status === 'completed');
  const continueWatching = activeEnrollments.filter((e) => e.progress > 0 && e.progress < 100).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-text-muted mt-1">Here&apos;s your learning overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-cyan/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-6 w-6 text-cyan" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{activeEnrollments.length}</p>
            <p className="text-sm text-text-muted">Active Courses</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <Award className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{completedEnrollments.length}</p>
            <p className="text-sm text-text-muted">Completed</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-purple/10 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {enrollments.length > 0
                ? Math.round(enrollments.reduce((acc, e) => acc + e.progress, 0) / enrollments.length)
                : 0}%
            </p>
            <p className="text-sm text-text-muted">Avg. Progress</p>
          </div>
        </Card>
      </div>

      {/* Continue Watching */}
      {continueWatching.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Continue Watching</h2>
            <Link href="/student/courses" className="text-sm text-cyan hover:text-cyan-400 transition-colors flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {continueWatching.map((enrollment) => (
              <Link key={enrollment.id} href={`/student/courses/${enrollment.courseId}`}>
                <Card hover className="group">
                  <div className="aspect-video bg-navy-800 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                    {enrollment.course.thumbnail ? (
                      <img
                        src={enrollment.course.thumbnail}
                        alt={enrollment.course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-8 w-8 text-text-muted" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <h3 className="font-medium text-white text-sm mb-2 line-clamp-1">
                    {enrollment.course.title}
                  </h3>
                  <ProgressBar value={enrollment.progress} showLabel size="sm" />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Enrolled Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">My Courses</h2>
          <Link href="/courses">
            <Button variant="outline" size="sm">Browse Courses</Button>
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            description="Start learning by browsing our course catalog"
            action={
              <Link href="/courses">
                <Button size="sm">Browse Courses</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.map((enrollment) => (
              <Link key={enrollment.id} href={`/student/courses/${enrollment.courseId}`}>
                <Card hover>
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={enrollment.status === 'completed' ? 'green' : 'cyan'}>
                      {enrollment.status}
                    </Badge>
                    <span className="text-xs text-text-muted">{enrollment.course.category}</span>
                  </div>
                  <h3 className="font-semibold text-white mb-1 line-clamp-2">{enrollment.course.title}</h3>
                  <p className="text-sm text-text-muted mb-3 line-clamp-2">
                    {enrollment.course.shortDescription || enrollment.course.description}
                  </p>
                  <ProgressBar value={enrollment.progress} showLabel size="sm" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
