/**
 * DynamoDB Seed Script for CloudAIP
 *
 * Usage:
 *   npx tsx seed-dynamo.ts
 *   npx tsx seed-dynamo.ts --main-table CloudAIP-Main --activity-table CloudAIP-Activity --leads-table CloudAIP-Leads
 *
 * Environment variables (override with CLI args):
 *   MAIN_TABLE, ACTIVITY_TABLE, LEADS_TABLE, AWS_REGION
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function parseArgs(): { mainTable: string; activityTable: string; leadsTable: string } {
  const args = process.argv.slice(2);
  let mainTable = process.env.MAIN_TABLE || 'CloudAIP-MainTable';
  let activityTable = process.env.ACTIVITY_TABLE || 'CloudAIP-ActivityTable';
  let leadsTable = process.env.LEADS_TABLE || 'CloudAIP-LeadsTable';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--main-table' && args[i + 1]) mainTable = args[++i];
    if (args[i] === '--activity-table' && args[i + 1]) activityTable = args[++i];
    if (args[i] === '--leads-table' && args[i + 1]) leadsTable = args[++i];
  }

  return { mainTable, activityTable, leadsTable };
}

const { mainTable, activityTable, leadsTable } = parseArgs();

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true, convertEmptyValues: false },
  unmarshallOptions: { wrapNumbers: false },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function batchWrite(tableName: string, items: Record<string, any>[]): Promise<void> {
  const BATCH_SIZE = 25;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const requestItems = batch.map((item) => ({
      PutRequest: { Item: item },
    }));

    let unprocessed: any = {
      [tableName]: requestItems,
    };

    while (unprocessed && Object.keys(unprocessed).length > 0) {
      const result = await docClient.send(
        new BatchWriteCommand({ RequestItems: unprocessed })
      );
      unprocessed = result.UnprocessedItems;

      if (unprocessed && Object.keys(unprocessed).length > 0) {
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log(`  Written batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} items) to ${tableName}`);
  }
}

// ---------------------------------------------------------------------------
// Seed Data Generators
// ---------------------------------------------------------------------------

async function generateUsers(): Promise<Record<string, any>[]> {
  const now = new Date().toISOString();
  const adminHash = await hashPassword('Admin123!');
  const studentHash = await hashPassword('Student123!');
  const clientHash = await hashPassword('Client123!');

  const adminId = randomUUID();
  const student1Id = randomUUID();
  const student2Id = randomUUID();
  const client1Id = randomUUID();

  // Store IDs for later use
  userIds.admin = adminId;
  userIds.student1 = student1Id;
  userIds.student2 = student2Id;
  userIds.client1 = client1Id;

  return [
    {
      pk: `USER#${adminId}`,
      sk: 'PROFILE',
      userId: adminId,
      email: 'admin@cloudaip.com',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'CloudAIP',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      entityType: 'USER',
      createdAt: now,
      updatedAt: now,
      refreshTokens: [],
    },
    {
      pk: `USER#${student1Id}`,
      sk: 'PROFILE',
      userId: student1Id,
      email: 'alice.student@example.com',
      passwordHash: studentHash,
      firstName: 'Alice',
      lastName: 'Johnson',
      role: 'student',
      isActive: true,
      isEmailVerified: true,
      entityType: 'USER',
      createdAt: now,
      updatedAt: now,
      refreshTokens: [],
    },
    {
      pk: `USER#${student2Id}`,
      sk: 'PROFILE',
      userId: student2Id,
      email: 'bob.student@example.com',
      passwordHash: studentHash,
      firstName: 'Bob',
      lastName: 'Smith',
      role: 'student',
      isActive: true,
      isEmailVerified: true,
      entityType: 'USER',
      createdAt: now,
      updatedAt: now,
      refreshTokens: [],
    },
    {
      pk: `USER#${client1Id}`,
      sk: 'PROFILE',
      userId: client1Id,
      email: 'carol.client@techcorp.com',
      passwordHash: clientHash,
      firstName: 'Carol',
      lastName: 'Williams',
      role: 'client',
      isActive: true,
      isEmailVerified: true,
      entityType: 'USER',
      createdAt: now,
      updatedAt: now,
      refreshTokens: [],
    },
  ];
}

function generateCourses(): Record<string, any>[] {
  const now = new Date().toISOString();
  const items: Record<string, any>[] = [];

  const courses = [
    {
      id: courseIds.finops,
      title: 'FinOps Certified Practitioner',
      description: 'Master the FinOps framework to optimize cloud financial management. Learn how to drive accountability, maximize business value, and build a culture of financial ownership across engineering and finance teams.',
      shortDescription: 'Master cloud financial management with the FinOps framework.',
      price: 499,
      thumbnail: '/images/courses/finops-practitioner.jpg',
      duration: '40 hours',
      level: 'Intermediate',
      category: 'FinOps',
      tags: ['finops', 'cloud-cost', 'certification', 'financial-management'],
      modules: [
        {
          id: 'mod-finops-1',
          title: 'FinOps Foundation & Principles',
          order: 1,
          lessons: [
            { id: 'les-finops-1-1', title: 'What is FinOps?', order: 1, duration: 45, type: 'video' },
            { id: 'les-finops-1-2', title: 'The FinOps Lifecycle', order: 2, duration: 60, type: 'video' },
            { id: 'les-finops-1-3', title: 'FinOps Personas & Stakeholders', order: 3, duration: 30, type: 'video' },
          ],
        },
        {
          id: 'mod-finops-2',
          title: 'Inform Phase: Visibility & Allocation',
          order: 2,
          lessons: [
            { id: 'les-finops-2-1', title: 'Cost Allocation & Tagging Strategies', order: 1, duration: 50, type: 'video' },
            { id: 'les-finops-2-2', title: 'Showback & Chargeback Models', order: 2, duration: 40, type: 'video' },
            { id: 'les-finops-2-3', title: 'Cloud Billing & Pricing Models', order: 3, duration: 55, type: 'video' },
          ],
        },
        {
          id: 'mod-finops-3',
          title: 'Optimize & Operate',
          order: 3,
          lessons: [
            { id: 'les-finops-3-1', title: 'Right-Sizing & Reserved Instances', order: 1, duration: 60, type: 'video' },
            { id: 'les-finops-3-2', title: 'Spot Instances & Savings Plans', order: 2, duration: 45, type: 'video' },
            { id: 'les-finops-3-3', title: 'Automation & Governance Policies', order: 3, duration: 50, type: 'video' },
          ],
        },
      ],
    },
    {
      id: courseIds.awsai,
      title: 'AWS AI Practitioner',
      description: 'Prepare for the AWS Certified AI Practitioner exam. Gain hands-on experience with AWS AI/ML services including SageMaker, Bedrock, Rekognition, Comprehend, and learn responsible AI practices.',
      shortDescription: 'Prepare for the AWS Certified AI Practitioner exam.',
      price: 399,
      thumbnail: '/images/courses/aws-ai-practitioner.jpg',
      duration: '35 hours',
      level: 'Beginner',
      category: 'AWS',
      tags: ['aws', 'ai', 'machine-learning', 'certification', 'sagemaker'],
      modules: [
        {
          id: 'mod-awsai-1',
          title: 'AI/ML Fundamentals on AWS',
          order: 1,
          lessons: [
            { id: 'les-awsai-1-1', title: 'Introduction to AI & Machine Learning', order: 1, duration: 40, type: 'video' },
            { id: 'les-awsai-1-2', title: 'AWS AI/ML Service Landscape', order: 2, duration: 50, type: 'video' },
            { id: 'les-awsai-1-3', title: 'Data Preparation & Feature Engineering', order: 3, duration: 45, type: 'video' },
          ],
        },
        {
          id: 'mod-awsai-2',
          title: 'AWS AI Services Deep Dive',
          order: 2,
          lessons: [
            { id: 'les-awsai-2-1', title: 'Amazon SageMaker Essentials', order: 1, duration: 60, type: 'video' },
            { id: 'les-awsai-2-2', title: 'Amazon Bedrock & Generative AI', order: 2, duration: 55, type: 'video' },
            { id: 'les-awsai-2-3', title: 'Rekognition, Comprehend & Textract', order: 3, duration: 45, type: 'video' },
          ],
        },
        {
          id: 'mod-awsai-3',
          title: 'Responsible AI & Exam Preparation',
          order: 3,
          lessons: [
            { id: 'les-awsai-3-1', title: 'Responsible AI Practices', order: 1, duration: 35, type: 'video' },
            { id: 'les-awsai-3-2', title: 'Security & Governance for AI Workloads', order: 2, duration: 40, type: 'video' },
            { id: 'les-awsai-3-3', title: 'Practice Exam & Review', order: 3, duration: 90, type: 'quiz' },
          ],
        },
      ],
    },
  ];

  for (const course of courses) {
    // Course metadata
    items.push({
      pk: `COURSE#${course.id}`,
      sk: 'METADATA',
      courseId: course.id,
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription,
      price: course.price,
      thumbnail: course.thumbnail,
      duration: course.duration,
      level: course.level,
      category: course.category,
      tags: course.tags,
      isPublished: true,
      enrollmentCount: 0,
      entityType: 'COURSE',
      createdAt: now,
      updatedAt: now,
    });

    // Modules and Lessons
    for (const mod of course.modules) {
      items.push({
        pk: `COURSE#${course.id}`,
        sk: `MODULE#${mod.id}`,
        moduleId: mod.id,
        courseId: course.id,
        title: mod.title,
        order: mod.order,
        entityType: 'MODULE',
        createdAt: now,
        updatedAt: now,
      });

      for (const lesson of mod.lessons) {
        items.push({
          pk: `COURSE#${course.id}`,
          sk: `LESSON#${mod.id}#${lesson.id}`,
          lessonId: lesson.id,
          moduleId: mod.id,
          courseId: course.id,
          title: lesson.title,
          order: lesson.order,
          duration: lesson.duration,
          type: lesson.type,
          entityType: 'LESSON',
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  return items;
}

function generateServices(): Record<string, any>[] {
  const now = new Date().toISOString();

  const services = [
    {
      title: 'Cloud Cost Assessment',
      description: 'Comprehensive analysis of your cloud infrastructure costs. We identify waste, optimize reservations, and provide a roadmap to reduce your cloud bill by 20-40%. Includes a detailed report with actionable recommendations.',
      shortDescription: 'Comprehensive cloud cost analysis with actionable savings roadmap.',
      category: 'assessment',
      icon: 'chart-bar',
      features: ['Cost breakdown analysis', 'Waste identification', 'Reservation optimization', 'Savings roadmap', 'Executive summary report'],
      pricing: 'Starting at $2,500',
      order: 1,
    },
    {
      title: 'Cost Visualizer',
      description: 'Custom-built dashboards and visualization tools that give your teams real-time visibility into cloud spending. Integrates with AWS, Azure, and GCP billing data to provide unified cost views.',
      shortDescription: 'Real-time cloud cost dashboards and visualization tools.',
      category: 'tooling',
      icon: 'eye',
      features: ['Multi-cloud support', 'Real-time dashboards', 'Custom alerts', 'Team-level views', 'Budget tracking'],
      pricing: 'Starting at $5,000/month',
      order: 2,
    },
    {
      title: 'Cost Optimizer',
      description: 'Automated cost optimization service that continuously right-sizes resources, manages reserved instances, and implements savings plans. Hands-off optimization with guaranteed savings.',
      shortDescription: 'Automated resource right-sizing and savings plan management.',
      category: 'optimization',
      icon: 'cog',
      features: ['Automated right-sizing', 'RI/SP management', 'Spot instance orchestration', 'Continuous monitoring', 'Monthly savings reports'],
      pricing: 'Starting at $3,000/month',
      order: 3,
    },
    {
      title: 'Policy Enforcer',
      description: 'Governance and policy enforcement platform that prevents cloud cost overruns before they happen. Implement tagging policies, budget guardrails, and approval workflows.',
      shortDescription: 'Cloud governance and cost policy enforcement platform.',
      category: 'governance',
      icon: 'shield-check',
      features: ['Tag policy enforcement', 'Budget guardrails', 'Approval workflows', 'Compliance reporting', 'Custom policy rules'],
      pricing: 'Starting at $4,000/month',
      order: 4,
    },
    {
      title: 'Smart Saver',
      description: 'AI-powered cost prediction and anomaly detection service. Uses machine learning to forecast cloud spending, detect unusual patterns, and recommend proactive cost-saving measures.',
      shortDescription: 'AI-powered cost prediction and anomaly detection.',
      category: 'ai',
      icon: 'sparkles',
      features: ['ML-based forecasting', 'Anomaly detection', 'Proactive alerts', 'Trend analysis', 'Budget impact predictions'],
      pricing: 'Starting at $6,000/month',
      order: 5,
    },
    {
      title: 'FinOps as a Service (FaaS)',
      description: 'Full-service managed FinOps practice. Our team embeds with yours to build a FinOps culture, implement processes, and continuously optimize your cloud financial operations.',
      shortDescription: 'Fully managed FinOps practice for your organization.',
      category: 'managed',
      icon: 'users',
      features: ['Dedicated FinOps team', 'Culture building', 'Process implementation', 'Stakeholder training', 'Quarterly business reviews'],
      pricing: 'Custom pricing',
      order: 6,
    },
  ];

  return services.map((svc) => {
    const id = randomUUID();
    const slug = svc.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    const paddedOrder = String(svc.order).padStart(5, '0');

    return {
      pk: `SERVICE#${id}`,
      sk: 'METADATA',
      serviceId: id,
      title: svc.title,
      description: svc.description,
      shortDescription: svc.shortDescription,
      category: svc.category,
      icon: svc.icon,
      image: '',
      features: svc.features,
      pricing: svc.pricing,
      slug,
      isPublished: true,
      isFeatured: svc.order <= 3,
      order: svc.order,
      entityType: 'SERVICE',
      serviceEntityType: 'SERVICE',
      serviceOrder: paddedOrder,
      createdAt: now,
      updatedAt: now,
    };
  });
}

function generateLeads(): Record<string, any>[] {
  const now = new Date();

  const leads = [
    { name: 'David Chen', email: 'david.chen@startupinc.com', company: 'StartupInc', spendRange: '$10K-$50K/month', message: 'We are a fast-growing startup and our cloud costs are spiraling. Need help optimizing.', status: 'new' },
    { name: 'Emily Rodriguez', email: 'emily.r@enterprise.co', company: 'Enterprise Co', spendRange: '$100K-$500K/month', message: 'Looking for a comprehensive FinOps assessment of our multi-cloud environment.', status: 'contacted' },
    { name: 'Michael Park', email: 'mpark@techgiant.io', company: 'TechGiant', spendRange: '$500K+/month', message: 'Interested in the FinOps as a Service offering. We need help building an internal FinOps team.', status: 'qualified' },
    { name: 'Sarah Thompson', email: 'sarah.t@mediumco.com', company: 'MediumCo', spendRange: '$50K-$100K/month', message: 'Our AWS bill doubled last quarter. Need urgent cost optimization help.', status: 'new' },
    { name: 'James Wilson', email: 'jwilson@retailplus.com', company: 'RetailPlus', spendRange: '$10K-$50K/month', message: 'Want to implement cost visibility dashboards for our engineering teams.', status: 'converted' },
  ];

  return leads.map((lead, index) => {
    const createdAt = new Date(now.getTime() - index * 2 * 24 * 60 * 60 * 1000).toISOString();
    return {
      leadId: randomUUID(),
      name: lead.name,
      email: lead.email,
      company: lead.company,
      spendRange: lead.spendRange,
      message: lead.message,
      contactMethod: null,
      status: lead.status,
      source: 'website',
      createdAt,
      updatedAt: createdAt,
      ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
    };
  });
}

// ---------------------------------------------------------------------------
// Global IDs (populated during generation)
// ---------------------------------------------------------------------------

const userIds: Record<string, string> = {};
const courseIds = {
  finops: randomUUID(),
  awsai: randomUUID(),
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('CloudAIP DynamoDB Seed Script');
  console.log('============================');
  console.log(`Main Table:     ${mainTable}`);
  console.log(`Activity Table: ${activityTable}`);
  console.log(`Leads Table:    ${leadsTable}`);
  console.log('');

  // Generate all data
  console.log('Generating seed data...');

  const users = await generateUsers();
  const courses = generateCourses();
  const services = generateServices();
  const leads = generateLeads();

  // Write to MainTable: users + courses + services
  const mainTableItems = [...users, ...courses, ...services];
  console.log(`\nSeeding MainTable (${mainTableItems.length} items)...`);
  await batchWrite(mainTable, mainTableItems);

  // Write to LeadsTable
  console.log(`\nSeeding LeadsTable (${leads.length} items)...`);
  await batchWrite(leadsTable, leads);

  // Generate sample enrollments in ActivityTable
  const now = new Date().toISOString();
  const activityItems: Record<string, any>[] = [];

  // Enroll student1 in FinOps course
  activityItems.push({
    pk: `USER#${userIds.student1}`,
    sk: `ENROLL#${courseIds.finops}`,
    enrollmentId: randomUUID(),
    userId: userIds.student1,
    courseId: courseIds.finops,
    courseName: 'FinOps Certified Practitioner',
    status: 'active',
    enrolledAt: now,
    createdAt: now,
    updatedAt: now,
    entityType: 'ENROLLMENT',
    enrollCourseKey: `ENROLL#COURSE#${courseIds.finops}`,
    enrollStatusKey: 'ENROLL#STATUS#active',
  });

  // Enroll student2 in AWS AI course
  activityItems.push({
    pk: `USER#${userIds.student2}`,
    sk: `ENROLL#${courseIds.awsai}`,
    enrollmentId: randomUUID(),
    userId: userIds.student2,
    courseId: courseIds.awsai,
    courseName: 'AWS AI Practitioner',
    status: 'active',
    enrolledAt: now,
    createdAt: now,
    updatedAt: now,
    entityType: 'ENROLLMENT',
    enrollCourseKey: `ENROLL#COURSE#${courseIds.awsai}`,
    enrollStatusKey: 'ENROLL#STATUS#active',
  });

  // Sample payment for student1
  const paymentId = randomUUID();
  activityItems.push({
    pk: `USER#${userIds.student1}`,
    sk: `PAYMENT#${now}#${paymentId}`,
    paymentId,
    userId: userIds.student1,
    type: 'course',
    courseId: courseIds.finops,
    itemName: 'FinOps Certified Practitioner',
    amount: 499,
    currency: 'usd',
    status: 'succeeded',
    stripePaymentIntentId: `pi_seed_${randomUUID().slice(0, 8)}`,
    createdAt: now,
    updatedAt: now,
    paidAt: now,
    entityType: 'PAYMENT',
    paymentStatusKey: 'PAYMENT#STATUS#succeeded',
  });

  // Sample service request from client1
  const reqId = randomUUID();
  activityItems.push({
    pk: `USER#${userIds.client1}`,
    sk: `SVCREQ#${now}#${reqId}`,
    requestId: reqId,
    userId: userIds.client1,
    serviceId: 'assessment',
    serviceName: 'Cloud Cost Assessment',
    name: 'Carol Williams',
    email: 'carol.client@techcorp.com',
    company: 'TechCorp',
    phone: '+1-555-0123',
    message: 'We need a comprehensive assessment of our AWS infrastructure costs. Currently spending around $75K/month.',
    budget: '$5,000-$10,000',
    status: 'new',
    createdAt: now,
    updatedAt: now,
    entityType: 'SERVICE_REQUEST',
    svcReqStatusKey: 'SVCREQ#STATUS#new',
  });

  console.log(`\nSeeding ActivityTable (${activityItems.length} items)...`);
  await batchWrite(activityTable, activityItems);

  console.log('\n============================');
  console.log('Seed completed successfully!');
  console.log('');
  console.log('Created:');
  console.log(`  - 4 users (admin: admin@cloudaip.com / Admin123!)`);
  console.log(`  - 2 courses with 3 modules and 9 lessons each`);
  console.log(`  - 6 services`);
  console.log(`  - 5 leads`);
  console.log(`  - 2 sample enrollments`);
  console.log(`  - 1 sample payment`);
  console.log(`  - 1 sample service request`);
  console.log('');
  console.log('User credentials:');
  console.log('  Admin:    admin@cloudaip.com / Admin123!');
  console.log('  Student1: alice.student@example.com / Student123!');
  console.log('  Student2: bob.student@example.com / Student123!');
  console.log('  Client1:  carol.client@techcorp.com / Client123!');
}

main().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
