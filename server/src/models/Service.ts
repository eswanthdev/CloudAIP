import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IService extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  icon?: string;
  features: string[];
  pricingType: 'fixed' | 'hourly' | 'custom' | 'subscription';
  price?: number;
  isPublished: boolean;
  isFeatured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
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
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    icon: { type: String },
    features: {
      type: [String],
      default: [],
    },
    pricingType: {
      type: String,
      required: true,
      enum: ['fixed', 'hourly', 'custom', 'subscription'],
    },
    price: {
      type: Number,
      min: 0,
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
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Service: Model<IService> = mongoose.model<IService>('Service', serviceSchema);
