// Base interface for all DynamoDB items
export interface DynamoBaseItem {
  pk: string;
  sk: string;
  entityType: string;
  createdAt: string;
  updatedAt: string;
}

// User entity - stored in MainTable
// pk: USER#<userId>, sk: PROFILE
export interface User extends DynamoBaseItem {
  entityType: 'USER';
  userId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpiry?: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  organization?: string;
  refreshToken?: string;
  lastLoginAt?: string;
}

// Course entity - stored in MainTable
// pk: COURSE#<courseId>, sk: METADATA
export interface Course extends DynamoBaseItem {
  entityType: 'COURSE';
  courseId: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  currency: string;
  thumbnailUrl?: string;
  instructorId: string;
  instructorName: string;
  duration: string;
  totalLessons: number;
  totalModules: number;
  isPublished: boolean;
  tags: string[];
  prerequisites: string[];
  learningOutcomes: string[];
}

// Module entity - stored in MainTable
// pk: COURSE#<courseId>, sk: MODULE#<moduleId>
export interface Module extends DynamoBaseItem {
  entityType: 'MODULE';
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  totalLessons: number;
}

// Lesson entity - stored in MainTable
// pk: MODULE#<moduleId>, sk: LESSON#<lessonId>
export interface Lesson extends DynamoBaseItem {
  entityType: 'LESSON';
  lessonId: string;
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  order: number;
  duration: string;
  videoKey?: string;
  content?: string;
  isFreePreview: boolean;
}

// Enrollment entity - stored in ActivityTable
// pk: ENROLLMENT#<enrollmentId>, sk: METADATA
export interface Enrollment extends DynamoBaseItem {
  entityType: 'ENROLLMENT';
  enrollmentId: string;
  userId: string;
  courseId: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  enrolledAt: string;
  completedAt?: string;
  expiresAt?: string;
  paymentId?: string;
  // GSI keys
  enrollCourseKey: string;    // COURSE#<courseId>
  enrollStatusKey: string;    // STATUS#<status>
}

// Progress entity - stored in ActivityTable
// pk: PROGRESS#<userId>, sk: LESSON#<lessonId>
export interface Progress extends DynamoBaseItem {
  entityType: 'PROGRESS';
  userId: string;
  lessonId: string;
  moduleId: string;
  courseId: string;
  completed: boolean;
  completedAt?: string;
  watchTime: number;
  lastPosition: number;
  // GSI keys
  progressUserKey: string;    // USER#<userId>
  progressCourseKey: string;  // COURSE#<courseId>
}

// Certificate entity - stored in MainTable
// pk: CERT#<certId>, sk: METADATA
export interface Certificate extends DynamoBaseItem {
  entityType: 'CERTIFICATE';
  certId: string;
  userId: string;
  courseId: string;
  courseName: string;
  userName: string;
  certificateNumber: string;
  issuedAt: string;
  pdfKey?: string;
  // GSI keys
  certUserId: string;         // USER#<userId>
}

// Service entity - stored in MainTable
// pk: SERVICE#<serviceId>, sk: METADATA
export interface Service extends DynamoBaseItem {
  entityType: 'SERVICE';
  serviceId: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  icon: string;
  features: string[];
  pricing?: {
    type: 'fixed' | 'hourly' | 'project' | 'custom';
    amount?: number;
    currency?: string;
  };
  isActive: boolean;
  order: number;
  // GSI keys
  serviceEntityType: string;  // SERVICE
  serviceOrder: string;       // zero-padded order number
}

// ServiceRequest entity - stored in ActivityTable
// pk: SVCREQ#<requestId>, sk: METADATA
export interface ServiceRequest extends DynamoBaseItem {
  entityType: 'SERVICE_REQUEST';
  requestId: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  status: 'pending' | 'in_review' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  description: string;
  requirements?: string;
  budget?: string;
  timeline?: string;
  attachments?: string[];
  adminNotes?: string;
  // GSI keys
  svcReqStatusKey: string;    // STATUS#<status>
}

// Lead entity - stored in LeadsTable
// pk: leadId, sk: createdAt
export interface Lead {
  leadId: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  notes?: string;
  ttl?: number;
}

// Payment entity - stored in ActivityTable
// pk: PAYMENT#<paymentId>, sk: METADATA
export interface Payment extends DynamoBaseItem {
  entityType: 'PAYMENT';
  paymentId: string;
  userId: string;
  courseId?: string;
  serviceRequestId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  stripePaymentIntentId: string;
  stripeCustomerId?: string;
  description: string;
  metadata?: Record<string, string>;
  // GSI keys
  paymentStatusKey: string;   // STATUS#<status>
}
