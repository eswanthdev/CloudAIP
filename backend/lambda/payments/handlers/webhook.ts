import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';
import { QueryCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { docClient, MAIN_TABLE, ACTIVITY_TABLE } from '/opt/nodejs/src/dynamo-client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const sesClient = new SESClient({});
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL || '';

export const webhook = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  // No auth - Stripe signature verification instead
  const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  const rawBody = event.body || '';

  if (!signature) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing Stripe signature' }),
    };
  }

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Stripe signature verification failed:', err.message);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid signature' }),
    };
  }

  if (stripeEvent.type === 'payment_intent.succeeded') {
    const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
    await handlePaymentSuccess(paymentIntent);
  } else if (stripeEvent.type === 'payment_intent.payment_failed') {
    const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
    await handlePaymentFailure(paymentIntent);
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ received: true }),
  };
};

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const { userId, type, itemId, itemName } = paymentIntent.metadata;

  // Find payment record by stripePaymentIntentId via GSI5-PaymentIntentIndex
  const paymentResult = await docClient.send(
    new QueryCommand({
      TableName: ACTIVITY_TABLE,
      IndexName: 'GSI5-PaymentIntentIndex',
      KeyConditionExpression: 'stripePaymentIntentId = :piId',
      ExpressionAttributeValues: {
        ':piId': paymentIntent.id,
      },
      Limit: 1,
    })
  );

  if (!paymentResult.Items || paymentResult.Items.length === 0) {
    console.error('Payment record not found for intent:', paymentIntent.id);
    return;
  }

  const paymentRecord = paymentResult.Items[0];
  const now = new Date().toISOString();

  // Update payment status to succeeded
  await docClient.send(
    new UpdateCommand({
      TableName: ACTIVITY_TABLE,
      Key: { pk: paymentRecord.pk, sk: paymentRecord.sk },
      UpdateExpression: 'SET #status = :status, paymentStatusKey = :psk, updatedAt = :now, paidAt = :now',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'succeeded',
        ':psk': 'PAYMENT#STATUS#succeeded',
        ':now': now,
      },
    })
  );

  // If payment is for a course, create enrollment
  if (type === 'course' && userId && itemId) {
    const courseId = itemId;

    // Check if enrollment already exists
    const existingEnrollment = await docClient.send(
      new QueryCommand({
        TableName: ACTIVITY_TABLE,
        KeyConditionExpression: 'pk = :pk AND sk = :sk',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': `ENROLL#${courseId}`,
        },
        Limit: 1,
      })
    );

    if (!existingEnrollment.Items || existingEnrollment.Items.length === 0) {
      const enrollmentId = randomUUID();

      await docClient.send(
        new PutCommand({
          TableName: ACTIVITY_TABLE,
          Item: {
            pk: `USER#${userId}`,
            sk: `ENROLL#${courseId}`,
            enrollmentId,
            userId,
            courseId,
            courseName: itemName || '',
            status: 'active',
            enrolledAt: now,
            createdAt: now,
            updatedAt: now,
            entityType: 'ENROLLMENT',
            enrollCourseKey: `ENROLL#COURSE#${courseId}`,
            enrollStatusKey: 'ENROLL#STATUS#active',
            paymentId: paymentRecord.paymentId,
          },
          ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)',
        })
      );

      // Increment course enrollmentCount
      try {
        await docClient.send(
          new UpdateCommand({
            TableName: MAIN_TABLE,
            Key: { pk: `COURSE#${courseId}`, sk: 'METADATA' },
            UpdateExpression: 'ADD enrollmentCount :inc',
            ExpressionAttributeValues: { ':inc': 1 },
          })
        );
      } catch (err) {
        console.error('Failed to increment enrollmentCount:', err);
      }
    }

    // Send enrollment confirmation email
    if (SES_FROM_EMAIL && paymentRecord.userId) {
      try {
        // Get user email
        const { GetCommand } = await import('@aws-sdk/lib-dynamodb');
        const userResult = await docClient.send(
          new GetCommand({
            TableName: MAIN_TABLE,
            Key: { pk: `USER#${userId}`, sk: 'PROFILE' },
            ProjectionExpression: 'email, firstName',
          })
        );

        if (userResult.Item?.email) {
          await sesClient.send(
            new SendEmailCommand({
              Source: SES_FROM_EMAIL,
              Destination: { ToAddresses: [userResult.Item.email] },
              Message: {
                Subject: {
                  Data: `Enrollment Confirmed - ${itemName}`,
                  Charset: 'UTF-8',
                },
                Body: {
                  Text: {
                    Data: [
                      `Hello ${userResult.Item.firstName || 'there'},`,
                      '',
                      `Your enrollment in "${itemName}" has been confirmed!`,
                      'You can now access the course from your dashboard.',
                      '',
                      'Happy learning!',
                      'The CloudAIP Team',
                    ].join('\n'),
                    Charset: 'UTF-8',
                  },
                },
              },
            })
          );
        }
      } catch (err) {
        console.error('Failed to send confirmation email:', err);
      }
    }
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  // Find payment record
  const paymentResult = await docClient.send(
    new QueryCommand({
      TableName: ACTIVITY_TABLE,
      IndexName: 'GSI5-PaymentIntentIndex',
      KeyConditionExpression: 'stripePaymentIntentId = :piId',
      ExpressionAttributeValues: {
        ':piId': paymentIntent.id,
      },
      Limit: 1,
    })
  );

  if (!paymentResult.Items || paymentResult.Items.length === 0) {
    console.error('Payment record not found for failed intent:', paymentIntent.id);
    return;
  }

  const paymentRecord = paymentResult.Items[0];
  const now = new Date().toISOString();

  await docClient.send(
    new UpdateCommand({
      TableName: ACTIVITY_TABLE,
      Key: { pk: paymentRecord.pk, sk: paymentRecord.sk },
      UpdateExpression: 'SET #status = :status, paymentStatusKey = :psk, updatedAt = :now, failureReason = :reason',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'failed',
        ':psk': 'PAYMENT#STATUS#failed',
        ':now': now,
        ':reason': paymentIntent.last_payment_error?.message || 'Payment failed',
      },
    })
  );
}
