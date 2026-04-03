import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const sesClient = new SESClient({});

const TABLE_NAME = process.env.TABLE_NAME;
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const MAX_LENGTHS = {
  name: 200,
  email: 320,
  company: 300,
  spendRange: 100,
  message: 5000,
  contactMethod: 50,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitize(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')   // strip HTML tags
    .trim()
    .slice(0, maxLength);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  return EMAIL_RE.test(email);
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

// ---------------------------------------------------------------------------
// Notification email
// ---------------------------------------------------------------------------

async function sendNotificationEmail(lead) {
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #1a1a2e; background: #f4f4f8; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px 32px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; }
    .body { padding: 24px 32px; }
    .field { margin-bottom: 16px; }
    .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px; }
    .value { font-size: 15px; color: #1a1a2e; }
    .footer { padding: 16px 32px; background: #f9fafb; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Lead from CloudAIP</h1>
    </div>
    <div class="body">
      <div class="field">
        <div class="label">Name</div>
        <div class="value">${escapeHtml(lead.name)}</div>
      </div>
      <div class="field">
        <div class="label">Email</div>
        <div class="value">${escapeHtml(lead.email)}</div>
      </div>
      <div class="field">
        <div class="label">Company</div>
        <div class="value">${escapeHtml(lead.company)}</div>
      </div>
      <div class="field">
        <div class="label">Monthly Cloud Spend</div>
        <div class="value">${escapeHtml(lead.spendRange || 'Not specified')}</div>
      </div>
      <div class="field">
        <div class="label">Preferred Contact Method</div>
        <div class="value">${escapeHtml(lead.contactMethod || 'Not specified')}</div>
      </div>
      <div class="field">
        <div class="label">Message</div>
        <div class="value">${escapeHtml(lead.message || 'No message provided')}</div>
      </div>
    </div>
    <div class="footer">
      Lead ID: ${lead.leadId} &middot; Received: ${lead.createdAt}
    </div>
  </div>
</body>
</html>`;

  const params = {
    Source: SES_FROM_EMAIL,
    Destination: { ToAddresses: [ADMIN_EMAIL] },
    Message: {
      Subject: { Data: `New CloudAIP Lead: ${lead.name} (${lead.company})`, Charset: 'UTF-8' },
      Body: {
        Html: { Data: htmlBody, Charset: 'UTF-8' },
        Text: {
          Data: [
            `New Lead from CloudAIP`,
            `----------------------`,
            `Name: ${lead.name}`,
            `Email: ${lead.email}`,
            `Company: ${lead.company}`,
            `Spend Range: ${lead.spendRange || 'N/A'}`,
            `Contact Method: ${lead.contactMethod || 'N/A'}`,
            `Message: ${lead.message || 'N/A'}`,
            ``,
            `Lead ID: ${lead.leadId}`,
            `Received: ${lead.createdAt}`,
          ].join('\n'),
          Charset: 'UTF-8',
        },
      },
    },
  };

  await sesClient.send(new SendEmailCommand(params));
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const handler = async (event) => {
  try {
    // Parse body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return response(400, { success: false, error: 'Invalid JSON body.' });
    }

    // Sanitize inputs
    const name = sanitize(body.name, MAX_LENGTHS.name);
    const email = sanitize(body.email, MAX_LENGTHS.email);
    const company = sanitize(body.company, MAX_LENGTHS.company);
    const spendRange = sanitize(body.spendRange, MAX_LENGTHS.spendRange);
    const message = sanitize(body.message, MAX_LENGTHS.message);
    const contactMethod = sanitize(body.contactMethod, MAX_LENGTHS.contactMethod);

    // Validate required fields
    const errors = [];
    if (!name) errors.push('Name is required.');
    if (!email) errors.push('Email is required.');
    if (!company) errors.push('Company is required.');

    if (email && !validateEmail(email)) {
      errors.push('Please provide a valid email address.');
    }

    if (errors.length > 0) {
      return response(400, { success: false, errors });
    }

    // Build lead record
    const now = new Date();
    const lead = {
      leadId: crypto.randomUUID(),
      name,
      email,
      company,
      spendRange: spendRange || null,
      message: message || null,
      contactMethod: contactMethod || null,
      status: 'new',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      source: 'website',
      ttl: Math.floor(now.getTime() / 1000) + 90 * 24 * 60 * 60, // 90 days
    };

    // Persist to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: lead,
      }),
    );

    // Send admin notification (best-effort; don't fail the request)
    try {
      await sendNotificationEmail(lead);
    } catch (emailErr) {
      console.error('Failed to send notification email:', emailErr);
    }

    return response(200, {
      success: true,
      message: "Thank you! We'll be in touch within 24 hours.",
    });
  } catch (err) {
    console.error('Unhandled error:', err);
    return response(500, {
      success: false,
      error: 'An internal error occurred. Please try again later.',
    });
  }
};
