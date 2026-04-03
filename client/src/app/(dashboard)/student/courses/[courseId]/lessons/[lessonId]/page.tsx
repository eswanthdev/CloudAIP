'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageSpinner } from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LessonPlayer from '@/components/courses/LessonPlayer';
import api from '@/lib/api';
import { Course, Lesson, Module } from '@/types';
import { ChevronLeft, ChevronRight, CheckCircle, Circle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [courseRes, progressRes] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get(`/progress/course/${courseId}`),
        ]);
        const courseData: Course = courseRes.data.data;
        setCourse(courseData);

        // Find current lesson
        for (const mod of courseData.modules || []) {
          const lesson = mod.lessons.find((l) => l.id === lessonId);
          if (lesson) {
            setCurrentLesson(lesson);
            break;
          }
        }

        const completed = new Set<string>(
          (progressRes.data.data || []).filter((p: any) => p.completed).map((p: any) => p.lessonId)
        );
        setCompletedLessons(completed);
      } catch {
        // handle
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [courseId, lessonId]);

  const allLessons: Lesson[] = course?.modules?.flatMap((m) => m.lessons) || [];
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const isCompleted = completedLessons.has(lessonId);

  const markComplete = async () => {
    setMarking(true);
    try {
      await api.post(`/progress/complete`, { courseId, lessonId });
      setCompletedLessons((prev) => new Set(prev).add(lessonId));
    } catch {
      // handle
    } finally {
      setMarking(false);
    }
  };

  const navigateLesson = (lesson: Lesson) => {
    router.push(`/student/courses/${courseId}/lessons/${lesson.id}`);
  };

  if (loading) return <PageSpinner />;
  if (!currentLesson || !course) return <div className="text-text-muted text-center py-20">Lesson not found</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Video Player */}
        <LessonPlayer videoUrl={currentLesson.videoUrl} title={currentLesson.title} />

        {/* Lesson Info */}
        <Card>
          <h1 className="text-xl font-bold text-white mb-2">{currentLesson.title}</h1>
          {currentLesson.description && (
            <p className="text-text-muted text-sm mb-4">{currentLesson.description}</p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={markComplete}
              loading={marking}
              variant={isCompleted ? 'ghost' : 'primary'}
              size="sm"
              disabled={isCompleted}
            >
              {isCompleted ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Completed
                </>
              ) : (
                'Mark as Complete'
              )}
            </Button>

            <div className="flex items-center gap-2 ml-auto">
              {prevLesson && (
                <Button variant="outline" size="sm" onClick={() => navigateLesson(prevLesson)}>
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}
              {nextLesson && (
                <Button size="sm" onClick={() => navigateLesson(nextLesson)}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Lesson Sidebar */}
      <div className="lg:w-80 flex-shrink-0">
        <Card className="sticky top-20">
          <h2 className="text-sm font-semibold text-white mb-3">Course Content</h2>
          <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {course.modules?.map((module) => (
              <div key={module.id}>
                <p className="text-xs font-semibold text-text-muted uppercase mb-2">{module.title}</p>
                <div className="space-y-1">
                  {module.lessons.map((lesson) => {
                    const isCurrent = lesson.id === lessonId;
                    const isDone = completedLessons.has(lesson.id);
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => navigateLesson(lesson)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors',
                          isCurrent
                            ? 'bg-cyan/10 text-cyan'
                            : 'text-text-muted hover:text-white hover:bg-white/5'
                        )}
                      >
                        {isDone ? (
                          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="truncate">{lesson.title}</span>
                        <span className="text-xs text-text-muted ml-auto flex-shrink-0">{lesson.duration}m</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
