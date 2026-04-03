const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak
} = require("docx");

// ── Color palette ──
const NAVY = "0A0E27";
const DARK_BLUE = "111638";
const MEDIUM_BLUE = "1E2A5A";
const CYAN = "00D4FF";
const TEAL = "0891B2";
const WHITE = "FFFFFF";
const LIGHT_GRAY = "CBD5E1";
const MUTED = "94A3B8";
const ACCENT_BG = "0F1729";
const HEADER_BG = "0D1B3E";
const ROW_ALT = "0A1628";

// ── Reusable helpers ──
const border = { style: BorderStyle.SINGLE, size: 1, color: MEDIUM_BLUE };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: WHITE };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function headerCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: HEADER_BG, type: ShadingType.CLEAR },
    margins: cellMargins,
    verticalAlign: "center",
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, font: "Arial", size: 20, color: CYAN })] })],
  });
}

function dataCell(text, width, alt = false) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: alt ? ROW_ALT : DARK_BLUE, type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 18, color: LIGHT_GRAY })] })],
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 32, color: CYAN })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 26, color: WHITE })],
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 22, color: TEAL })],
  });
}

function bodyText(text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 20, color: LIGHT_GRAY })],
  });
}

function bulletItem(text, ref = "bullets") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: "Arial", size: 20, color: LIGHT_GRAY })],
  });
}

function spacer() {
  return new Paragraph({ spacing: { after: 100 }, children: [] });
}

function makeTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    children: headers.map((h, i) => headerCell(h, colWidths[i])),
  });
  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell, ci) => dataCell(cell, colWidths[ci], ri % 2 === 1)),
    })
  );
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

// ── Section builders ──

function titlePage() {
  return [
    new Paragraph({ spacing: { before: 3000 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "CloudAIP", font: "Arial", size: 72, bold: true, color: CYAN })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: "_______________________________________________", font: "Arial", size: 20, color: MEDIUM_BLUE })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: "Technical Infrastructure Document", font: "Arial", size: 36, color: WHITE })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: "Version 1.0  |  March 2026", font: "Arial", size: 22, color: MUTED })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "CONFIDENTIAL", font: "Arial", size: 24, bold: true, color: "FF6B6B" })],
    }),
    new Paragraph({ spacing: { before: 1200 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: "Prepared by: CloudAIP Infrastructure Team", font: "Arial", size: 18, color: MUTED })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: "Bangalore, India", font: "Arial", size: 18, color: MUTED })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "hello@cloudaip.com  |  cloudaip.com", font: "Arial", size: 18, color: TEAL })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function tocSection() {
  return [
    heading1("Table of Contents"),
    new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function executiveSummary() {
  return [
    heading1("1. Executive Summary"),
    bodyText("CloudAIP is a FinOps consulting and cloud certification training company headquartered in Bangalore, India, serving clients globally. Founded by a cloud architect with 10+ years of experience and certifications across AWS, Azure, GCP, and the FinOps Foundation, CloudAIP helps mid-size companies (50\u2013500 employees) optimize their cloud spending and upskill their teams."),
    bodyText("The CloudAIP platform is built on a fully serverless AWS architecture, designed for maximum scalability, minimal operational overhead, and cost efficiency. The infrastructure supports a public-facing marketing website, lead capture and management system, and training enrollment platform."),
    heading2("Target Audience"),
    bulletItem("CTOs, VPs of Engineering, and cloud teams at mid-size companies"),
    bulletItem("Organizations spending $10,000+ per month on cloud infrastructure"),
    bulletItem("Companies seeking to implement FinOps practices and reduce cloud waste"),
    heading2("Key Platform Capabilities"),
    bulletItem("Production-grade marketing website with sub-second global load times"),
    bulletItem("Interactive ROI calculator for cloud savings estimation"),
    bulletItem("Lead capture and CRM integration with automated email notifications"),
    bulletItem("Training enrollment and batch management system"),
    bulletItem("Admin dashboard for lead tracking and pipeline management"),
    heading2("Revenue Model"),
    bulletItem("6 FinOps consulting services ranging from $900 to $6,000/month"),
    bulletItem("4 bundled service packages ($2,500 to custom enterprise pricing)"),
    bulletItem("8 cloud certification training programs ($75 to $299)"),
    bulletItem("Monthly revenue target: $30,000 through combined services and training"),
    spacer(),
  ];
}

function architectureOverview() {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    heading1("2. Architecture Overview"),
    bodyText("The CloudAIP platform employs a fully serverless architecture deployed in the AWS ap-south-1 (Mumbai) region. This architecture eliminates server management overhead, provides automatic scaling, and ensures pay-per-use cost efficiency."),
    heading2("2.1 High-Level Architecture"),
    bodyText("The system is organized into five distinct tiers:"),
    spacer(),
    makeTable(
      ["Tier", "Components", "Purpose"],
      [
        ["Client Tier", "Web Browsers, Mobile Devices", "End-user access via HTTPS"],
        ["Edge Tier", "Route 53, CloudFront, WAF, ACM", "DNS, CDN, security, SSL termination"],
        ["Hosting Tier", "S3, API Gateway", "Static content serving, API routing"],
        ["Compute Tier", "Lambda Functions (Node.js 20.x)", "Business logic execution"],
        ["Data Tier", "DynamoDB, SES, CloudWatch", "Persistence, notifications, monitoring"],
      ],
      [2200, 3800, 3360]
    ),
    heading2("2.2 Request Flow"),
    bodyText("Static Content Flow:"),
    bulletItem("Client browser requests cloudaip.com"),
    bulletItem("Route 53 resolves DNS to CloudFront distribution"),
    bulletItem("CloudFront serves cached content from nearest edge location"),
    bulletItem("On cache miss, CloudFront fetches from S3 origin bucket"),
    spacer(),
    bodyText("API Request Flow:"),
    bulletItem("Client submits form data via JavaScript fetch() to /api/* endpoint"),
    bulletItem("CloudFront routes API requests to API Gateway origin"),
    bulletItem("API Gateway validates request and invokes appropriate Lambda function"),
    bulletItem("Lambda processes request, writes to DynamoDB, triggers SES notification"),
    bulletItem("Response flows back through API Gateway to client"),
    spacer(),
  ];
}

function infraComponents() {
  const sections = [];
  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    heading1("3. Infrastructure Components"),
    bodyText("This section provides detailed specifications for each AWS service used in the CloudAIP platform."),
  );

  // 3.1 S3
  sections.push(
    heading2("3.1 Amazon S3 \u2014 Static Website Hosting"),
    makeTable(
      ["Property", "Value"],
      [
        ["Bucket Name", "cloudaip-website"],
        ["Region", "ap-south-1 (Mumbai)"],
        ["Purpose", "Host static HTML, CSS, JavaScript, and asset files"],
        ["Static Hosting", "Enabled with index.html as default document"],
        ["Bucket Policy", "Public read access for all objects"],
        ["Versioning", "Enabled for rollback capability"],
        ["Encryption", "SSE-S3 (AES-256) server-side encryption"],
        ["Access Logging", "Enabled to separate logging bucket"],
        ["Lifecycle Rules", "Previous versions deleted after 30 days"],
      ],
      [3200, 6160]
    ),
    spacer(),
    bodyText("Content Structure:"),
    bulletItem("index.html \u2014 Main landing page"),
    bulletItem("css/styles.css \u2014 Global stylesheet (39KB)"),
    bulletItem("js/main.js \u2014 Interactive functionality (24KB)"),
    bulletItem("pages/*.html \u2014 About, Training, Pricing, Blog, Admin pages"),
    bulletItem("pages/services/*.html \u2014 Individual service detail pages"),
    bulletItem("assets/ \u2014 Images, favicon, and static resources"),
  );

  // 3.2 CloudFront
  sections.push(
    spacer(),
    heading2("3.2 Amazon CloudFront \u2014 Content Delivery Network"),
    makeTable(
      ["Property", "Value"],
      [
        ["Distribution Type", "Web Distribution"],
        ["Origin", "S3 bucket (cloudaip-website.s3.ap-south-1.amazonaws.com)"],
        ["Origin Access", "Origin Access Identity (OAI) for secure S3 access"],
        ["SSL/TLS", "ACM certificate for cloudaip.com (TLS 1.2 minimum)"],
        ["Price Class", "PriceClass_200 (Asia, US, Europe coverage)"],
        ["Default TTL", "86400 seconds (24 hours) for static assets"],
        ["HTML TTL", "0 seconds (no-cache for HTML files)"],
        ["Custom Error Pages", "403/404 redirected to /index.html"],
        ["HTTP/2", "Enabled for multiplexed connections"],
        ["Compression", "Gzip and Brotli compression enabled"],
        ["WAF", "Integrated with AWS WAF WebACL"],
        ["Logging", "Access logs to S3 logging bucket"],
      ],
      [3200, 6160]
    ),
  );

  // 3.3 Route 53
  sections.push(
    spacer(),
    heading2("3.3 Amazon Route 53 \u2014 DNS Management"),
    makeTable(
      ["Property", "Value"],
      [
        ["Hosted Zone", "cloudaip.com"],
        ["A Record", "Alias to CloudFront distribution (cloudaip.com)"],
        ["CNAME Record", "www.cloudaip.com \u2192 cloudaip.com"],
        ["MX Records", "Configured for email delivery (SES/WorkMail)"],
        ["Health Checks", "CloudFront endpoint health monitoring"],
        ["DNSSEC", "Available for activation"],
      ],
      [3200, 6160]
    ),
  );

  // 3.4 API Gateway
  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    heading2("3.4 Amazon API Gateway \u2014 REST API"),
    makeTable(
      ["Property", "Value"],
      [
        ["API Name", "CloudAIP-API"],
        ["API Type", "REST API (Regional)"],
        ["Stage", "prod"],
        ["Authentication", "API Key required for admin endpoints"],
        ["CORS", "Enabled for cloudaip.com origin"],
        ["Throttling (Burst)", "100 requests/second"],
        ["Throttling (Sustained)", "50 requests/second"],
        ["Request Validation", "Enabled with request models"],
        ["Access Logging", "CloudWatch Logs enabled"],
      ],
      [3200, 6160]
    ),
    spacer(),
    heading3("API Endpoints"),
    makeTable(
      ["Method", "Path", "Description", "Auth"],
      [
        ["POST", "/contact", "Submit contact/lead form", "None (public)"],
        ["GET", "/leads", "Retrieve leads list with filters", "API Key"],
        ["PUT", "/leads/{id}", "Update lead status", "API Key"],
        ["GET", "/leads/export", "Export leads as CSV", "API Key"],
      ],
      [1200, 2200, 3800, 2160]
    ),
  );

  // 3.5 Lambda
  sections.push(
    spacer(),
    heading2("3.5 AWS Lambda \u2014 Compute Functions"),
    heading3("Function 1: CloudAIP-ContactFormHandler"),
    makeTable(
      ["Property", "Value"],
      [
        ["Runtime", "Node.js 20.x"],
        ["Trigger", "API Gateway \u2014 POST /contact"],
        ["Purpose", "Validate form input, store lead in DynamoDB, send SES notification"],
        ["Memory", "256 MB"],
        ["Timeout", "15 seconds"],
        ["Architecture", "arm64 (Graviton2) for cost efficiency"],
        ["Env: TABLE_NAME", "CloudAIP-Leads"],
        ["Env: SES_FROM_EMAIL", "hello@cloudaip.com"],
        ["Env: NOTIFICATION_EMAIL", "admin@cloudaip.com"],
      ],
      [3200, 6160]
    ),
    spacer(),
    heading3("Function 2: CloudAIP-AdminAPIHandler"),
    makeTable(
      ["Property", "Value"],
      [
        ["Runtime", "Node.js 20.x"],
        ["Trigger", "API Gateway \u2014 GET/PUT /leads"],
        ["Purpose", "Query leads, update status, export data"],
        ["Memory", "256 MB"],
        ["Timeout", "15 seconds"],
        ["Architecture", "arm64 (Graviton2)"],
        ["Env: TABLE_NAME", "CloudAIP-Leads"],
      ],
      [3200, 6160]
    ),
  );

  // 3.6 DynamoDB
  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    heading2("3.6 Amazon DynamoDB \u2014 Database"),
    makeTable(
      ["Property", "Value"],
      [
        ["Table Name", "CloudAIP-Leads"],
        ["Partition Key", "leadId (String, UUID v4)"],
        ["Sort Key", "createdAt (String, ISO 8601 timestamp)"],
        ["Billing Mode", "On-Demand (PAY_PER_REQUEST)"],
        ["Encryption", "AWS managed key (default)"],
        ["Point-in-Time Recovery", "Enabled (35-day window)"],
        ["TTL", "Not enabled (leads retained indefinitely)"],
        ["Stream", "Disabled (can enable for event-driven processing)"],
      ],
      [3200, 6160]
    ),
    spacer(),
    heading3("Global Secondary Indexes"),
    makeTable(
      ["Index Name", "Partition Key", "Sort Key", "Purpose"],
      [
        ["status-index", "status (String)", "createdAt (String)", "Filter leads by pipeline status"],
        ["email-index", "email (String)", "\u2014", "Deduplication and email lookup"],
      ],
      [2400, 2400, 2200, 2360]
    ),
    spacer(),
    heading3("Item Schema"),
    makeTable(
      ["Attribute", "Type", "Description"],
      [
        ["leadId", "String (UUID)", "Unique lead identifier (partition key)"],
        ["createdAt", "String (ISO 8601)", "Timestamp of submission (sort key)"],
        ["fullName", "String", "Contact full name"],
        ["email", "String", "Contact email address"],
        ["company", "String", "Company name"],
        ["monthlySpend", "String", "Cloud spend range (e.g., $10K-$50K)"],
        ["message", "String", "Contact message/inquiry details"],
        ["contactMethod", "String", "Preferred: Email, Phone, or WhatsApp"],
        ["status", "String", "Pipeline: new | contacted | qualified | converted"],
        ["source", "String", "Lead source (website, referral, etc.)"],
        ["updatedAt", "String (ISO 8601)", "Last status update timestamp"],
      ],
      [2200, 2800, 4360]
    ),
  );

  // 3.7 SES
  sections.push(
    spacer(),
    heading2("3.7 Amazon SES \u2014 Email Service"),
    makeTable(
      ["Property", "Value"],
      [
        ["Region", "ap-south-1 (Mumbai)"],
        ["Verified Identity", "hello@cloudaip.com (domain-level verification)"],
        ["Purpose", "Notification emails when new leads are submitted"],
        ["Email Template", "HTML template with lead details and quick-action links"],
        ["Sending Rate", "Standard tier (14 emails/second)"],
        ["Bounce/Complaint", "SNS notifications configured"],
        ["DKIM", "Enabled for email authentication"],
        ["SPF", "Configured in Route 53 TXT record"],
      ],
      [3200, 6160]
    ),
  );

  // 3.8 WAF
  sections.push(
    spacer(),
    heading2("3.8 AWS WAF \u2014 Web Application Firewall"),
    makeTable(
      ["Rule", "Description"],
      [
        ["Rate Limiting", "2,000 requests per 5 minutes per IP address"],
        ["SQL Injection", "AWS managed SQLi rule set"],
        ["XSS Protection", "AWS managed XSS rule set"],
        ["Bot Control", "AWS managed bot control (common bots)"],
        ["Geo Blocking", "Optional \u2014 can restrict by country if needed"],
        ["IP Reputation", "AWS managed IP reputation list"],
      ],
      [3200, 6160]
    ),
  );

  // 3.9 CloudWatch
  sections.push(
    spacer(),
    heading2("3.9 Amazon CloudWatch \u2014 Monitoring"),
    makeTable(
      ["Component", "Configuration"],
      [
        ["Lambda Logs", "30-day retention, structured JSON logging"],
        ["API Gateway Logs", "Access logging with request/response details"],
        ["Custom Metric: LeadsSubmitted", "Count of successful lead submissions"],
        ["Custom Metric: APIErrors", "Count of 4xx/5xx API responses"],
        ["Alarm: Lambda Errors", "Trigger if error rate exceeds 5% over 5 minutes"],
        ["Alarm: API 5xx", "Trigger if 5xx count exceeds 1% over 5 minutes"],
        ["Dashboard", "Real-time dashboard for key operational metrics"],
      ],
      [3800, 5560]
    ),
  );

  // 3.10 IAM
  sections.push(
    spacer(),
    heading2("3.10 AWS IAM \u2014 Identity & Access Management"),
    bulletItem("Lambda execution roles follow least-privilege principle"),
    bulletItem("Contact form Lambda: DynamoDB PutItem + SES SendEmail only"),
    bulletItem("Admin API Lambda: DynamoDB Query, GetItem, UpdateItem only"),
    bulletItem("API Gateway: Invoke Lambda permission scoped to specific functions"),
    bulletItem("S3 deployment: Separate role for CI/CD pipeline with S3 and CloudFront access"),
    bulletItem("No long-lived IAM user credentials in production (migrate to SSO)"),
  );

  return sections;
}

function securityArchitecture() {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    heading1("4. Security Architecture"),
    bodyText("CloudAIP implements defense-in-depth security across all infrastructure layers."),
    heading2("4.1 Encryption"),
    bulletItem("All data encrypted in transit using TLS 1.2+ (enforced by CloudFront)"),
    bulletItem("S3 objects encrypted at rest with SSE-S3 (AES-256)"),
    bulletItem("DynamoDB encrypted at rest with AWS managed keys (default)"),
    bulletItem("Lambda environment variables encrypted with AWS KMS"),
    heading2("4.2 Network Security"),
    bulletItem("S3 bucket: Public access blocked; content served only through CloudFront OAI"),
    bulletItem("API Gateway: Request throttling (100 burst / 50 sustained per second)"),
    bulletItem("WAF: DDoS protection, rate limiting, SQL injection and XSS prevention"),
    bulletItem("CORS: Restricted to cloudaip.com domain origin"),
    bulletItem("Lambda: No VPC required (no database/cache dependencies in VPC)"),
    heading2("4.3 Authentication & Authorization"),
    bulletItem("Public endpoints (contact form): No authentication required"),
    bulletItem("Admin endpoints (leads API): API key authentication via API Gateway"),
    bulletItem("Admin dashboard: Client-side password protection (upgrade to Cognito planned)"),
    bulletItem("Future: Amazon Cognito user pools for robust admin authentication"),
    heading2("4.4 Data Protection"),
    bulletItem("No sensitive PII stored beyond business contact information"),
    bulletItem("DynamoDB Point-in-Time Recovery for data protection (35-day window)"),
    bulletItem("S3 versioning enabled for accidental deletion protection"),
    bulletItem("CloudTrail enabled for audit logging of all API calls"),
    heading2("4.5 Compliance Considerations"),
    bulletItem("Architecture supports SOC 2 Type II compliance requirements"),
    bulletItem("GDPR-ready: Data deletion capabilities via admin API"),
    bulletItem("All data stored in ap-south-1 region (data residency compliance)"),
    spacer(),
  ];
}

function deploymentArchitecture() {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    heading1("5. Deployment Architecture"),
    heading2("5.1 Infrastructure as Code"),
    bodyText("All backend infrastructure is defined in AWS CloudFormation / SAM templates located in the /backend/template.yaml file. This enables reproducible, version-controlled infrastructure deployments."),
    heading2("5.2 Frontend Deployment"),
    bodyText("Frontend deployment is performed via AWS CLI with the following commands:"),
    spacer(),
    makeTable(
      ["Step", "Command", "Purpose"],
      [
        ["1", "aws s3 sync . s3://cloudaip-website", "Upload static files to S3"],
        ["2", "aws cloudfront create-invalidation --distribution-id XXXX --paths /*", "Invalidate CDN cache"],
      ],
      [800, 5400, 3160]
    ),
    heading2("5.3 Backend Deployment"),
    bodyText("Backend is deployed using CloudFormation:"),
    spacer(),
    makeTable(
      ["Step", "Command", "Purpose"],
      [
        ["1", "Package Lambda code as .zip", "Prepare deployment artifacts"],
        ["2", "Upload .zip to S3 deployment bucket", "Stage artifacts"],
        ["3", "aws cloudformation deploy --template-file template.yaml --stack-name cloudaip-backend", "Deploy infrastructure"],
      ],
      [800, 5400, 3160]
    ),
    heading2("5.4 Environment Strategy"),
    bulletItem("Current: Single production environment"),
    bulletItem("Planned: Staging environment with separate stack and domain (staging.cloudaip.com)"),
    bulletItem("Future: GitHub Actions CI/CD pipeline for automated testing and deployment"),
    heading2("5.5 Rollback Strategy"),
    bulletItem("Frontend: S3 versioning allows instant rollback to previous file versions"),
    bulletItem("Backend: CloudFormation automatic rollback on deployment failure"),
    bulletItem("Lambda: Version aliases enable blue/green deployment pattern"),
    spacer(),
  ];
}

function costEstimation() {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    heading1("6. Cost Estimation (Monthly)"),
    bodyText("The serverless architecture ensures minimal costs at low traffic volumes, scaling linearly with usage. Below are estimated monthly costs based on initial traffic projections (10,000 monthly visitors, 200 leads/month)."),
    spacer(),
    makeTable(
      ["AWS Service", "Estimated Cost", "Notes"],
      [
        ["Amazon S3", "$1.00", "Static file storage, minimal data transfer"],
        ["Amazon CloudFront", "$5.00 \u2013 $15.00", "Depends on traffic volume and geography"],
        ["Amazon API Gateway", "$3.50", "Per million API requests"],
        ["AWS Lambda", "$0.00 \u2013 $5.00", "Free tier covers most initial usage"],
        ["Amazon DynamoDB", "$1.00 \u2013 $5.00", "On-demand pricing, low volume"],
        ["Amazon SES", "$0.10", "Per 1,000 emails sent"],
        ["Amazon Route 53", "$0.90", "$0.50/hosted zone + $0.40/million queries"],
        ["Amazon CloudWatch", "$3.00 \u2013 $5.00", "Logs, metrics, and alarms"],
        ["AWS WAF", "$6.00", "WebACL ($5) + rules ($1 each)"],
        ["AWS ACM", "Free", "Public SSL/TLS certificates"],
        ["TOTAL (estimated)", "$20.00 \u2013 $40.00", "Initial monthly cost, scaling with traffic"],
      ],
      [2800, 2400, 4160]
    ),
    spacer(),
    bodyText("At scale (100,000 monthly visitors, 2,000 leads/month), estimated costs increase to approximately $80\u2013$150/month \u2014 still significantly lower than traditional server-based architectures."),
    spacer(),
  ];
}

function scalabilityPerformance() {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    heading1("7. Scalability & Performance"),
    bodyText("Every component in the CloudAIP architecture is serverless and auto-scales without manual intervention."),
    spacer(),
    makeTable(
      ["Service", "Scale Limit", "Auto-Scale?", "Latency"],
      [
        ["CloudFront", "450+ edge locations globally", "Yes", "< 50ms (cached content)"],
        ["S3", "Unlimited storage, 5,500 GET/sec/prefix", "Yes", "< 100ms"],
        ["API Gateway", "10,000 requests/second (adjustable)", "Yes", "< 30ms overhead"],
        ["Lambda", "1,000 concurrent (can increase to 10K+)", "Yes", "< 100ms (warm start)"],
        ["DynamoDB", "Unlimited throughput (on-demand)", "Yes", "< 10ms single-digit"],
        ["SES", "14 emails/second (production)", "Request increase", "< 1 second delivery"],
      ],
      [2200, 3200, 1600, 2360]
    ),
    spacer(),
    heading2("7.1 Performance Optimizations"),
    bulletItem("CloudFront edge caching for sub-100ms page loads globally"),
    bulletItem("Gzip and Brotli compression enabled on CloudFront"),
    bulletItem("No heavy JavaScript frameworks \u2014 pure HTML/CSS/JS for minimal bundle size"),
    bulletItem("Lambda functions use arm64 (Graviton2) for 20% better price-performance"),
    bulletItem("DynamoDB on-demand capacity eliminates provisioning concerns"),
    bulletItem("HTTP/2 enabled on CloudFront for multiplexed requests"),
    spacer(),
  ];
}

function disasterRecovery() {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    heading1("8. Disaster Recovery & Backup"),
    spacer(),
    makeTable(
      ["Component", "Durability", "Backup Strategy", "RPO", "RTO"],
      [
        ["S3", "99.999999999% (11 nines)", "Versioning + cross-region replication (optional)", "Near zero", "< 5 min"],
        ["DynamoDB", "Multi-AZ replication", "Point-in-time recovery (35-day window)", "Near zero", "< 30 min"],
        ["Lambda Code", "Stored in S3", "Versioned deployment packages in S3", "Zero", "< 15 min"],
        ["Infrastructure", "CloudFormation", "Full stack reproducible from template", "Zero", "< 60 min"],
        ["DNS", "Route 53 (100% SLA)", "Hosted zone exported as backup", "Near zero", "< 5 min"],
      ],
      [1800, 2200, 3000, 1200, 1160]
    ),
    spacer(),
    heading2("8.1 Recovery Procedures"),
    bulletItem("Frontend Recovery: Restore S3 objects from previous versions, invalidate CloudFront"),
    bulletItem("Data Recovery: Restore DynamoDB table to any point within 35-day PITR window"),
    bulletItem("Full Stack Recovery: Deploy CloudFormation template to recreate all resources"),
    bulletItem("DNS Failover: Route 53 health checks with failover routing (if multi-region)"),
    spacer(),
  ];
}

function monitoringAlerting() {
  return [
    heading1("9. Monitoring & Alerting"),
    heading2("9.1 CloudWatch Dashboards"),
    bulletItem("Real-time operational dashboard with API request counts, error rates, and latencies"),
    bulletItem("Business dashboard with lead submission counts and conversion metrics"),
    bulletItem("Cost dashboard tracking daily AWS spend across all services"),
    heading2("9.2 Alarm Configuration"),
    makeTable(
      ["Alarm", "Threshold", "Action"],
      [
        ["Lambda Error Rate", "> 5% over 5 minutes", "SNS notification to admin@cloudaip.com"],
        ["API Gateway 5xx", "> 1% of requests over 5 minutes", "SNS notification + PagerDuty (future)"],
        ["DynamoDB Throttling", "Any throttled requests", "SNS notification"],
        ["CloudFront Error Rate", "> 5% 4xx/5xx responses", "SNS notification"],
        ["Monthly Cost", "> $100 budget threshold", "SNS notification + auto-action (future)"],
      ],
      [2800, 3200, 3360]
    ),
    heading2("9.3 Future Monitoring"),
    bulletItem("AWS X-Ray for distributed tracing across Lambda and API Gateway"),
    bulletItem("Custom CloudWatch metrics for business KPIs (conversion rate, response time)"),
    bulletItem("Third-party integration: Datadog or New Relic for advanced APM"),
    spacer(),
  ];
}

function futureEnhancements() {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    heading1("10. Future Enhancements"),
    bodyText("The following enhancements are planned to extend the platform capabilities:"),
    heading2("10.1 Short-term (1\u20133 months)"),
    bulletItem("CI/CD pipeline with GitHub Actions for automated testing and deployment"),
    bulletItem("Staging environment with separate CloudFormation stack"),
    bulletItem("Amazon Cognito user pools for secure admin dashboard authentication"),
    bulletItem("S3 pre-signed URLs for secure file upload (proposals, reports)"),
    heading2("10.2 Medium-term (3\u20136 months)"),
    bulletItem("Amazon EventBridge for event-driven architecture and async processing"),
    bulletItem("AWS Step Functions for complex multi-step workflows (onboarding, assessments)"),
    bulletItem("Amazon Amplify for full-stack deployment with CI/CD built in"),
    bulletItem("Custom domain email with Amazon WorkMail"),
    bulletItem("HubSpot CRM integration via Lambda webhook"),
    heading2("10.3 Long-term (6\u201312 months)"),
    bulletItem("Multi-region deployment for global redundancy"),
    bulletItem("Amazon RDS/Aurora for relational data requirements"),
    bulletItem("Amazon Personalize for content recommendations"),
    bulletItem("Amazon Connect for integrated customer support"),
    bulletItem("GraphQL API via AWS AppSync for real-time features"),
    spacer(),
  ];
}

function appendixA() {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    heading1("Appendix A: CloudFormation Template"),
    bodyText("The complete infrastructure-as-code template is located at /backend/template.yaml in the project repository. This SAM/CloudFormation template defines all backend resources including:"),
    bulletItem("DynamoDB table with GSIs (CloudAIP-Leads)"),
    bulletItem("Lambda functions (ContactFormHandler, AdminAPIHandler)"),
    bulletItem("API Gateway REST API with endpoints and CORS"),
    bulletItem("IAM execution roles with least-privilege policies"),
    bulletItem("SES email configuration"),
    bulletItem("CloudWatch log groups and alarms"),
    spacer(),
    bodyText("Deployment command:"),
    bodyText("aws cloudformation deploy --template-file backend/template.yaml --stack-name cloudaip-backend --capabilities CAPABILITY_IAM --region ap-south-1"),
    spacer(),
  ];
}

function appendixB() {
  return [
    heading1("Appendix B: API Documentation"),
    heading2("POST /contact"),
    bodyText("Submit a new contact/lead form. Public endpoint, no authentication required."),
    heading3("Request Body"),
    makeTable(
      ["Field", "Type", "Required", "Description"],
      [
        ["fullName", "String", "Yes", "Contact full name (2\u2013100 characters)"],
        ["email", "String", "Yes", "Valid email address"],
        ["company", "String", "Yes", "Company name (2\u2013200 characters)"],
        ["monthlySpend", "String", "Yes", "Cloud spend range (dropdown value)"],
        ["message", "String", "No", "Additional message (max 2000 characters)"],
        ["contactMethod", "String", "No", "Preferred: email, phone, or whatsapp"],
      ],
      [2000, 1400, 1400, 4560]
    ),
    heading3("Response Codes"),
    makeTable(
      ["Code", "Description"],
      [
        ["200", "Lead successfully created. Returns { success: true, leadId: string }"],
        ["400", "Validation error. Returns { error: string, details: string[] }"],
        ["500", "Internal server error. Returns { error: string }"],
      ],
      [1400, 7960]
    ),
    spacer(),
    heading2("GET /leads"),
    bodyText("Retrieve leads with optional filtering. Requires API key authentication."),
    heading3("Query Parameters"),
    makeTable(
      ["Parameter", "Type", "Description"],
      [
        ["status", "String", "Filter by status: new, contacted, qualified, converted"],
        ["limit", "Number", "Max results to return (default 50, max 100)"],
        ["lastKey", "String", "Pagination key from previous response"],
      ],
      [2000, 1400, 5960]
    ),
    spacer(),
    heading2("PUT /leads/{id}"),
    bodyText("Update a lead\u2019s status. Requires API key authentication."),
    heading3("Request Body"),
    makeTable(
      ["Field", "Type", "Required", "Description"],
      [
        ["status", "String", "Yes", "New status: new, contacted, qualified, converted"],
        ["notes", "String", "No", "Internal notes about the lead"],
      ],
      [2000, 1400, 1400, 4560]
    ),
    heading3("Response Codes"),
    makeTable(
      ["Code", "Description"],
      [
        ["200", "Lead updated successfully. Returns updated lead object."],
        ["404", "Lead not found."],
        ["400", "Invalid status value."],
      ],
      [1400, 7960]
    ),
    spacer(),
  ];
}

// ── Build document ──
async function main() {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Arial", size: 20, color: LIGHT_GRAY } },
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, font: "Arial", color: CYAN },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, font: "Arial", color: WHITE },
          paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
        },
        {
          id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 22, bold: true, font: "Arial", color: TEAL },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    sections: [
      // Title page
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: titlePage(),
      },
      // TOC + all content
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: MEDIUM_BLUE, space: 1 } },
                children: [
                  new TextRun({ text: "CloudAIP \u2014 Technical Infrastructure Document", font: "Arial", size: 16, color: MUTED }),
                  new TextRun({ text: "\tv1.0 | CONFIDENTIAL", font: "Arial", size: 16, color: MUTED }),
                ],
                tabStops: [{ type: "right", position: 9360 }],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: { top: { style: BorderStyle.SINGLE, size: 6, color: MEDIUM_BLUE, space: 1 } },
                children: [
                  new TextRun({ text: "\u00A9 2026 CloudAIP. All rights reserved.", font: "Arial", size: 14, color: MUTED }),
                  new TextRun({ text: "\tPage ", font: "Arial", size: 14, color: MUTED }),
                  new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 14, color: MUTED }),
                ],
                tabStops: [{ type: "right", position: 9360 }],
              }),
            ],
          }),
        },
        children: [
          ...tocSection(),
          ...executiveSummary(),
          ...architectureOverview(),
          ...infraComponents(),
          ...securityArchitecture(),
          ...deploymentArchitecture(),
          ...costEstimation(),
          ...scalabilityPerformance(),
          ...disasterRecovery(),
          ...monitoringAlerting(),
          ...futureEnhancements(),
          ...appendixA(),
          ...appendixB(),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync("C:/Users/eswan/OneDrive/Desktop/CloudAIP/CloudAIP-Technical-Infrastructure-Document.docx", buffer);
  console.log("Document created successfully!");
}

main().catch(console.error);
