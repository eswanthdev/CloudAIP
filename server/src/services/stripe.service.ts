import Stripe from 'stripe';
import { stripe } from '../config/stripe.js';
import { env } from '../config/env.js';
import { Payment, Enrollment, Course, User } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.middleware.js';
import { sendEnrollmentConfirmation } from './email.service.js';

interface CreatePaymentIntentInput {
  userId: string;
  type: 'course' | 'service';
  itemId: string;
  amount: number;
  currency?: string;
}

export async function createPaymentIntent(
  input: CreatePaymentIntentInput
): Promise<{ clientSecret: string; paymentId: string }> {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: input.amount,
    currency: input.currency || 'usd',
    metadata: {
      userId: input.userId,
      type: input.type,
      itemId: input.itemId,
    },
  });

  const payment = await Payment.create({
    user: input.userId,
    type: input.type,
    ...(input.type === 'course' ? { course: input.itemId } : { service: input.itemId }),
    stripePaymentIntentId: paymentIntent.id,
    amount: input.amount,
    currency: input.currency || 'usd',
    status: 'pending',
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentId: payment._id.toString(),
  };
}

export async function handleWebhook(
  payload: Buffer,
  signature: string
): Promise<void> {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    throw new AppError('Invalid webhook signature', 400);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSuccess(paymentIntent);
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailure(paymentIntent);
      break;
    }
    default:
      break;
  }
}

async function handlePaymentSuccess(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const payment = await Payment.findOne({
    stripePaymentIntentId: paymentIntent.id,
  });

  if (!payment) return;

  payment.status = 'succeeded';
  payment.receiptUrl = (paymentIntent as any).charges?.data?.[0]?.receipt_url || undefined;
  await payment.save();

  if (payment.type === 'course' && payment.course) {
    // Create enrollment
    const existingEnrollment = await Enrollment.findOne({
      user: payment.user,
      course: payment.course,
    });

    if (!existingEnrollment) {
      await Enrollment.create({
        user: payment.user,
        course: payment.course,
        status: 'active',
        paymentId: payment._id,
      });

      await Course.findByIdAndUpdate(payment.course, {
        $inc: { enrollmentCount: 1 },
      });

      // Send confirmation email
      try {
        const user = await User.findById(payment.user);
        const course = await Course.findById(payment.course);
        if (user && course) {
          await sendEnrollmentConfirmation(
            user.email,
            user.firstName,
            course.title
          );
        }
      } catch {
        console.warn('Failed to send enrollment confirmation email');
      }
    }
  }
}

async function handlePaymentFailure(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  await Payment.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntent.id },
    { status: 'failed' }
  );
}
