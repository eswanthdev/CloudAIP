import json
import uuid
import time
import os
import boto3
import stripe
from dynamo_client import get_main_table, get_activity_table, ACTIVITY_TABLE
from response import success, error
from auth_utils import require_auth, get_user_from_event
from boto3.dynamodb.conditions import Key

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')


def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', event.get('httpMethod', ''))
    path = event.get('requestContext', {}).get('http', {}).get('path', event.get('path', ''))

    if method == 'OPTIONS':
        return success({'message': 'OK'})

    path_parts = path.rstrip('/').split('/')

    if method == 'POST' and path == '/payments/create-intent':
        return create_payment_intent(event)
    elif method == 'POST' and path == '/payments/webhook':
        return handle_webhook(event)
    elif method == 'GET' and path == '/payments':
        return list_payments(event)
    elif method == 'GET' and len(path_parts) == 3 and path_parts[1] == 'payments':
        return get_payment(event, path_parts[2])

    return error('Route not found', 404)


def _parse_body(event):
    body = event.get('body', '{}')
    if isinstance(body, str):
        try:
            return json.loads(body)
        except (json.JSONDecodeError, TypeError):
            return {}
    return body or {}


@require_auth
def create_payment_intent(event):
    user = get_user_from_event(event)
    user_id = user.get('sub')
    email = user.get('email', '')
    body = _parse_body(event)

    course_id = body.get('courseId', '').strip()
    amount = body.get('amount')  # Amount in cents
    currency = body.get('currency', 'usd').strip().lower()

    if not course_id:
        return error('courseId is required', 400)
    if not amount or not isinstance(amount, (int, float)) or amount <= 0:
        return error('A valid positive amount is required', 400)

    amount = int(amount)

    # Verify course exists
    main_table = get_main_table()
    course_resp = main_table.get_item(Key={'pk': f'COURSE#{course_id}', 'sk': 'METADATA'})
    course = course_resp.get('Item')
    if not course:
        return error('Course not found', 404)

    # Check if already enrolled
    activity_table = get_activity_table()
    existing = activity_table.get_item(
        Key={'pk': f'USER#{user_id}', 'sk': f'ENROLLMENT#{course_id}'}
    )
    if existing.get('Item'):
        return error('Already enrolled in this course', 409)

    payment_id = str(uuid.uuid4())
    now = int(time.time())
    iso_now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(now))

    try:
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=currency,
            metadata={
                'paymentId': payment_id,
                'userId': user_id,
                'courseId': course_id,
                'courseName': course.get('title', ''),
            },
            receipt_email=email,
        )
    except stripe.error.StripeError as e:
        return error(f'Payment error: {str(e)}', 400)

    # Store payment record
    payment_data = {
        'paymentId': payment_id,
        'userId': user_id,
        'courseId': course_id,
        'courseName': course.get('title', ''),
        'amount': amount,
        'currency': currency,
        'stripePaymentIntentId': intent.id,
        'paymentStatus': 'pending',
        'entityType': 'PAYMENT',
        'createdAt': iso_now,
        'updatedAt': iso_now,
    }

    # Primary payment record
    activity_table.put_item(Item={
        'pk': f'PAYMENT#{payment_id}',
        'sk': 'METADATA',
        **payment_data,
    })

    # User-scoped payment record
    activity_table.put_item(Item={
        'pk': f'USER#{user_id}',
        'sk': f'PAYMENT#{payment_id}',
        **payment_data,
    })

    return success({
        'clientSecret': intent.client_secret,
        'paymentIntentId': intent.id,
        'paymentId': payment_id,
    })


def handle_webhook(event):
    """Handle Stripe webhook - no auth required, verify signature instead."""
    payload = event.get('body', '')
    sig_header = (event.get('headers', {}).get('stripe-signature', '')
                  or event.get('headers', {}).get('Stripe-Signature', ''))

    if not sig_header:
        return error('Missing Stripe signature', 400)

    try:
        webhook_event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        return error('Invalid signature', 400)
    except Exception as e:
        return error(f'Webhook error: {str(e)}', 400)

    event_type = webhook_event.get('type', '')

    if event_type == 'payment_intent.succeeded':
        _handle_payment_succeeded(webhook_event['data']['object'])
    elif event_type == 'payment_intent.payment_failed':
        _handle_payment_failed(webhook_event['data']['object'])

    return success({'received': True})


def _handle_payment_succeeded(payment_intent):
    metadata = payment_intent.get('metadata', {})
    payment_id = metadata.get('paymentId', '')
    user_id = metadata.get('userId', '')
    course_id = metadata.get('courseId', '')
    course_name = metadata.get('courseName', '')
    stripe_pi_id = payment_intent.get('id', '')

    if not payment_id or not user_id or not course_id:
        return

    iso_now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    activity_table = get_activity_table()
    main_table = get_main_table()

    # Update payment status
    for pk, sk in [
        (f'PAYMENT#{payment_id}', 'METADATA'),
        (f'USER#{user_id}', f'PAYMENT#{payment_id}'),
    ]:
        try:
            activity_table.update_item(
                Key={'pk': pk, 'sk': sk},
                UpdateExpression='SET paymentStatus = :status, paidAt = :now, updatedAt = :now',
                ExpressionAttributeValues={':status': 'succeeded', ':now': iso_now},
            )
        except Exception:
            pass

    # Auto-create enrollment
    enrollment_id = str(uuid.uuid4())
    enrollment_data = {
        'enrollmentId': enrollment_id,
        'userId': user_id,
        'courseId': course_id,
        'courseName': course_name,
        'status': 'active',
        'progress': 0,
        'entityType': 'ENROLLMENT',
        'paymentId': payment_id,
        'enrolledAt': iso_now,
        'createdAt': iso_now,
        'updatedAt': iso_now,
    }

    main_table.put_item(Item={
        'pk': f'ENROLLMENT#{enrollment_id}',
        'sk': 'METADATA',
        **enrollment_data,
    })

    activity_table.put_item(Item={
        'pk': f'USER#{user_id}',
        'sk': f'ENROLLMENT#{course_id}',
        **enrollment_data,
    })


def _handle_payment_failed(payment_intent):
    metadata = payment_intent.get('metadata', {})
    payment_id = metadata.get('paymentId', '')
    user_id = metadata.get('userId', '')

    if not payment_id:
        return

    iso_now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    activity_table = get_activity_table()

    for pk, sk in [
        (f'PAYMENT#{payment_id}', 'METADATA'),
        (f'USER#{user_id}', f'PAYMENT#{payment_id}'),
    ]:
        try:
            activity_table.update_item(
                Key={'pk': pk, 'sk': sk},
                UpdateExpression='SET paymentStatus = :status, updatedAt = :now',
                ExpressionAttributeValues={':status': 'failed', ':now': iso_now},
            )
        except Exception:
            pass


@require_auth
def list_payments(event):
    user = get_user_from_event(event)
    user_id = user.get('sub')

    activity_table = get_activity_table()
    resp = activity_table.query(
        KeyConditionExpression=Key('pk').eq(f'USER#{user_id}') & Key('sk').begins_with('PAYMENT#')
    )
    payments = resp.get('Items', [])

    while 'LastEvaluatedKey' in resp:
        resp = activity_table.query(
            KeyConditionExpression=Key('pk').eq(f'USER#{user_id}') & Key('sk').begins_with('PAYMENT#'),
            ExclusiveStartKey=resp['LastEvaluatedKey'],
        )
        payments.extend(resp.get('Items', []))

    return success({'payments': payments, 'count': len(payments)})


@require_auth
def get_payment(event, payment_id):
    user = get_user_from_event(event)
    user_id = user.get('sub')
    role = user.get('role', 'student')

    activity_table = get_activity_table()
    resp = activity_table.get_item(Key={'pk': f'PAYMENT#{payment_id}', 'sk': 'METADATA'})
    payment = resp.get('Item')

    if not payment:
        return error('Payment not found', 404)

    if payment.get('userId') != user_id and role != 'admin':
        return error('Forbidden', 403)

    return success({'payment': payment})
