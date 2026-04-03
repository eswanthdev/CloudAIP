import json
import uuid
import time
import os
import boto3
from dynamo_client import get_main_table
from response import success, error
from jwt_utils import generate_access_token, generate_refresh_token, verify_refresh_token
from password_utils import hash_password, verify_password
from auth_utils import require_auth
from boto3.dynamodb.conditions import Key


def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', event.get('httpMethod', ''))
    path = event.get('requestContext', {}).get('http', {}).get('path', event.get('path', ''))

    if method == 'OPTIONS':
        return success({'message': 'OK'})

    routes = {
        ('POST', '/auth/register'): register,
        ('POST', '/auth/login'): login,
        ('POST', '/auth/refresh'): refresh_token,
        ('POST', '/auth/logout'): logout,
        ('POST', '/auth/forgot-password'): forgot_password,
        ('POST', '/auth/reset-password'): reset_password,
        ('GET', '/auth/verify-email'): verify_email,
        ('GET', '/auth/me'): me,
    }

    handler = routes.get((method, path))
    if handler:
        return handler(event)
    return error('Route not found', 404)


def _parse_body(event):
    body = event.get('body', '{}')
    if isinstance(body, str):
        try:
            return json.loads(body)
        except (json.JSONDecodeError, TypeError):
            return {}
    return body or {}


def _strip_password(user):
    user_data = {k: v for k, v in user.items() if k != 'password'}
    return user_data


def _find_user_by_email(email):
    table = get_main_table()
    resp = table.query(
        IndexName='GSI1-EmailIndex',
        KeyConditionExpression=Key('email').eq(email),
    )
    items = resp.get('Items', [])
    return items[0] if items else None


def register(event):
    body = _parse_body(event)
    email = body.get('email', '').strip().lower()
    password = body.get('password', '')
    name = body.get('name', '').strip()

    if not email or not password or not name:
        return error('Email, password, and name are required', 400)

    if len(password) < 8:
        return error('Password must be at least 8 characters', 400)

    existing = _find_user_by_email(email)
    if existing:
        return error('An account with this email already exists', 409)

    user_id = str(uuid.uuid4())
    now = int(time.time())
    iso_now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(now))
    email_verification_token = str(uuid.uuid4())

    user_item = {
        'pk': f'USER#{user_id}',
        'sk': 'PROFILE',
        'userId': user_id,
        'email': email,
        'name': name,
        'password': hash_password(password),
        'role': 'student',
        'emailVerified': False,
        'emailVerificationToken': email_verification_token,
        'entityType': 'USER',
        'createdAt': iso_now,
        'updatedAt': iso_now,
    }

    table = get_main_table()
    table.put_item(Item=user_item)

    access_token = generate_access_token({'sub': user_id, 'email': email, 'role': 'student'})
    refresh = generate_refresh_token({'sub': user_id})

    return success({
        'message': 'Registration successful',
        'accessToken': access_token,
        'refreshToken': refresh,
        'user': _strip_password(user_item),
    }, 201)


def login(event):
    body = _parse_body(event)
    email = body.get('email', '').strip().lower()
    password = body.get('password', '')

    if not email or not password:
        return error('Email and password are required', 400)

    user = _find_user_by_email(email)
    if not user:
        return error('Invalid email or password', 401)

    if not verify_password(password, user['password']):
        return error('Invalid email or password', 401)

    user_id = user['userId']
    access_token = generate_access_token({'sub': user_id, 'email': user['email'], 'role': user.get('role', 'student')})
    refresh = generate_refresh_token({'sub': user_id})

    return success({
        'message': 'Login successful',
        'accessToken': access_token,
        'refreshToken': refresh,
        'user': _strip_password(user),
    })


def refresh_token(event):
    body = _parse_body(event)
    token = body.get('refreshToken', '')

    if not token:
        return error('Refresh token is required', 400)

    payload = verify_refresh_token(token)
    if not payload:
        return error('Invalid or expired refresh token', 401)

    user_id = payload.get('sub')
    table = get_main_table()
    resp = table.get_item(Key={'pk': f'USER#{user_id}', 'sk': 'PROFILE'})
    user = resp.get('Item')

    if not user:
        return error('User not found', 404)

    access_token = generate_access_token({'sub': user_id, 'email': user['email'], 'role': user.get('role', 'student')})
    new_refresh = generate_refresh_token({'sub': user_id})

    return success({
        'accessToken': access_token,
        'refreshToken': new_refresh,
    })


def logout(event):
    return success({'message': 'Logged out successfully'})


def forgot_password(event):
    body = _parse_body(event)
    email = body.get('email', '').strip().lower()

    if not email:
        return error('Email is required', 400)

    user = _find_user_by_email(email)
    if not user:
        # Return success even if user not found to prevent email enumeration
        return success({'message': 'If an account with that email exists, a reset link has been sent'})

    reset_token = str(uuid.uuid4())
    reset_expires = int(time.time()) + 3600  # 1 hour expiry

    table = get_main_table()
    table.update_item(
        Key={'pk': user['pk'], 'sk': 'PROFILE'},
        UpdateExpression='SET passwordResetToken = :token, passwordResetExpires = :expires, updatedAt = :now',
        ExpressionAttributeValues={
            ':token': reset_token,
            ':expires': reset_expires,
            ':now': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        },
    )

    frontend_url = os.environ.get('FRONTEND_URL', 'https://cloudaip.com')
    reset_link = f'{frontend_url}/reset-password?token={reset_token}'

    try:
        ses = boto3.client('ses')
        ses.send_email(
            Source=os.environ.get('SES_FROM_EMAIL', 'noreply@cloudaip.com'),
            Destination={'ToAddresses': [user['email']]},
            Message={
                'Subject': {'Data': 'Password Reset Request - CloudAIP'},
                'Body': {
                    'Html': {
                        'Data': (
                            f'<h2>Password Reset</h2>'
                            f'<p>You requested a password reset. Click the link below to reset your password:</p>'
                            f'<p><a href="{reset_link}">Reset Password</a></p>'
                            f'<p>This link expires in 1 hour.</p>'
                            f'<p>If you did not request this, please ignore this email.</p>'
                        ),
                    },
                },
            },
        )
    except Exception:
        pass  # Don't fail the request if SES fails

    return success({'message': 'If an account with that email exists, a reset link has been sent'})


def reset_password(event):
    body = _parse_body(event)
    token = body.get('token', '')
    new_password = body.get('password', '')

    if not token or not new_password:
        return error('Token and new password are required', 400)

    if len(new_password) < 8:
        return error('Password must be at least 8 characters', 400)

    table = get_main_table()
    resp = table.query(
        IndexName='GSI6-PasswordResetIndex',
        KeyConditionExpression=Key('passwordResetToken').eq(token),
    )
    items = resp.get('Items', [])

    if not items:
        return error('Invalid or expired reset token', 400)

    user = items[0]
    expires = user.get('passwordResetExpires', 0)

    if int(time.time()) > int(expires):
        return error('Reset token has expired', 400)

    table.update_item(
        Key={'pk': user['pk'], 'sk': 'PROFILE'},
        UpdateExpression='SET password = :pw, updatedAt = :now REMOVE passwordResetToken, passwordResetExpires',
        ExpressionAttributeValues={
            ':pw': hash_password(new_password),
            ':now': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        },
    )

    return success({'message': 'Password reset successful'})


def verify_email(event):
    params = event.get('queryStringParameters') or {}
    token = params.get('token', '')

    if not token:
        return error('Verification token is required', 400)

    table = get_main_table()
    resp = table.query(
        IndexName='GSI5-EmailVerifyIndex',
        KeyConditionExpression=Key('emailVerificationToken').eq(token),
    )
    items = resp.get('Items', [])

    if not items:
        return error('Invalid verification token', 400)

    user = items[0]

    table.update_item(
        Key={'pk': user['pk'], 'sk': 'PROFILE'},
        UpdateExpression='SET emailVerified = :verified, updatedAt = :now REMOVE emailVerificationToken',
        ExpressionAttributeValues={
            ':verified': True,
            ':now': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        },
    )

    return success({'message': 'Email verified successfully'})


@require_auth
def me(event):
    user_data = get_user_from_event(event)
    user_id = user_data.get('sub')

    table = get_main_table()
    resp = table.get_item(Key={'pk': f'USER#{user_id}', 'sk': 'PROFILE'})
    user = resp.get('Item')

    if not user:
        return error('User not found', 404)

    return success({'user': _strip_password(user)})


# Required import for me() decorator
from auth_utils import get_user_from_event
