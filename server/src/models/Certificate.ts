import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICertificate extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  enrollment: mongoose.Types.ObjectId;
  certificateNumber: string;
  issuedAt: Date;
  pdfKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
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
    },
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    pdfKey: { type: String },
  },
  { timestamps: true }
);

export const Certificate: Model<ICertificate> = mongoose.model<ICertificate>('Certificate', certificateSchema);
