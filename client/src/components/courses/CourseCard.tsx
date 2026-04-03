'use client';

import React from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { Course } from '@/types';
import { Clock, BookOpen, Users, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CourseCardProps {
  course: Course;
  progress?: number;
  enrolled?: boolean;
}

export default function CourseCard({ course, progress, enrolled = false }: CourseCardProps) {
  const href = enrolled ? `/student/courses/${course.id}` : `/courses/${course.id}`;

  return (
    <Link href={href}>
      <Card hover className="h-full flex flex-col group">
        {/* Thumbnail */}
        <div className="aspect-video bg-navy-800 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <BookOpen className="h-10 w-10 text-text-muted" />
          )}
        </div>

        {/* Category + Level */}
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="cyan">{course.category}</Badge>
          <Badge>{course.level}</Badge>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-white mb-1 line-clamp-2 flex-1">
          {course.title}
        </h3>
        <p className="text-sm text-text-muted line-clamp-2 mb-3">
          {course.shortDescription || course.description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {course.duration}h
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {course.totalLessons} lessons
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {course.enrollmentCount}
          </span>
        </div>

        {/* Price or Progress */}
        {progress !== undefined ? (
          <ProgressBar value={progress} showLabel size="sm" />
        ) : (
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <span className="text-lg font-bold text-white">
              {course.price === 0 ? 'Free' : formatCurrency(course.price)}
            </span>
            {course.averageRating > 0 && (
              <span className="flex items-center gap-1 text-sm text-yellow-400">
                <Star className="h-4 w-4 fill-current" />
                {course.averageRating.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}
