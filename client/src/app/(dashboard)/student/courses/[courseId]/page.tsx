'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageSpinner } from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import Button from '@/components/ui/Button';
import ModuleAccordion from '@/components/courses/ModuleAccordion';
import api from '@/lib/api';
import { Course, Enrollment, Progress } from '@/types';
import { Clock, BookOpen, BarChart3 } from 'lucide-react';

export default function StudentCourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [courseRes, enrollRes, progressRes] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get(`/enrollments/my/${courseId}`),
          api.get(`/progress/course/${courseId}`),
        ]);
        setCourse(courseRes.data.data);
        setEnrollment(enrollRes.data.data);
        const completed = new Set<string>(
          (progressRes.data.data || [])
            .filter((p: Progress) => p.completed)
            .map((p: Progress) => p.lessonId)
        );
        setCompletedLessons(completed);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [courseId]);

  if (loading) return <PageSpinner />;
  if (!course) return <div className="text-text-muted text-center py-20">Course not found</div>;

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="cyan">{course.category}</Badge>
          <Badge>{course.level}</Badge>
        </div>
        <h1 className="text-2xl font-bold text-white">{course.title}</h1>
        <p className="text-text-muted mt-1">{course.description}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-cyan" />
          <div>
            <p className="text-sm text-text-muted">Duration</p>
            <p className="text-white font-medium">{course.duration}h</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-cyan" />
          <div>
            <p className="text-sm text-text-muted">Lessons</p>
            <p className="text-white font-medium">{course.totalLessons}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-cyan" />
          <div>
            <p className="text-sm text-text-muted">Progress</p>
            <p className="text-white font-medium">{enrollment?.progress ?? 0}%</p>
          </div>
        </Card>
      </div>

      {/* Progress Bar */}
      {enrollment && (
        <Card>
          <ProgressBar value={enrollment.progress} showLabel size="lg" />
        </Card>
      )}

      {/* Modules */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Course Content</h2>
        <div className="space-y-3">
          {course.modules?.map((module) => (
            <ModuleAccordion
              key={module.id}
              module={module}
              courseId={courseId}
              completedLessons={completedLessons}
              isEnrolled
            />
          ))}
        </div>
      </div>
    </div>
  );
}
