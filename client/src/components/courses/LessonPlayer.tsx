'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { PlayCircle } from 'lucide-react';

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

interface LessonPlayerProps {
  videoUrl?: string;
  title: string;
}

export default function LessonPlayer({ videoUrl, title }: LessonPlayerProps) {
  if (!videoUrl) {
    return (
      <div className="aspect-video bg-card border border-border rounded-xl flex flex-col items-center justify-center">
        <PlayCircle className="h-16 w-16 text-text-muted mb-3" />
        <p className="text-text-muted text-sm">No video available for this lesson</p>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-xl overflow-hidden">
      <ReactPlayer
        url={videoUrl}
        width="100%"
        height="100%"
        controls
        playing={false}
        config={{
          youtube: {
            playerVars: { modestbranding: 1 },
          },
        }}
      />
    </div>
  );
}
