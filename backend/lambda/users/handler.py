import json
import time
from dynamo_client import get_main_table
from response import success, error
from auth_utils import require_admin
from pagination import paginated_query
from boto3.dynamodb.conditions import Key


def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', event.get('httpMethod', ''))
    path = event.get('requestContext', {}).get('http', {}).get('path', event.get('path', ''))

    if method == 'OPTIONS':
        return success({'message': 'OK'})

    path_params = event.get('pathParameters') or {}
    user_id = path_params.get('userId')

    if method == 'GET' and not user_id:
        return list_users(event)
    elif method == 'GET' and user_id:
        return get_user(event, user_id)
    elif method == 'PUT' and user_id:
        return update_user(event, user_id)
    elif method == 'DELETE' and user_id:
        return delete_user(event, user_id)

    return error('Route not found', 404)


def _parse_body(event):
    body = event.get('body', '{}')
    if isinstance(body, str):
        try:
            return json.loads(body)
        except (json.JSONDecodeError, TypeError):
            return {}
    return body or {}


def _strip_password(user):
    return {k: v for k, v in user.items() if k != 'password'}


@require_admin
def list_users(event):
    params = event.get('queryStringParameters') or {}
    role = params.get('role')

    if role:
        query_kwargs = {
            'IndexName': 'GSI10-RoleIndex',
            'KeyConditionExpression': Key('role').eq(role),
            'ScanIndexForward': False,
        }
    else:
        query_kwargs = {
            'IndexName': 'GSI3-EntityTypeIndex',
            'KeyConditionExpression': Key('entityType').eq('USER'),
            'ScanIndexForward': False,
        }

    table = get_main_table()
    result = paginated_query(table, query_kwargs, params)

    result['items'] = [_strip_password(u) for u in result.get('items', [])]

    return success(result)


@require_admin
def get_user(event, user_id):
    table = get_main_table()
    resp = table.get_item(Key={'pk': f'USER#{user_id}', 'sk': 'PROFILE'})
    user = resp.get('Item')

    if not user:
        return error('User not found', 404)

    return success({'user': _strip_password(user)})


@require_admin
def update_user(event, user_id):
    body = _parse_body(event)

    table = get_main_table()
    resp = table.get_item(Key={'pk': f'USER#{user_id}', 'sk': 'PROFILE'})
    user = resp.get('Item')

    if not user:
        return error('User not found', 404)

    allowed_fields = ['name', 'role', 'emailVerified', 'phone', 'bio', 'avatar', 'status']
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
        Key={'pk': f'USER#{user_id}', 'sk': 'PROFILE'},
        UpdateExpression='SET ' + ', '.join(update_parts),
        ExpressionAttributeValues=attr_values,
        ExpressionAttributeNames=attr_names if attr_names else None,
    )

    resp = table.get_item(Key={'pk': f'USER#{user_id}', 'sk': 'PROFILE'})
    updated_user = resp.get('Item', {})

    return success({'user': _strip_password(updated_user)})


@require_admin
def delete_user(event, user_id):
    table = get_main_table()
    resp = table.get_item(Key={'pk': f'USER#{user_id}', 'sk': 'PROFILE'})
    user = resp.get('Item')

    if not user:
        return error('User not found', 404)

    table.delete_item(Key={'pk': f'USER#{user_id}', 'sk': 'PROFILE'})

    return success({'message': 'User deleted successfully'})
