import os
import jwt
import time

JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret')
JWT_REFRESH_SECRET = os.environ.get('JWT_REFRESH_SECRET', 'dev-refresh-secret')

def generate_access_token(user_id, email, role):
    payload = {
        'sub': user_id,
        'email': email,
        'role': role,
        'iat': int(time.time()),
        'exp': int(time.time()) + 900  # 15 minutes
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def generate_refresh_token(user_id):
    payload = {
        'sub': user_id,
        'type': 'refresh',
        'iat': int(time.time()),
        'exp': int(time.time()) + 604800  # 7 days
    }
    return jwt.encode(payload, JWT_REFRESH_SECRET, algorithm='HS256')

def verify_access_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def verify_refresh_token(token):
    try:
        return jwt.decode(token, JWT_REFRESH_SECRET, algorithms=['HS256'])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
