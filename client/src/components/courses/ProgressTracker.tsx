'use client';

import React from 'react';
import ProgressBar from '@/components/ui/ProgressBar';
import Card from '@/components/ui/Card';
import { CheckCircle, BookOpen, Clock } from 'lucide-react';

interface ProgressTrackerProps {
  totalLessons: number;
  completedLessons: number;
  totalDuration: number;
  watchedDuration: number;
}

export default function ProgressTracker({
  totalLessons,
  completedLessons,
  totalDuration,
  watchedDuration,
}: ProgressTrackerProps) {
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <Card>
      <h3 className="text-sm font-semibold text-white mb-4">Your Progress</h3>

      <ProgressBar value={progress} showLabel size="lg" className="mb-4" />

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
          <p className="text-lg font-bold text-white">{completedLessons}</p>
          <p className="text-xs text-text-muted">Completed</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <BookOpen className="h-5 w-5 text-cyan" />
          </div>
          <p className="text-lg font-bold text-white">{totalLessons - completedLessons}</p>
          <p className="text-xs text-text-muted">Remaining</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock className="h-5 w-5 text-purple-400" />
          </div>
          <p className="text-lg font-bold text-white">{Math.round(watchedDuration / 60)}h</p>
          <p className="text-xs text-text-muted">Watched</p>
        </div>
      </div>
    </Card>
  );
}
