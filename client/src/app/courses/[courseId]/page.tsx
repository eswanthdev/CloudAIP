'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageSpinner } from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ModuleAccordion from '@/components/courses/ModuleAccordion';
import Footer from '@/components/layout/Footer';
import api from '@/lib/api';
import { Course } from '@/types';
import { Cloud, Clock, BookOpen, Users, Star, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function PublicCourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const { data } = await api.get(`/courses/${courseId}`);
        setCourse(data.data);
      } catch {
        // handle
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [courseId]);

  if (loading) return <PageSpinner />;
  if (!course) return <div className="text-text-muted text-center py-20">Course not found</div>;

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
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link href="/register"><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/courses" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-cyan transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="cyan">{course.category}</Badge>
                <Badge>{course.level}</Badge>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">{course.title}</h1>
              <p className="text-text-muted">{course.description}</p>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-6 text-sm text-text-muted">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {course.duration} hours
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {course.totalLessons} lessons
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {course.enrollmentCount} enrolled
              </div>
              {course.averageRating > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-400" />
                  {course.averageRating.toFixed(1)}
                </div>
              )}
            </div>

            {/* Modules Preview */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Course Content</h2>
              <div className="space-y-3">
                {course.modules?.map((module) => (
                  <ModuleAccordion key={module.id} module={module} courseId={courseId} isEnrolled={false} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Enroll CTA */}
          <div>
            <Card className="sticky top-20">
              {course.thumbnail && (
                <div className="aspect-video bg-navy-800 rounded-lg mb-4 overflow-hidden">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="text-3xl font-bold text-white mb-1">
                {course.price === 0 ? 'Free' : formatCurrency(course.price)}
              </div>
              <p className="text-sm text-text-muted mb-4">Lifetime access</p>
              <Link href="/register">
                <Button className="w-full" size="lg">
                  Enroll Now
                </Button>
              </Link>
              <ul className="mt-4 space-y-2 text-sm text-text-light">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-cyan" />
                  {course.duration} hours of content
                </li>
                <li className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-cyan" />
                  {course.totalModules} modules, {course.totalLessons} lessons
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-cyan" />
                  Certificate of completion
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
