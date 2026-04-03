import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IModule extends Document {
  _id: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const moduleSchema = new Schema<IModule>(
  {
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
    description: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

moduleSchema.index({ course: 1, order: 1 });

export const Module: Model<IModule> = mongoose.model<IModule>('Module', moduleSchema);
