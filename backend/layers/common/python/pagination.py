import json
import base64

def encode_cursor(last_evaluated_key):
    if not last_evaluated_key:
        return None
    return base64.urlsafe_b64encode(json.dumps(last_evaluated_key).encode()).decode()

def decode_cursor(cursor):
    if not cursor:
        return None
    try:
        return json.loads(base64.urlsafe_b64decode(cursor.encode()).decode())
    except Exception:
        return None

def paginated_query(table, cursor=None, limit=20, **kwargs):
    params = {**kwargs, 'Limit': limit}
    if cursor:
        start_key = decode_cursor(cursor)
        if start_key:
            params['ExclusiveStartKey'] = start_key

    response = table.query(**params)
    items = response.get('Items', [])
    next_cursor = encode_cursor(response.get('LastEvaluatedKey'))

    return {
        'items': items,
        'nextCursor': next_cursor,
        'count': len(items)
    }
