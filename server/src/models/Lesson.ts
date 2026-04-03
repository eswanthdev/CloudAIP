import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ILesson extends Document {
  _id: mongoose.Types.ObjectId;
  module: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: 'video' | 'text' | 'quiz';
  order: number;
  duration: number;
  videoKey?: string;
  content?: string;
  resources: { title: string; url: string; type: string }[];
  isFree: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    module: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: { type: String, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['video', 'text', 'quiz'],
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    videoKey: { type: String },
    content: { type: String },
    resources: {
      type: [
        {
          title: { type: String, required: true },
          url: { type: String, required: true },
          type: { type: String, required: true },
        },
      ],
      default: [],
    },
    isFree: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

lessonSchema.index({ module: 1, order: 1 });
lessonSchema.index({ course: 1, order: 1 });

export const Lesson: Model<ILesson> = mongoose.model<ILesson>('Lesson', lessonSchema);
