import json
import uuid
import time
import re
from dynamo_client import get_main_table
from response import success, error
from auth_utils import require_admin, get_user_from_event
from pagination import paginated_query
from boto3.dynamodb.conditions import Key, Attr


def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', event.get('httpMethod', ''))
    path = event.get('requestContext', {}).get('http', {}).get('path', event.get('path', ''))

    if method == 'OPTIONS':
        return success({'message': 'OK'})

    path_params = event.get('pathParameters') or {}
    course_id = path_params.get('courseId')

    if method == 'GET' and not course_id:
        return list_courses(event)
    elif method == 'POST' and not course_id:
        return create_course(event)
    elif method == 'GET' and course_id:
        return get_course(event, course_id)
    elif method == 'PUT' and course_id:
        return update_course(event, course_id)
    elif method == 'DELETE' and course_id:
        return delete_course(event, course_id)

    return error('Route not found', 404)


def _parse_body(event):
    body = event.get('body', '{}')
    if isinstance(body, str):
        try:
            return json.loads(body)
        except (json.JSONDecodeError, TypeError):
            return {}
    return body or {}


def _generate_slug(title):
    slug = title.lower().strip()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s]+', '-', slug)
    slug = re.sub(r'-+', '-', slug).strip('-')
    return slug


def _is_admin(event):
    try:
        user = get_user_from_event(event)
        return user and user.get('role') == 'admin'
    except Exception:
        return False


def list_courses(event):
    params = event.get('queryStringParameters') or {}
    category = params.get('category')
    is_admin = _is_admin(event)

    if category:
        query_kwargs = {
            'IndexName': 'GSI4-CategoryIndex',
            'KeyConditionExpression': Key('category').eq(category),
            'ScanIndexForward': False,
        }
    else:
        query_kwargs = {
            'IndexName': 'GSI3-EntityTypeIndex',
            'KeyConditionExpression': Key('entityType').eq('COURSE'),
            'ScanIndexForward': False,
        }

    if not is_admin:
        query_kwargs['FilterExpression'] = Attr('status').eq('published')

    table = get_main_table()
    result = paginated_query(table, query_kwargs, params)

    return success(result)


@require_admin
def create_course(event):
    body = _parse_body(event)
    title = body.get('title', '').strip()

    if not title:
        return error('Title is required', 400)

    course_id = str(uuid.uuid4())
    now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    slug = _generate_slug(title)

    course_item = {
        'pk': f'COURSE#{course_id}',
        'sk': 'METADATA',
        'courseId': course_id,
        'title': title,
        'slug': slug,
        'description': body.get('description', ''),
        'shortDescription': body.get('shortDescription', ''),
        'category': body.get('category', 'general'),
        'level': body.get('level', 'beginner'),
        'duration': body.get('duration', ''),
        'thumbnail': body.get('thumbnail', ''),
        'price': body.get('price', 0),
        'status': body.get('status', 'draft'),
        'instructor': body.get('instructor', ''),
        'tags': body.get('tags', []),
        'entityType': 'COURSE',
        'createdAt': now,
        'updatedAt': now,
    }

    table = get_main_table()
    table.put_item(Item=course_item)

    return success({'course': course_item}, 201)


def get_course(event, course_id):
    table = get_main_table()

    # Query all items under this course: METADATA, MODULE#, LESSON#
    resp = table.query(
        KeyConditionExpression=Key('pk').eq(f'COURSE#{course_id}'),
    )
    items = resp.get('Items', [])

    if not items:
        return error('Course not found', 404)

    course = None
    modules = []
    lessons = []

    for item in items:
        sk = item.get('sk', '')
        if sk == 'METADATA':
            course = item
        elif sk.startswith('MODULE#'):
            modules.append(item)
        elif sk.startswith('LESSON#'):
            lessons.append(item)

    if not course:
        return error('Course not found', 404)

    # If not admin and course is not published, deny access
    if course.get('status') != 'published' and not _is_admin(event):
        return error('Course not found', 404)

    # Sort modules by order
    modules.sort(key=lambda m: m.get('sk', ''))

    # Group lessons by moduleId and sort by order
    lessons_by_module = {}
    for lesson in lessons:
        module_id = lesson.get('moduleId', '')
        if module_id not in lessons_by_module:
            lessons_by_module[module_id] = []
        lessons_by_module[module_id].append(lesson)

    for module_id in lessons_by_module:
        lessons_by_module[module_id].sort(key=lambda l: l.get('sk', ''))

    # Build hierarchical structure
    structured_modules = []
    for module in modules:
        module_id = module.get('moduleId', '')
        module_data = dict(module)
        module_data['lessons'] = lessons_by_module.get(module_id, [])
        structured_modules.append(module_data)

    course['modules'] = structured_modules

    return success({'course': course})


@require_admin
def update_course(event, course_id):
    body = _parse_body(event)

    table = get_main_table()
    resp = table.get_item(Key={'pk': f'COURSE#{course_id}', 'sk': 'METADATA'})
    course = resp.get('Item')

    if not course:
        return error('Course not found', 404)

    allowed_fields = [
        'title', 'description', 'shortDescription', 'category', 'level',
        'duration', 'thumbnail', 'price', 'status', 'instructor', 'tags', 'slug',
    ]
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

    # Auto-update slug if title changed
    if 'title' in body and 'slug' not in body:
        attr_values[':val_slug'] = _generate_slug(body['title'])
        attr_names['#f_slug'] = 'slug'
        update_parts.append('#f_slug = :val_slug')

    if not update_parts:
        return error('No valid fields to update', 400)

    attr_values[':now'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    update_parts.append('updatedAt = :now')

    table.update_item(
        Key={'pk': f'COURSE#{course_id}', 'sk': 'METADATA'},
        UpdateExpression='SET ' + ', '.join(update_parts),
        ExpressionAttributeValues=attr_values,
        ExpressionAttributeNames=attr_names,
    )

    resp = table.get_item(Key={'pk': f'COURSE#{course_id}', 'sk': 'METADATA'})
    updated_course = resp.get('Item', {})

    return success({'course': updated_course})


@require_admin
def delete_course(event, course_id):
    table = get_main_table()

    resp = table.get_item(Key={'pk': f'COURSE#{course_id}', 'sk': 'METADATA'})
    if not resp.get('Item'):
        return error('Course not found', 404)

    # Query all items under this course partition to delete them all
    query_resp = table.query(
        KeyConditionExpression=Key('pk').eq(f'COURSE#{course_id}'),
    )
    items = query_resp.get('Items', [])

    # Also find lessons stored under MODULE# partitions for modules in this course
    module_ids = []
    for item in items:
        sk = item.get('sk', '')
        if sk.startswith('MODULE#'):
            module_id = item.get('moduleId')
            if module_id:
                module_ids.append(module_id)

    # Delete lessons under each module partition
    for module_id in module_ids:
        mod_resp = table.query(
            KeyConditionExpression=Key('pk').eq(f'MODULE#{module_id}'),
        )
        for lesson_item in mod_resp.get('Items', []):
            table.delete_item(Key={'pk': lesson_item['pk'], 'sk': lesson_item['sk']})

    # Delete all items under course partition
    with table.batch_writer() as batch:
        for item in items:
            batch.delete_item(Key={'pk': item['pk'], 'sk': item['sk']})

    return success({'message': 'Course and all related items deleted successfully'})
