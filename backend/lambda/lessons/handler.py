import json
import uuid
import time
import os
import boto3
from dynamo_client import get_main_table
from response import success, error
from auth_utils import require_admin, require_auth
from boto3.dynamodb.conditions import Key


def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', event.get('httpMethod', ''))
    path = event.get('requestContext', {}).get('http', {}).get('path', event.get('path', ''))

    if method == 'OPTIONS':
        return success({'message': 'OK'})

    path_params = event.get('pathParameters') or {}
    lesson_id = path_params.get('lessonId')

    # Check for video-url sub-route
    if method == 'GET' and lesson_id and path.endswith('/video-url'):
        return get_video_url(event, lesson_id)

    if method == 'POST' and not lesson_id:
        return create_lesson(event)
    elif method == 'PUT' and lesson_id:
        return update_lesson(event, lesson_id)
    elif method == 'DELETE' and lesson_id:
        return delete_lesson(event, lesson_id)

    return error('Route not found', 404)


def _parse_body(event):
    body = event.get('body', '{}')
    if isinstance(body, str):
        try:
            return json.loads(body)
        except (json.JSONDecodeError, TypeError):
            return {}
    return body or {}


def _get_next_order(table, module_id):
    """Get next zero-padded order string by counting existing lessons under a module."""
    resp = table.query(
        KeyConditionExpression=Key('pk').eq(f'MODULE#{module_id}') & Key('sk').begins_with('LESSON#'),
        Select='COUNT',
    )
    count = resp.get('Count', 0)
    return str(count + 1).zfill(3)


def _find_lesson(table, lesson_id):
    """Find a lesson by querying GSI3 for LESSON entity type."""
    resp = table.query(
        IndexName='GSI3-EntityTypeIndex',
        KeyConditionExpression=Key('entityType').eq('LESSON'),
    )
    for item in resp.get('Items', []):
        if item.get('lessonId') == lesson_id:
            return item
    return None


@require_admin
def create_lesson(event):
    body = _parse_body(event)
    module_id = body.get('moduleId', '').strip()
    course_id = body.get('courseId', '').strip()
    title = body.get('title', '').strip()

    if not module_id or not course_id or not title:
        return error('moduleId, courseId, and title are required', 400)

    table = get_main_table()

    # Verify course exists
    course_resp = table.get_item(Key={'pk': f'COURSE#{course_id}', 'sk': 'METADATA'})
    if not course_resp.get('Item'):
        return error('Course not found', 404)

    lesson_id = str(uuid.uuid4())
    now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    order = body.get('order') or _get_next_order(table, module_id)

    base_lesson = {
        'lessonId': lesson_id,
        'moduleId': module_id,
        'courseId': course_id,
        'title': title,
        'description': body.get('description', ''),
        'content': body.get('content', ''),
        'videoKey': body.get('videoKey', ''),
        'duration': body.get('duration', ''),
        'order': order,
        'type': body.get('type', 'video'),
        'isFree': body.get('isFree', False),
        'entityType': 'LESSON',
        'createdAt': now,
        'updatedAt': now,
    }

    # Write 1: under MODULE# partition
    module_item = dict(base_lesson)
    module_item['pk'] = f'MODULE#{module_id}'
    module_item['sk'] = f'LESSON#{order}#{lesson_id}'

    # Write 2: under COURSE# partition
    course_item = dict(base_lesson)
    course_item['pk'] = f'COURSE#{course_id}'
    course_item['sk'] = f'LESSON#{module_id}#{order}#{lesson_id}'

    with table.batch_writer() as batch:
        batch.put_item(Item=module_item)
        batch.put_item(Item=course_item)

    return success({'lesson': base_lesson}, 201)


@require_admin
def update_lesson(event, lesson_id):
    body = _parse_body(event)
    table = get_main_table()

    # Find the lesson to get its keys
    lesson = _find_lesson(table, lesson_id)
    if not lesson:
        return error('Lesson not found', 404)

    module_id = lesson.get('moduleId', '')
    course_id = lesson.get('courseId', '')
    order = lesson.get('order', '')

    allowed_fields = ['title', 'description', 'content', 'videoKey', 'duration', 'order', 'type', 'isFree']
    update_parts = []
    attr_values = {}
    attr_names = {}

    for field in allowed_fields:
        if field in body:
            placeholder = f':val_{field}'
            name_placeholder = f'#f_{field}'
            update_parts.append(f'{name_placeholder} = {placeholder}')
            attr_values[placeholder] = body[field]
            attr_names[name_placeholder] = field

    if not update_parts:
        return error('No valid fields to update', 400)

    attr_values[':now'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    update_parts.append('updatedAt = :now')

    update_expr = 'SET ' + ', '.join(update_parts)

    # Update both copies
    module_sk = f'LESSON#{order}#{lesson_id}'
    course_sk = f'LESSON#{module_id}#{order}#{lesson_id}'

    update_kwargs = {
        'UpdateExpression': update_expr,
        'ExpressionAttributeValues': attr_values,
    }
    if attr_names:
        update_kwargs['ExpressionAttributeNames'] = attr_names

    table.update_item(
        Key={'pk': f'MODULE#{module_id}', 'sk': module_sk},
        **update_kwargs,
    )
    table.update_item(
        Key={'pk': f'COURSE#{course_id}', 'sk': course_sk},
        **update_kwargs,
    )

    resp = table.get_item(Key={'pk': f'MODULE#{module_id}', 'sk': module_sk})
    updated_lesson = resp.get('Item', {})

    return success({'lesson': updated_lesson})


@require_admin
def delete_lesson(event, lesson_id):
    table = get_main_table()

    lesson = _find_lesson(table, lesson_id)
    if not lesson:
        return error('Lesson not found', 404)

    module_id = lesson.get('moduleId', '')
    course_id = lesson.get('courseId', '')
    order = lesson.get('order', '')

    module_sk = f'LESSON#{order}#{lesson_id}'
    course_sk = f'LESSON#{module_id}#{order}#{lesson_id}'

    # Delete both copies
    table.delete_item(Key={'pk': f'MODULE#{module_id}', 'sk': module_sk})
    table.delete_item(Key={'pk': f'COURSE#{course_id}', 'sk': course_sk})

    return success({'message': 'Lesson deleted successfully'})


@require_auth
def get_video_url(event, lesson_id):
    table = get_main_table()

    lesson = _find_lesson(table, lesson_id)
    if not lesson:
        return error('Lesson not found', 404)

    video_key = lesson.get('videoKey', '')
    if not video_key:
        return error('No video associated with this lesson', 404)

    bucket = os.environ.get('S3_MEDIA_BUCKET', '')
    if not bucket:
        return error('Media storage not configured', 500)

    s3_client = boto3.client('s3')
    presigned_url = s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': bucket, 'Key': video_key},
        ExpiresIn=3600,
    )

    return success({
        'url': presigned_url,
        'expiresIn': 3600,
    })
