import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail?: string;
  instructor: mongoose.Types.ObjectId;
  category: 'cloud-computing' | 'devops' | 'cybersecurity' | 'data-engineering' | 'ai-ml' | 'software-development';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  duration: number;
  totalLessons: number;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  enrollmentCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      required: true,
      maxlength: 500,
    },
    thumbnail: { type: String },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['cloud-computing', 'devops', 'cybersecurity', 'data-engineering', 'ai-ml', 'software-development'],
      index: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['beginner', 'intermediate', 'advanced'],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    totalLessons: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  { timestamps: true }
);

courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Course: Model<ICourse> = mongoose.model<ICourse>('Course', courseSchema);
