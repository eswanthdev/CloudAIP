from jwt_utils import verify_access_token


def lambda_handler(event, context):
    token = None
    headers = event.get('headers', {})
    auth_header = headers.get('authorization', '') or headers.get('Authorization', '')

    if auth_header.startswith('Bearer '):
        token = auth_header[7:]

    if not token:
        return {"isAuthorized": False}

    payload = verify_access_token(token)
    if not payload:
        return {"isAuthorized": False}

    return {
        "isAuthorized": True,
        "context": {
            "userId": payload['sub'],
            "email": payload.get('email', ''),
            "role": payload.get('role', 'student'),
        },
    }
