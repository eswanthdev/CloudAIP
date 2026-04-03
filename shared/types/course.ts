export interface Lesson {
  _id: string;
  title: string;
  description: string;
  type: "video" | "article" | "quiz" | "lab";
  content: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isPreview: boolean;
  resources?: LessonResource[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonResource {
  name: string;
  url: string;
  type: "pdf" | "link" | "download";
}

export interface Module {
  _id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: "finops" | "aws" | "azure" | "gcp" | "devops" | "security";
  level: "beginner" | "intermediate" | "advanced";
  thumbnail: string;
  previewVideoUrl?: string;
  instructor: string;
  price: number;
  discountPrice?: number;
  currency: string;
  modules: Module[];
  totalDuration: number;
  totalLessons: number;
  enrollmentCount: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  prerequisites: string[];
  learningOutcomes: string[];
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Enrollment {
  _id: string;
  userId: string;
  courseId: string;
  status: "active" | "completed" | "expired" | "cancelled";
  enrolledAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  paymentId?: string;
  progress: Progress;
  createdAt: Date;
  updatedAt: Date;
}

export interface Progress {
  completedLessons: string[];
  currentModuleId?: string;
  currentLessonId?: string;
  percentComplete: number;
  lastAccessedAt: Date;
  timeSpentMinutes: number;
  quizScores: QuizScore[];
}

export interface QuizScore {
  lessonId: string;
  score: number;
  maxScore: number;
  attempts: number;
  completedAt: Date;
}

export interface Certificate {
  _id: string;
  userId: string;
  courseId: string;
  enrollmentId: string;
  certificateNumber: string;
  issuedAt: Date;
  expiresAt?: Date;
  pdfUrl: string;
  verificationUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
