import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ILead extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  spendRange?: string;
  message?: string;
  contactMethod?: string;
  source: 'website' | 'referral' | 'social' | 'paid-ad' | 'organic' | 'other';
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    company: { type: String, trim: true },
    phone: { type: String, trim: true },
    spendRange: { type: String },
    message: { type: String },
    contactMethod: { type: String },
    source: {
      type: String,
      enum: ['website', 'referral', 'social', 'paid-ad', 'organic', 'other'],
      default: 'website',
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
      default: 'new',
      index: true,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Lead: Model<ILead> = mongoose.model<ILead>('Lead', leadSchema);
