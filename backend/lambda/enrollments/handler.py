import json
import uuid
import time
from dynamo_client import get_main_table, get_activity_table, MAIN_TABLE, ACTIVITY_TABLE
from response import success, error
from auth_utils import require_auth, get_user_from_event
from boto3.dynamodb.conditions import Key, Attr


def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', event.get('httpMethod', ''))
    path = event.get('requestContext', {}).get('http', {}).get('path', event.get('path', ''))

    if method == 'OPTIONS':
        return success({'message': 'OK'})

    path_parts = path.rstrip('/').split('/')

    if method == 'POST' and path == '/enrollments':
        return create_enrollment(event)
    elif method == 'GET' and path == '/enrollments':
        return list_enrollments(event)
    elif method == 'GET' and len(path_parts) == 3 and path_parts[1] == 'enrollments':
        return get_enrollment(event, path_parts[2])

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
def create_enrollment(event):
    user = get_user_from_event(event)
    user_id = user.get('sub')
    body = _parse_body(event)

    course_id = body.get('courseId', '').strip()
    if not course_id:
        return error('courseId is required', 400)

    # Validate course exists
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

    enrollment_id = str(uuid.uuid4())
    now = int(time.time())
    iso_now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(now))

    enrollment_data = {
        'enrollmentId': enrollment_id,
        'userId': user_id,
        'courseId': course_id,
        'courseName': course.get('title', ''),
        'status': 'active',
        'progress': 0,
        'entityType': 'ENROLLMENT',
        'enrolledAt': iso_now,
        'createdAt': iso_now,
        'updatedAt': iso_now,
    }

    # Write to MainTable (primary enrollment record)
    main_item = {
        'pk': f'ENROLLMENT#{enrollment_id}',
        'sk': 'METADATA',
        **enrollment_data,
    }
    main_table.put_item(Item=main_item)

    # Write to ActivityTable (user-enrollment lookup)
    activity_item = {
        'pk': f'USER#{user_id}',
        'sk': f'ENROLLMENT#{course_id}',
        **enrollment_data,
    }
    activity_table.put_item(Item=activity_item)

    return success({'message': 'Enrollment successful', 'enrollment': enrollment_data}, 201)


@require_auth
def list_enrollments(event):
    user = get_user_from_event(event)
    user_id = user.get('sub')

    activity_table = get_activity_table()

    resp = activity_table.query(
        KeyConditionExpression=Key('pk').eq(f'USER#{user_id}') & Key('sk').begins_with('ENROLLMENT#')
    )

    enrollments = resp.get('Items', [])

    # Handle pagination
    while 'LastEvaluatedKey' in resp:
        resp = activity_table.query(
            KeyConditionExpression=Key('pk').eq(f'USER#{user_id}') & Key('sk').begins_with('ENROLLMENT#'),
            ExclusiveStartKey=resp['LastEvaluatedKey'],
        )
        enrollments.extend(resp.get('Items', []))

    return success({'enrollments': enrollments, 'count': len(enrollments)})


@require_auth
def get_enrollment(event, enrollment_id):
    user = get_user_from_event(event)
    user_id = user.get('sub')
    role = user.get('role', 'student')

    main_table = get_main_table()
    resp = main_table.get_item(Key={'pk': f'ENROLLMENT#{enrollment_id}', 'sk': 'METADATA'})
    enrollment = resp.get('Item')

    if not enrollment:
        return error('Enrollment not found', 404)

    # Only allow owner or admin to view
    if enrollment.get('userId') != user_id and role != 'admin':
        return error('Forbidden', 403)

    return success({'enrollment': enrollment})
