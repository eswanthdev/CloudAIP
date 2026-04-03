import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IServiceRequest extends Document {
  _id: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  service: mongoose.Types.ObjectId;
  status: 'new' | 'reviewing' | 'proposal-sent' | 'in-progress' | 'completed' | 'cancelled';
  message: string;
  budget?: string;
  timeline?: string;
  adminNotes?: string;
  assignedTo?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const serviceRequestSchema = new Schema<IServiceRequest>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['new', 'reviewing', 'proposal-sent', 'in-progress', 'completed', 'cancelled'],
      default: 'new',
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    budget: { type: String },
    timeline: { type: String },
    adminNotes: { type: String },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const ServiceRequest: Model<IServiceRequest> = mongoose.model<IServiceRequest>(
  'ServiceRequest',
  serviceRequestSchema
);
