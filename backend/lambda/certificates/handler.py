import json
import uuid
import time
import random
import string
from dynamo_client import get_main_table, get_activity_table, MAIN_TABLE
from response import success, error
from auth_utils import require_auth, require_admin, get_user_from_event
from boto3.dynamodb.conditions import Key


def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', event.get('httpMethod', ''))
    path = event.get('requestContext', {}).get('http', {}).get('path', event.get('path', ''))

    if method == 'OPTIONS':
        return success({'message': 'OK'})

    path_parts = path.rstrip('/').split('/')

    # POST /certificates
    if method == 'POST' and path == '/certificates':
        return create_certificate(event)

    # GET /certificates
    if method == 'GET' and path == '/certificates':
        return list_certificates(event)

    # GET /certificates/verify/{certificateNumber}
    if method == 'GET' and len(path_parts) == 4 and path_parts[2] == 'verify':
        return verify_certificate(event, path_parts[3])

    # GET /certificates/{certId}/download
    if method == 'GET' and len(path_parts) == 4 and path_parts[3] == 'download':
        return download_certificate(event, path_parts[2])

    # GET /certificates/{certId}
    if method == 'GET' and len(path_parts) == 3 and path_parts[1] == 'certificates':
        return get_certificate(event, path_parts[2])

    return error('Route not found', 404)


def _parse_body(event):
    body = event.get('body', '{}')
    if isinstance(body, str):
        try:
            return json.loads(body)
        except (json.JSONDecodeError, TypeError):
            return {}
    return body or {}


def _generate_cert_number():
    chars = string.ascii_uppercase + string.digits
    random_part = ''.join(random.choices(chars, k=6))
    return f'CLOUDAIP-{random_part}'


@require_admin
def create_certificate(event):
    body = _parse_body(event)

    user_id = body.get('userId', '').strip()
    course_id = body.get('courseId', '').strip()
    course_name = body.get('courseName', '').strip()
    user_name = body.get('userName', '').strip()

    if not user_id or not course_id:
        return error('userId and courseId are required', 400)

    cert_id = str(uuid.uuid4())
    cert_number = _generate_cert_number()
    now = int(time.time())
    iso_now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(now))

    cert_item = {
        'pk': f'CERT#{cert_id}',
        'sk': 'METADATA',
        'certId': cert_id,
        'certificateNumber': cert_number,
        'certUserId': user_id,
        'userId': user_id,
        'userName': user_name,
        'courseId': course_id,
        'courseName': course_name,
        'entityType': 'CERTIFICATE',
        'issuedAt': iso_now,
        'createdAt': iso_now,
    }

    main_table = get_main_table()
    main_table.put_item(Item=cert_item)

    return success({'message': 'Certificate generated', 'certificate': cert_item}, 201)


@require_auth
def list_certificates(event):
    user = get_user_from_event(event)
    user_id = user.get('sub')
    role = user.get('role', 'student')

    main_table = get_main_table()

    if role == 'admin':
        # Admin sees all certificates
        resp = main_table.query(
            IndexName='GSI3-EntityTypeIndex',
            KeyConditionExpression=Key('entityType').eq('CERTIFICATE'),
            ScanIndexForward=False,
        )
        certs = resp.get('Items', [])
    else:
        # User sees own certificates
        resp = main_table.query(
            IndexName='GSI8-UserCertIndex',
            KeyConditionExpression=Key('certUserId').eq(user_id),
            ScanIndexForward=False,
        )
        certs = resp.get('Items', [])

    return success({'certificates': certs, 'count': len(certs)})


@require_auth
def get_certificate(event, cert_id):
    user = get_user_from_event(event)
    user_id = user.get('sub')
    role = user.get('role', 'student')

    main_table = get_main_table()
    resp = main_table.get_item(Key={'pk': f'CERT#{cert_id}', 'sk': 'METADATA'})
    cert = resp.get('Item')

    if not cert:
        return error('Certificate not found', 404)

    if cert.get('userId') != user_id and role != 'admin':
        return error('Forbidden', 403)

    return success({'certificate': cert})


def verify_certificate(event, certificate_number):
    """Public endpoint - no auth required."""
    main_table = get_main_table()
    resp = main_table.query(
        IndexName='GSI7-CertNumberIndex',
        KeyConditionExpression=Key('certificateNumber').eq(certificate_number),
    )
    items = resp.get('Items', [])

    if not items:
        return error('Certificate not found', 404)

    cert = items[0]

    # Return limited public info
    return success({
        'valid': True,
        'certificate': {
            'certificateNumber': cert.get('certificateNumber'),
            'userName': cert.get('userName'),
            'courseName': cert.get('courseName'),
            'issuedAt': cert.get('issuedAt'),
        },
    })


@require_auth
def download_certificate(event, cert_id):
    user = get_user_from_event(event)
    user_id = user.get('sub')
    role = user.get('role', 'student')

    main_table = get_main_table()
    resp = main_table.get_item(Key={'pk': f'CERT#{cert_id}', 'sk': 'METADATA'})
    cert = resp.get('Item')

    if not cert:
        return error('Certificate not found', 404)

    if cert.get('userId') != user_id and role != 'admin':
        return error('Forbidden', 403)

    # Return full certificate data for client-side PDF generation
    return success({
        'certificate': {
            'certId': cert.get('certId'),
            'certificateNumber': cert.get('certificateNumber'),
            'userName': cert.get('userName'),
            'courseName': cert.get('courseName'),
            'courseId': cert.get('courseId'),
            'issuedAt': cert.get('issuedAt'),
        },
    })
