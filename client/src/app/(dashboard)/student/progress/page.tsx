'use client';

import React, { useState, useEffect } from 'react';
import { PageSpinner } from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { Enrollment } from '@/types';
import { BarChart3, BookOpen, Clock, TrendingUp } from 'lucide-react';

export default function ProgressPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await api.get('/enrollments/my');
        setEnrollments(data.data || []);
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <PageSpinner />;

  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter((e) => e.status === 'completed').length;
  const avgProgress = totalCourses > 0 ? Math.round(enrollments.reduce((acc, e) => acc + e.progress, 0) / totalCourses) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Progress</h1>
        <p className="text-text-muted mt-1">Track your overall learning progress</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-cyan/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-cyan" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{totalCourses}</p>
            <p className="text-xs text-text-muted">Enrolled Courses</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{completedCourses}</p>
            <p className="text-xs text-text-muted">Completed</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{avgProgress}%</p>
            <p className="text-xs text-text-muted">Avg. Progress</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{totalCourses - completedCourses}</p>
            <p className="text-xs text-text-muted">In Progress</p>
          </div>
        </Card>
      </div>

      {/* Overall Progress Bar */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Overall Completion</h2>
        <ProgressBar value={avgProgress} showLabel size="lg" />
      </Card>

      {/* Per-Course Progress */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Course Progress</h2>
        {enrollments.length === 0 ? (
          <EmptyState icon={BarChart3} title="No courses yet" description="Enroll in courses to start tracking your progress" />
        ) : (
          <div className="space-y-3">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id} className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white text-sm truncate">{enrollment.course.title}</h3>
                  <p className="text-xs text-text-muted">{enrollment.course.category} &bull; {enrollment.course.totalLessons} lessons</p>
                </div>
                <div className="sm:w-48 flex-shrink-0">
                  <ProgressBar value={enrollment.progress} showLabel size="sm" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
