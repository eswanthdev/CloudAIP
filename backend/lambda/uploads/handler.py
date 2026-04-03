import json
import uuid
import time
import os
import boto3
from response import success, error
from auth_utils import require_auth, require_admin, get_user_from_event

s3 = boto3.client('s3')
S3_MEDIA_BUCKET = os.environ.get('S3_MEDIA_BUCKET', '')


def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', event.get('httpMethod', ''))
    path = event.get('requestContext', {}).get('http', {}).get('path', event.get('path', ''))

    if method == 'OPTIONS':
        return success({'message': 'OK'})

    path_parts = path.rstrip('/').split('/')

    if method == 'POST' and path == '/uploads/presigned-url':
        return generate_presigned_url(event)
    elif method == 'DELETE' and len(path_parts) >= 3 and path_parts[1] == 'uploads':
        # Reconstruct the S3 key from path parts after /uploads/
        s3_key = '/'.join(path_parts[2:])
        return delete_upload(event, s3_key)

    return error('Route not found', 404)


def _parse_body(event):
    body = event.get('body', '{}')
    if isinstance(body, str):
        try:
            return json.loads(body)
        except (json.JSONDecodeError, TypeError):
            return {}
    return body or {}


ALLOWED_CONTENT_TYPES = {
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf',
}

MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB


@require_auth
def generate_presigned_url(event):
    user = get_user_from_event(event)
    user_id = user.get('sub')
    body = _parse_body(event)

    filename = body.get('filename', '').strip()
    content_type = body.get('contentType', '').strip()
    folder = body.get('folder', 'uploads').strip()
    file_size = body.get('fileSize', 0)

    if not filename:
        return error('filename is required', 400)
    if not content_type:
        return error('contentType is required', 400)
    if content_type not in ALLOWED_CONTENT_TYPES:
        return error(f'Content type {content_type} is not allowed', 400)
    if file_size and int(file_size) > MAX_FILE_SIZE:
        return error('File size exceeds maximum allowed (500 MB)', 400)

    # Sanitize folder - prevent path traversal
    folder = folder.replace('..', '').strip('/')
    if not folder:
        folder = 'uploads'

    # Generate unique key
    file_ext = os.path.splitext(filename)[1] if '.' in filename else ''
    unique_name = f'{uuid.uuid4().hex}{file_ext}'
    s3_key = f'{folder}/{user_id}/{unique_name}'

    try:
        presigned_url = s3.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': S3_MEDIA_BUCKET,
                'Key': s3_key,
                'ContentType': content_type,
            },
            ExpiresIn=3600,  # 1 hour
        )
    except Exception as e:
        return error(f'Failed to generate presigned URL: {str(e)}', 500)

    return success({
        'uploadUrl': presigned_url,
        'key': s3_key,
        'bucket': S3_MEDIA_BUCKET,
        'expiresIn': 3600,
    })


@require_admin
def delete_upload(event, s3_key):
    if not s3_key:
        return error('File key is required', 400)

    # Path traversal protection
    normalized = os.path.normpath(s3_key).replace('\\', '/')
    if normalized.startswith('/') or '..' in normalized:
        return error('Invalid file key', 400)

    try:
        # Check if object exists
        s3.head_object(Bucket=S3_MEDIA_BUCKET, Key=normalized)
    except s3.exceptions.ClientError as e:
        if e.response['Error']['Code'] == '404':
            return error('File not found', 404)
        return error(f'Error checking file: {str(e)}', 500)
    except Exception as e:
        return error(f'Error checking file: {str(e)}', 500)

    try:
        s3.delete_object(Bucket=S3_MEDIA_BUCKET, Key=normalized)
    except Exception as e:
        return error(f'Failed to delete file: {str(e)}', 500)

    return success({'message': 'File deleted', 'key': normalized})
