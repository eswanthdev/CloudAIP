import json
import time
from dynamo_client import get_main_table, get_activity_table, ACTIVITY_TABLE
from response import success, error
from auth_utils import require_auth, get_user_from_event
from boto3.dynamodb.conditions import Key


def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', event.get('httpMethod', ''))
    path = event.get('requestContext', {}).get('http', {}).get('path', event.get('path', ''))

    if method == 'OPTIONS':
        return success({'message': 'OK'})

    path_parts = path.rstrip('/').split('/')

    if method == 'POST' and path == '/progress':
        return update_progress(event)
    elif method == 'GET' and path == '/progress/summary':
        return get_progress_summary(event)
    elif method == 'GET' and len(path_parts) == 3 and path_parts[1] == 'progress':
        return get_course_progress(event, path_parts[2])

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
def update_progress(event):
    user = get_user_from_event(event)
    user_id = user.get('sub')
    body = _parse_body(event)

    course_id = body.get('courseId', '').strip()
    lesson_id = body.get('lessonId', '').strip()
    status = body.get('status', 'completed')

    if not course_id or not lesson_id:
        return error('courseId and lessonId are required', 400)

    if status not in ('completed', 'in-progress'):
        return error('status must be completed or in-progress', 400)

    now = int(time.time())
    iso_now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(now))

    activity_table = get_activity_table()

    progress_item = {
        'pk': f'USER#{user_id}',
        'sk': f'PROGRESS#{course_id}#{lesson_id}',
        'userId': user_id,
        'courseId': course_id,
        'lessonId': lesson_id,
        'status': status,
        'entityType': 'PROGRESS',
        'updatedAt': iso_now,
    }

    if status == 'completed':
        progress_item['completedAt'] = iso_now

    activity_table.put_item(Item=progress_item)

    # Check if all lessons in the course are completed to auto-complete enrollment
    completion_info = _check_course_completion(user_id, course_id)

    return success({
        'message': 'Progress updated',
        'progress': progress_item,
        'courseCompletion': completion_info,
    })


def _check_course_completion(user_id, course_id):
    """Check if all lessons in a course are completed and update enrollment if so."""
    activity_table = get_activity_table()
    main_table = get_main_table()

    # Get all progress items for this course
    resp = activity_table.query(
        KeyConditionExpression=Key('pk').eq(f'USER#{user_id}') & Key('sk').begins_with(f'PROGRESS#{course_id}#')
    )
    progress_items = resp.get('Items', [])
    completed_lessons = [p for p in progress_items if p.get('status') == 'completed']

    # Get total lesson count from course metadata
    course_resp = main_table.get_item(Key={'pk': f'COURSE#{course_id}', 'sk': 'METADATA'})
    course = course_resp.get('Item')
    if not course:
        return {'completed': False, 'completedLessons': len(completed_lessons), 'totalLessons': 0}

    total_lessons = int(course.get('totalLessons', 0))
    if total_lessons == 0:
        return {'completed': False, 'completedLessons': len(completed_lessons), 'totalLessons': 0}

    progress_pct = int((len(completed_lessons) / total_lessons) * 100)
    all_done = len(completed_lessons) >= total_lessons

    iso_now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

    # Update enrollment progress in ActivityTable
    try:
        activity_table.update_item(
            Key={'pk': f'USER#{user_id}', 'sk': f'ENROLLMENT#{course_id}'},
            UpdateExpression='SET progress = :pct, updatedAt = :now' + (', #s = :status, completedAt = :completedAt' if all_done else ''),
            ExpressionAttributeValues={
                ':pct': progress_pct,
                ':now': iso_now,
                **(
                    {':status': 'completed', ':completedAt': iso_now}
                    if all_done else {}
                ),
            },
            ExpressionAttributeNames={'#s': 'status'} if all_done else {},
        )
    except Exception:
        pass  # Enrollment may not exist yet in edge cases

    # Also update MainTable enrollment record
    enrollment_resp = activity_table.get_item(
        Key={'pk': f'USER#{user_id}', 'sk': f'ENROLLMENT#{course_id}'}
    )
    enrollment = enrollment_resp.get('Item')
    if enrollment and enrollment.get('enrollmentId'):
        try:
            update_expr = 'SET progress = :pct, updatedAt = :now'
            attr_values = {':pct': progress_pct, ':now': iso_now}
            attr_names = {}
            if all_done:
                update_expr += ', #s = :status, completedAt = :completedAt'
                attr_values[':status'] = 'completed'
                attr_values[':completedAt'] = iso_now
                attr_names['#s'] = 'status'

            main_table.update_item(
                Key={'pk': f'ENROLLMENT#{enrollment["enrollmentId"]}', 'sk': 'METADATA'},
                UpdateExpression=update_expr,
                ExpressionAttributeValues=attr_values,
                **({"ExpressionAttributeNames": attr_names} if attr_names else {}),
            )
        except Exception:
            pass

    return {
        'completed': all_done,
        'completedLessons': len(completed_lessons),
        'totalLessons': total_lessons,
        'progressPercent': progress_pct,
    }


@require_auth
def get_course_progress(event, course_id):
    user = get_user_from_event(event)
    user_id = user.get('sub')

    activity_table = get_activity_table()
    resp = activity_table.query(
        KeyConditionExpression=Key('pk').eq(f'USER#{user_id}') & Key('sk').begins_with(f'PROGRESS#{course_id}#')
    )
    progress_items = resp.get('Items', [])

    completed = [p for p in progress_items if p.get('status') == 'completed']

    return success({
        'courseId': course_id,
        'lessons': progress_items,
        'completedCount': len(completed),
        'totalTracked': len(progress_items),
    })


@require_auth
def get_progress_summary(event):
    user = get_user_from_event(event)
    user_id = user.get('sub')

    activity_table = get_activity_table()
    resp = activity_table.query(
        KeyConditionExpression=Key('pk').eq(f'USER#{user_id}') & Key('sk').begins_with('PROGRESS#')
    )
    progress_items = resp.get('Items', [])

    while 'LastEvaluatedKey' in resp:
        resp = activity_table.query(
            KeyConditionExpression=Key('pk').eq(f'USER#{user_id}') & Key('sk').begins_with('PROGRESS#'),
            ExclusiveStartKey=resp['LastEvaluatedKey'],
        )
        progress_items.extend(resp.get('Items', []))

    # Group by course
    courses = {}
    for item in progress_items:
        cid = item.get('courseId', 'unknown')
        if cid not in courses:
            courses[cid] = {'courseId': cid, 'completed': 0, 'inProgress': 0, 'total': 0}
        courses[cid]['total'] += 1
        if item.get('status') == 'completed':
            courses[cid]['completed'] += 1
        else:
            courses[cid]['inProgress'] += 1

    return success({
        'summary': list(courses.values()),
        'totalLessonsTracked': len(progress_items),
        'totalCompleted': sum(c['completed'] for c in courses.values()),
    })
