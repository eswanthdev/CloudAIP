import json
import uuid
import time
from dynamo_client import get_main_table
from response import success, error
from auth_utils import require_admin
from boto3.dynamodb.conditions import Key


def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', event.get('httpMethod', ''))
    path = event.get('requestContext', {}).get('http', {}).get('path', event.get('path', ''))

    if method == 'OPTIONS':
        return success({'message': 'OK'})

    path_params = event.get('pathParameters') or {}
    module_id = path_params.get('moduleId')

    if method == 'POST' and not module_id:
        return create_module(event)
    elif method == 'PUT' and module_id:
        return update_module(event, module_id)
    elif method == 'DELETE' and module_id:
        return delete_module(event, module_id)

    return error('Route not found', 404)


def _parse_body(event):
    body = event.get('body', '{}')
    if isinstance(body, str):
        try:
            return json.loads(body)
        except (json.JSONDecodeError, TypeError):
            return {}
    return body or {}


def _get_next_order(table, course_id):
    """Get next zero-padded order string by counting existing modules."""
    resp = table.query(
        KeyConditionExpression=Key('pk').eq(f'COURSE#{course_id}') & Key('sk').begins_with('MODULE#'),
        Select='COUNT',
    )
    count = resp.get('Count', 0)
    return str(count + 1).zfill(3)


@require_admin
def create_module(event):
    body = _parse_body(event)
    course_id = body.get('courseId', '').strip()
    title = body.get('title', '').strip()

    if not course_id or not title:
        return error('courseId and title are required', 400)

    table = get_main_table()

    # Verify course exists
    course_resp = table.get_item(Key={'pk': f'COURSE#{course_id}', 'sk': 'METADATA'})
    if not course_resp.get('Item'):
        return error('Course not found', 404)

    module_id = str(uuid.uuid4())
    now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    order = body.get('order') or _get_next_order(table, course_id)

    module_item = {
        'pk': f'COURSE#{course_id}',
        'sk': f'MODULE#{order}#{module_id}',
        'moduleId': module_id,
        'courseId': course_id,
        'title': title,
        'description': body.get('description', ''),
        'order': order,
        'duration': body.get('duration', ''),
        'entityType': 'MODULE',
        'createdAt': now,
        'updatedAt': now,
    }

    table.put_item(Item=module_item)

    return success({'module': module_item}, 201)


@require_admin
def update_module(event, module_id):
    body = _parse_body(event)

    table = get_main_table()

    # Find the module by scanning for moduleId (modules live under COURSE# pk)
    # We need courseId to locate it; check body or query for it
    course_id = body.get('courseId', '')

    module_item = None
    if course_id:
        resp = table.query(
            KeyConditionExpression=Key('pk').eq(f'COURSE#{course_id}') & Key('sk').begins_with('MODULE#'),
        )
        for item in resp.get('Items', []):
            if item.get('moduleId') == module_id:
                module_item = item
                break
    else:
        # If courseId not provided, query GSI3 for MODULE entity type to find it
        resp = table.query(
            IndexName='GSI3-EntityTypeIndex',
            KeyConditionExpression=Key('entityType').eq('MODULE'),
        )
        for item in resp.get('Items', []):
            if item.get('moduleId') == module_id:
                module_item = item
                course_id = item.get('courseId', '')
                break

    if not module_item:
        return error('Module not found', 404)

    allowed_fields = ['title', 'description', 'duration', 'order']
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

    table.update_item(
        Key={'pk': module_item['pk'], 'sk': module_item['sk']},
        UpdateExpression='SET ' + ', '.join(update_parts),
        ExpressionAttributeValues=attr_values,
        ExpressionAttributeNames=attr_names,
    )

    resp = table.get_item(Key={'pk': module_item['pk'], 'sk': module_item['sk']})
    updated_module = resp.get('Item', {})

    return success({'module': updated_module})


@require_admin
def delete_module(event, module_id):
    body = _parse_body(event)
    table = get_main_table()

    course_id = body.get('courseId', '')

    module_item = None
    if course_id:
        resp = table.query(
            KeyConditionExpression=Key('pk').eq(f'COURSE#{course_id}') & Key('sk').begins_with('MODULE#'),
        )
        for item in resp.get('Items', []):
            if item.get('moduleId') == module_id:
                module_item = item
                break
    else:
        resp = table.query(
            IndexName='GSI3-EntityTypeIndex',
            KeyConditionExpression=Key('entityType').eq('MODULE'),
        )
        for item in resp.get('Items', []):
            if item.get('moduleId') == module_id:
                module_item = item
                course_id = item.get('courseId', '')
                break

    if not module_item:
        return error('Module not found', 404)

    # Delete all lessons under this module
    lesson_resp = table.query(
        KeyConditionExpression=Key('pk').eq(f'MODULE#{module_id}'),
    )
    lesson_items = lesson_resp.get('Items', [])

    # Also delete the COURSE# partition copies of each lesson
    for lesson in lesson_items:
        lesson_id = lesson.get('lessonId', '')
        lesson_order = lesson.get('order', '')
        if course_id and lesson_id:
            course_lesson_sk = f'LESSON#{module_id}#{lesson_order}#{lesson_id}'
            table.delete_item(Key={'pk': f'COURSE#{course_id}', 'sk': course_lesson_sk})

    # Batch delete lessons under MODULE# partition
    with table.batch_writer() as batch:
        for lesson in lesson_items:
            batch.delete_item(Key={'pk': lesson['pk'], 'sk': lesson['sk']})

    # Delete the module itself
    table.delete_item(Key={'pk': module_item['pk'], 'sk': module_item['sk']})

    return success({'message': 'Module and its lessons deleted successfully'})
