import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IProgress extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  lesson: mongoose.Types.ObjectId;
  isCompleted: boolean;
  completedAt?: Date;
  watchedSeconds: number;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const progressSchema = new Schema<IProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: { type: Date },
    watchedSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, course: 1, lesson: 1 }, { unique: true });

export const Progress: Model<IProgress> = mongoose.model<IProgress>('Progress', progressSchema);
