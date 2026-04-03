import json
import uuid
import time
import os
import boto3
from dynamo_client import get_main_table, get_activity_table, get_leads_table, ACTIVITY_TABLE
from response import success, error
from auth_utils import require_auth, require_admin, get_user_from_event
from boto3.dynamodb.conditions import Key


ses = boto3.client('ses')


def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', event.get('httpMethod', ''))
    path = event.get('requestContext', {}).get('http', {}).get('path', event.get('path', ''))

    if method == 'OPTIONS':
        return success({'message': 'OK'})

    path_parts = path.rstrip('/').split('/')

    if method == 'POST' and path == '/service-requests':
        return create_service_request(event)
    elif method == 'GET' and path == '/service-requests':
        return list_service_requests(event)
    elif method == 'GET' and len(path_parts) == 3 and path_parts[1] == 'service-requests':
        return get_service_request(event, path_parts[2])
    elif method == 'PATCH' and len(path_parts) == 3 and path_parts[1] == 'service-requests':
        return update_service_request_status(event, path_parts[2])

    return error('Route not found', 404)


def _parse_body(event):
    body = event.get('body', '{}')
    if isinstance(body, str):
        try:
            return json.loads(body)
        except (json.JSONDecodeError, TypeError):
            return {}
    return body or {}


def _get_user_from_event_safe(event):
    """Try to get user from event, return None if not authenticated."""
    try:
        context = event.get('requestContext', {})
        authorizer = context.get('authorizer', {})
        lambda_ctx = authorizer.get('lambda', authorizer)
        user_id = lambda_ctx.get('userId', '')
        if user_id:
            return {
                'sub': user_id,
                'email': lambda_ctx.get('email', ''),
                'role': lambda_ctx.get('role', 'student'),
            }
    except Exception:
        pass
    return None


def create_service_request(event):
    """Auth or public with email - create service request."""
    body = _parse_body(event)
    user = _get_user_from_event_safe(event)

    service_id = body.get('serviceId', '').strip()
    service_name = body.get('serviceName', '').strip()
    message = body.get('message', '').strip()
    company = body.get('company', '').strip()
    phone = body.get('phone', '').strip()

    # Get user info from auth or from body
    if user:
        user_id = user.get('sub')
        email = user.get('email') or body.get('email', '').strip()
        name = body.get('name', '').strip()
    else:
        email = body.get('email', '').strip().lower()
        name = body.get('name', '').strip()
        user_id = None
        if not email:
            return error('Email is required for unauthenticated requests', 400)
        if not name:
            return error('Name is required for unauthenticated requests', 400)

    if not service_name and not service_id:
        return error('serviceName or serviceId is required', 400)

    request_id = str(uuid.uuid4())
    lead_id = str(uuid.uuid4())
    now = int(time.time())
    iso_now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(now))

    request_data = {
        'requestId': request_id,
        'serviceId': service_id,
        'serviceName': service_name,
        'name': name,
        'email': email,
        'company': company,
        'phone': phone,
        'message': message,
        'status': 'pending',
        'entityType': 'SERVICE_REQUEST',
        'createdAt': iso_now,
        'updatedAt': iso_now,
    }
    if user_id:
        request_data['userId'] = user_id

    # Write to ActivityTable
    activity_table = get_activity_table()
    activity_item = {
        'pk': f'REQUEST#{request_id}',
        'sk': 'METADATA',
        **request_data,
    }
    activity_table.put_item(Item=activity_item)

    # Also write user-scoped record if authenticated
    if user_id:
        user_request_item = {
            'pk': f'USER#{user_id}',
            'sk': f'REQUEST#{request_id}',
            **request_data,
        }
        activity_table.put_item(Item=user_request_item)

    # Write to LeadsTable
    leads_table = get_leads_table()
    lead_item = {
        'pk': f'LEAD#{lead_id}',
        'sk': 'METADATA',
        'leadId': lead_id,
        'requestId': request_id,
        'name': name,
        'email': email,
        'company': company,
        'phone': phone,
        'serviceId': service_id,
        'serviceName': service_name,
        'message': message,
        'source': 'service_request',
        'status': 'new',
        'entityType': 'LEAD',
        'createdAt': iso_now,
        'updatedAt': iso_now,
    }
    leads_table.put_item(Item=lead_item)

    # Send SES notification to admin
    _send_admin_notification(service_name, name, email, company, message)

    return success({'message': 'Service request submitted', 'request': request_data}, 201)


def _send_admin_notification(service_name, name, email, company, message):
    try:
        email_body = f"""
        <h2>New Service Request: {service_name}</h2>
        <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 8px; font-weight: bold;">Name:</td><td style="padding: 8px;">{name}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;">{email}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Company:</td><td style="padding: 8px;">{company or 'N/A'}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Service:</td><td style="padding: 8px;">{service_name}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Message:</td><td style="padding: 8px;">{message or 'N/A'}</td></tr>
        </table>
        """
        ses.send_email(
            Source=os.environ['SES_FROM_EMAIL'],
            Destination={'ToAddresses': [os.environ['ADMIN_EMAIL']]},
            Message={
                'Subject': {'Data': f'New Service Request: {service_name}'},
                'Body': {'Html': {'Data': email_body}},
            },
        )
    except Exception:
        pass  # Don't fail the request if SES fails


@require_auth
def list_service_requests(event):
    user = get_user_from_event(event)
    user_id = user.get('sub')
    role = user.get('role', 'student')

    activity_table = get_activity_table()

    if role == 'admin':
        # Admin sees all service requests
        resp = activity_table.query(
            IndexName='GSI2-EntityTypeIndex',
            KeyConditionExpression=Key('entityType').eq('SERVICE_REQUEST'),
            ScanIndexForward=False,
        )
        requests = resp.get('Items', [])
    else:
        # User sees own requests
        resp = activity_table.query(
            KeyConditionExpression=Key('pk').eq(f'USER#{user_id}') & Key('sk').begins_with('REQUEST#')
        )
        requests = resp.get('Items', [])

    return success({'requests': requests, 'count': len(requests)})


@require_auth
def get_service_request(event, request_id):
    user = get_user_from_event(event)
    user_id = user.get('sub')
    role = user.get('role', 'student')

    activity_table = get_activity_table()
    resp = activity_table.get_item(Key={'pk': f'REQUEST#{request_id}', 'sk': 'METADATA'})
    request_item = resp.get('Item')

    if not request_item:
        return error('Service request not found', 404)

    if request_item.get('userId') != user_id and role != 'admin':
        return error('Forbidden', 403)

    return success({'request': request_item})


@require_admin
def update_service_request_status(event, request_id):
    body = _parse_body(event)
    new_status = body.get('status', '').strip()

    if not new_status:
        return error('status is required', 400)

    valid_statuses = ['pending', 'in-review', 'approved', 'rejected', 'completed']
    if new_status not in valid_statuses:
        return error(f'status must be one of: {", ".join(valid_statuses)}', 400)

    activity_table = get_activity_table()

    resp = activity_table.get_item(Key={'pk': f'REQUEST#{request_id}', 'sk': 'METADATA'})
    request_item = resp.get('Item')

    if not request_item:
        return error('Service request not found', 404)

    iso_now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    admin_notes = body.get('adminNotes', '')

    update_expr = 'SET #s = :status, updatedAt = :now'
    attr_values = {':status': new_status, ':now': iso_now}
    attr_names = {'#s': 'status'}

    if admin_notes:
        update_expr += ', adminNotes = :notes'
        attr_values[':notes'] = admin_notes

    activity_table.update_item(
        Key={'pk': f'REQUEST#{request_id}', 'sk': 'METADATA'},
        UpdateExpression=update_expr,
        ExpressionAttributeValues=attr_values,
        ExpressionAttributeNames=attr_names,
    )

    # Also update user-scoped record if userId exists
    user_id = request_item.get('userId')
    if user_id:
        try:
            activity_table.update_item(
                Key={'pk': f'USER#{user_id}', 'sk': f'REQUEST#{request_id}'},
                UpdateExpression=update_expr,
                ExpressionAttributeValues=attr_values,
                ExpressionAttributeNames=attr_names,
            )
        except Exception:
            pass

    updated = activity_table.get_item(Key={'pk': f'REQUEST#{request_id}', 'sk': 'METADATA'})
    return success({'message': 'Status updated', 'request': updated.get('Item')})
