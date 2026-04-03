export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'client' | 'admin';
  avatar?: string;
  phone?: string;
  company?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  thumbnail?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  currency: string;
  duration: number; // in hours
  totalLessons: number;
  totalModules: number;
  instructor: string;
  tags: string[];
  published: boolean;
  enrollmentCount: number;
  averageRating: number;
  modules?: Module[];
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration: number; // in minutes
  order: number;
  isFree: boolean;
  resources?: LessonResource[];
}

export interface LessonResource {
  id: string;
  title: string;
  url: string;
  type: 'pdf' | 'link' | 'file';
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  course: Course;
  status: 'active' | 'completed' | 'expired';
  progress: number;
  enrolledAt: string;
  completedAt?: string;
}

export interface Progress {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  watchTime: number;
  completedAt?: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  course: Course;
  certificateNumber: string;
  issuedAt: string;
  downloadUrl: string;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  icon?: string;
  thumbnail?: string;
  category: string;
  features: string[];
  pricing?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequest {
  id: string;
  userId: string;
  user?: User;
  serviceId: string;
  service?: Service;
  status: 'pending' | 'in_review' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  requirements: string;
  budget?: string;
  timeline?: string;
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  cloudSpend?: string;
  requirements: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  user?: User;
  courseId?: string;
  course?: Course;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentId?: string;
  method: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'client';
}

export interface DashboardStats {
  totalUsers: number;
  totalEnrollments: number;
  totalRevenue: number;
  totalLeads: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'enrollment' | 'payment' | 'lead' | 'completion';
  message: string;
  timestamp: string;
}
