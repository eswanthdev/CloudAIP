'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageSpinner } from '@/components/ui/Spinner';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { Course } from '@/types';
import { BookOpen, Plus, Eye, EyeOff } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const { data } = await api.get('/admin/courses');
        setCourses(data.data || []);
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const togglePublish = async (courseId: string, published: boolean) => {
    try {
      await api.patch(`/admin/courses/${courseId}`, { published: !published });
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, published: !published } : c))
      );
      toast.success(published ? 'Course unpublished' : 'Course published');
    } catch {
      toast.error('Failed to update course');
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Courses</h1>
          <p className="text-text-muted mt-1">Manage training courses</p>
        </div>
        <Link href="/admin/courses/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add Course
          </Button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses"
          description="Create your first course to get started"
          action={
            <Link href="/admin/courses/new">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Add Course
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Enrollments</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell>
                  <span className="font-medium text-white">{course.title}</span>
                </TableCell>
                <TableCell>
                  <Badge>{course.category}</Badge>
                </TableCell>
                <TableCell>{formatCurrency(course.price)}</TableCell>
                <TableCell>{course.enrollmentCount}</TableCell>
                <TableCell>
                  <Badge variant={course.published ? 'green' : 'yellow'}>
                    {course.published ? 'Published' : 'Draft'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => togglePublish(course.id, course.published)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                    title={course.published ? 'Unpublish' : 'Publish'}
                  >
                    {course.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
