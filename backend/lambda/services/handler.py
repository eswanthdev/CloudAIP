import json
import uuid
import time
from dynamo_client import get_main_table, MAIN_TABLE
from response import success, error
from auth_utils import require_admin
from boto3.dynamodb.conditions import Key


def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', event.get('httpMethod', ''))
    path = event.get('requestContext', {}).get('http', {}).get('path', event.get('path', ''))

    if method == 'OPTIONS':
        return success({'message': 'OK'})

    path_parts = path.rstrip('/').split('/')

    if method == 'GET' and path == '/services':
        return list_services(event)
    elif method == 'POST' and path == '/services':
        return create_service(event)
    elif method == 'GET' and len(path_parts) == 3 and path_parts[1] == 'services':
        return get_service(event, path_parts[2])
    elif method == 'PUT' and len(path_parts) == 3 and path_parts[1] == 'services':
        return update_service(event, path_parts[2])
    elif method == 'DELETE' and len(path_parts) == 3 and path_parts[1] == 'services':
        return delete_service(event, path_parts[2])

    return error('Route not found', 404)


def _parse_body(event):
    body = event.get('body', '{}')
    if isinstance(body, str):
        try:
            return json.loads(body)
        except (json.JSONDecodeError, TypeError):
            return {}
    return body or {}


def list_services(event):
    """Public endpoint - list all active services."""
    main_table = get_main_table()

    resp = main_table.query(
        IndexName='GSI9-ServiceListIndex',
        KeyConditionExpression=Key('serviceEntityType').eq('SERVICE'),
        ScanIndexForward=True,
    )
    services = resp.get('Items', [])

    # Filter only active services
    active_services = [s for s in services if s.get('status', 'active') == 'active']

    return success({'services': active_services, 'count': len(active_services)})


@require_admin
def create_service(event):
    body = _parse_body(event)

    title = body.get('title', '').strip()
    description = body.get('description', '').strip()
    category = body.get('category', '').strip()
    price = body.get('price')
    features = body.get('features', [])
    service_order = body.get('serviceOrder', 0)

    if not title:
        return error('title is required', 400)

    service_id = str(uuid.uuid4())
    now = int(time.time())
    iso_now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(now))

    service_item = {
        'pk': f'SERVICE#{service_id}',
        'sk': 'METADATA',
        'serviceId': service_id,
        'title': title,
        'description': description,
        'category': category,
        'price': price,
        'features': features,
        'serviceEntityType': 'SERVICE',
        'serviceOrder': service_order,
        'entityType': 'SERVICE',
        'status': 'active',
        'createdAt': iso_now,
        'updatedAt': iso_now,
    }

    main_table = get_main_table()
    main_table.put_item(Item=service_item)

    return success({'message': 'Service created', 'service': service_item}, 201)


def get_service(event, service_id):
    """Public endpoint - get service detail."""
    main_table = get_main_table()
    resp = main_table.get_item(Key={'pk': f'SERVICE#{service_id}', 'sk': 'METADATA'})
    service = resp.get('Item')

    if not service:
        return error('Service not found', 404)

    return success({'service': service})


@require_admin
def update_service(event, service_id):
    body = _parse_body(event)
    main_table = get_main_table()

    # Verify service exists
    resp = main_table.get_item(Key={'pk': f'SERVICE#{service_id}', 'sk': 'METADATA'})
    if not resp.get('Item'):
        return error('Service not found', 404)

    iso_now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

    allowed_fields = ['title', 'description', 'category', 'price', 'features', 'serviceOrder', 'status']
    update_parts = ['updatedAt = :now']
    attr_values = {':now': iso_now}
    attr_names = {}

    for field in allowed_fields:
        if field in body:
            safe_key = f'#{field}'
            val_key = f':{field}'
            update_parts.append(f'{safe_key} = {val_key}')
            attr_values[val_key] = body[field]
            attr_names[safe_key] = field

    main_table.update_item(
        Key={'pk': f'SERVICE#{service_id}', 'sk': 'METADATA'},
        UpdateExpression='SET ' + ', '.join(update_parts),
        ExpressionAttributeValues=attr_values,
        **({"ExpressionAttributeNames": attr_names} if attr_names else {}),
    )

    # Fetch and return updated item
    updated = main_table.get_item(Key={'pk': f'SERVICE#{service_id}', 'sk': 'METADATA'})
    return success({'message': 'Service updated', 'service': updated.get('Item')})


@require_admin
def delete_service(event, service_id):
    main_table = get_main_table()

    resp = main_table.get_item(Key={'pk': f'SERVICE#{service_id}', 'sk': 'METADATA'})
    if not resp.get('Item'):
        return error('Service not found', 404)

    # Soft delete - mark as inactive
    iso_now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    main_table.update_item(
        Key={'pk': f'SERVICE#{service_id}', 'sk': 'METADATA'},
        UpdateExpression='SET #s = :status, updatedAt = :now',
        ExpressionAttributeValues={':status': 'inactive', ':now': iso_now},
        ExpressionAttributeNames={'#s': 'status'},
    )

    return success({'message': 'Service deleted'})
