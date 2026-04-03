import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  type: 'course' | 'service';
  course?: mongoose.Types.ObjectId;
  service?: mongoose.Types.ObjectId;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['course', 'service'],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'usd',
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
    },
    receiptUrl: { type: String },
  },
  { timestamps: true }
);

export const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema);
