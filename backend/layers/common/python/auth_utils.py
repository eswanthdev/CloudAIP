from jwt_utils import verify_access_token

def extract_token(event):
    auth_header = event.get('headers', {}).get('authorization', '') or event.get('headers', {}).get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header[7:]
    return None

def get_user_from_event(event):
    token = extract_token(event)
    if not token:
        return None
    return verify_access_token(token)

def require_auth(event):
    user = get_user_from_event(event)
    if not user:
        return None, {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': '{"error":"Unauthorized"}'}
    return user, None

def require_admin(event):
    user, err = require_auth(event)
    if err:
        return None, err
    if user.get('role') != 'admin':
        return None, {'statusCode': 403, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': '{"error":"Admin access required"}'}
    return user, None
