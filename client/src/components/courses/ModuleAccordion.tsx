'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Module } from '@/types';
import { ChevronDown, PlayCircle, CheckCircle, Lock, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleAccordionProps {
  module: Module;
  courseId: string;
  completedLessons?: Set<string>;
  isEnrolled: boolean;
}

export default function ModuleAccordion({
  module,
  courseId,
  completedLessons = new Set(),
  isEnrolled,
}: ModuleAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const completedCount = module.lessons.filter((l) => completedLessons.has(l.id)).length;
  const totalDuration = module.lessons.reduce((acc, l) => acc + l.duration, 0);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <ChevronDown
            className={cn('h-5 w-5 text-text-muted transition-transform', isOpen && 'rotate-180')}
          />
          <div>
            <h3 className="font-medium text-white text-sm">{module.title}</h3>
            <p className="text-xs text-text-muted mt-0.5">
              {module.lessons.length} lessons &bull; {totalDuration}m
              {isEnrolled && completedCount > 0 && ` &bull; ${completedCount}/${module.lessons.length} completed`}
            </p>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border divide-y divide-border">
          {module.lessons.map((lesson) => {
            const isDone = completedLessons.has(lesson.id);
            const content = (
              <div className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                {isEnrolled ? (
                  isDone ? (
                    <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <PlayCircle className="h-4 w-4 text-cyan flex-shrink-0" />
                  )
                ) : lesson.isFree ? (
                  <PlayCircle className="h-4 w-4 text-cyan flex-shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 text-text-muted flex-shrink-0" />
                )}
                <span className={cn('text-sm flex-1', isDone ? 'text-text-muted' : 'text-text-light')}>
                  {lesson.title}
                </span>
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lesson.duration}m
                </span>
              </div>
            );

            if (isEnrolled) {
              return (
                <Link key={lesson.id} href={`/student/courses/${courseId}/lessons/${lesson.id}`}>
                  {content}
                </Link>
              );
            }
            return <div key={lesson.id}>{content}</div>;
          })}
        </div>
      )}
    </div>
  );
}
