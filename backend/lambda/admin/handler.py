import json
import time
import boto3
from concurrent.futures import ThreadPoolExecutor
from dynamo_client import get_main_table, get_activity_table, MAIN_TABLE, ACTIVITY_TABLE
from response import success, error
from auth_utils import require_admin
from boto3.dynamodb.conditions import Key


def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', event.get('httpMethod', ''))
    path = event.get('requestContext', {}).get('http', {}).get('path', event.get('path', ''))

    if method == 'OPTIONS':
        return success({'message': 'OK'})

    if method == 'GET' and path == '/admin/stats':
        return get_dashboard_stats(event)
    elif method == 'GET' and path == '/admin/recent-activity':
        return get_recent_activity(event)

    return error('Route not found', 404)


def _count_by_entity_type(table, index_name, entity_type):
    """Count items of a given entity type using a GSI."""
    resp = table.query(
        IndexName=index_name,
        KeyConditionExpression=Key('entityType').eq(entity_type),
        Select='COUNT',
    )
    count = resp.get('Count', 0)
    while 'LastEvaluatedKey' in resp:
        resp = table.query(
            IndexName=index_name,
            KeyConditionExpression=Key('entityType').eq(entity_type),
            Select='COUNT',
            ExclusiveStartKey=resp['LastEvaluatedKey'],
        )
        count += resp.get('Count', 0)
    return count


@require_admin
def get_dashboard_stats(event):
    main_table = get_main_table()
    activity_table = get_activity_table()

    # Run count queries in parallel using threads
    stats = {}

    def count_main(entity_type, key):
        stats[key] = _count_by_entity_type(main_table, 'GSI3-EntityTypeIndex', entity_type)

    def count_activity(entity_type, key):
        stats[key] = _count_by_entity_type(activity_table, 'GSI2-EntityTypeIndex', entity_type)

    with ThreadPoolExecutor(max_workers=6) as executor:
        executor.submit(count_main, 'USER', 'totalUsers')
        executor.submit(count_main, 'COURSE', 'totalCourses')
        executor.submit(count_main, 'SERVICE', 'totalServices')
        executor.submit(count_main, 'CERTIFICATE', 'totalCertificates')
        executor.submit(count_activity, 'ENROLLMENT', 'totalEnrollments')
        executor.submit(count_activity, 'PAYMENT', 'totalPayments')
        executor.submit(count_activity, 'SERVICE_REQUEST', 'totalServiceRequests')

    # Get active enrollment count
    try:
        resp = activity_table.query(
            IndexName='GSI3-StatusIndex',
            KeyConditionExpression=Key('status').eq('active'),
            Select='COUNT',
        )
        stats['activeEnrollments'] = resp.get('Count', 0)
    except Exception:
        stats['activeEnrollments'] = 0

    # Get pending service requests count
    try:
        resp = activity_table.query(
            IndexName='GSI3-StatusIndex',
            KeyConditionExpression=Key('status').eq('pending'),
            Select='COUNT',
        )
        stats['pendingRequests'] = resp.get('Count', 0)
    except Exception:
        stats['pendingRequests'] = 0

    return success({'stats': stats})


@require_admin
def get_recent_activity(event):
    params = event.get('queryStringParameters') or {}
    limit = min(int(params.get('limit', '20')), 50)

    activity_table = get_activity_table()

    entity_types = ['ENROLLMENT', 'PAYMENT', 'SERVICE_REQUEST', 'PROGRESS']
    all_items = []

    # Query recent items from each entity type
    for entity_type in entity_types:
        try:
            resp = activity_table.query(
                IndexName='GSI2-EntityTypeIndex',
                KeyConditionExpression=Key('entityType').eq(entity_type),
                ScanIndexForward=False,
                Limit=limit,
            )
            items = resp.get('Items', [])
            for item in items:
                item['_activityType'] = entity_type
            all_items.extend(items)
        except Exception:
            pass

    # Sort all items by createdAt descending
    all_items.sort(key=lambda x: x.get('createdAt', ''), reverse=True)

    # Trim to limit
    all_items = all_items[:limit]

    return success({'activities': all_items, 'count': len(all_items)})
