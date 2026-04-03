"""
Seed script for CloudAIP DynamoDB tables.

Populates tables with sample data:
- 4 users (admin, 2 students, 1 client)
- 2 courses with 3 modules each, 3 lessons per module
- 6 services (FinOps consulting)
- 5 sample leads

Usage:
    python seed_dynamo.py

Set environment variables for table names or defaults to staging names:
    MAIN_TABLE_NAME (default: CloudAIP-MainTable-staging)
    ACTIVITY_TABLE_NAME (default: CloudAIP-ActivityTable-staging)
    LEADS_TABLE_NAME (default: CloudAIP-LeadsTable-staging)
"""

import boto3
import uuid
import time
import hashlib
import os

# Table names
MAIN_TABLE_NAME = os.environ.get('MAIN_TABLE_NAME', 'CloudAIP-MainTable-staging')
ACTIVITY_TABLE_NAME = os.environ.get('ACTIVITY_TABLE_NAME', 'CloudAIP-ActivityTable-staging')
LEADS_TABLE_NAME = os.environ.get('LEADS_TABLE_NAME', 'CloudAIP-LeadsTable-staging')

dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))

main_table = dynamodb.Table(MAIN_TABLE_NAME)
activity_table = dynamodb.Table(ACTIVITY_TABLE_NAME)
leads_table = dynamodb.Table(LEADS_TABLE_NAME)


def hash_password(password):
    """Simple bcrypt-style hash using hashlib for seeding. In production, use bcrypt."""
    import bcrypt
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def iso_now():
    return time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())


def seed_users():
    """Create 4 users: admin, 2 students, 1 client."""
    print("Seeding users...")
    now = iso_now()

    users = [
        {
            'userId': 'user-admin-001',
            'email': 'admin@cloudaip.com',
            'name': 'CloudAIP Admin',
            'password': hash_password('Admin@12345'),
            'role': 'admin',
        },
        {
            'userId': 'user-student-001',
            'email': 'john.doe@example.com',
            'name': 'John Doe',
            'password': hash_password('Student@123'),
            'role': 'student',
        },
        {
            'userId': 'user-student-002',
            'email': 'jane.smith@example.com',
            'name': 'Jane Smith',
            'password': hash_password('Student@123'),
            'role': 'student',
        },
        {
            'userId': 'user-client-001',
            'email': 'mike.wilson@acmecorp.com',
            'name': 'Mike Wilson',
            'password': hash_password('Client@123'),
            'role': 'client',
        },
    ]

    for user in users:
        item = {
            'pk': f'USER#{user["userId"]}',
            'sk': 'PROFILE',
            'userId': user['userId'],
            'email': user['email'],
            'name': user['name'],
            'password': user['password'],
            'role': user['role'],
            'emailVerified': True,
            'entityType': 'USER',
            'createdAt': now,
            'updatedAt': now,
        }
        main_table.put_item(Item=item)
        print(f"  Created user: {user['name']} ({user['email']}) - role: {user['role']}")

    return users


def seed_courses():
    """Create 2 courses with 3 modules each, 3 lessons per module."""
    print("Seeding courses...")
    now = iso_now()

    courses = [
        {
            'courseId': 'course-finops-001',
            'title': 'FinOps Training Program',
            'description': 'Comprehensive FinOps training covering cloud financial management, cost optimization, and FinOps framework best practices.',
            'category': 'FinOps',
            'price': 29900,  # $299.00
            'currency': 'usd',
            'level': 'intermediate',
            'duration': '40 hours',
            'thumbnail': 'courses/finops-training.jpg',
            'modules': [
                {
                    'moduleId': 'mod-finops-01',
                    'title': 'Introduction to FinOps',
                    'order': 1,
                    'lessons': [
                        {'lessonId': 'les-finops-0101', 'title': 'What is FinOps?', 'type': 'video', 'duration': '25 min', 'order': 1},
                        {'lessonId': 'les-finops-0102', 'title': 'FinOps Framework Overview', 'type': 'video', 'duration': '30 min', 'order': 2},
                        {'lessonId': 'les-finops-0103', 'title': 'Cloud Cost Management Basics', 'type': 'video', 'duration': '20 min', 'order': 3},
                    ],
                },
                {
                    'moduleId': 'mod-finops-02',
                    'title': 'Cost Optimization Strategies',
                    'order': 2,
                    'lessons': [
                        {'lessonId': 'les-finops-0201', 'title': 'Right-Sizing Resources', 'type': 'video', 'duration': '35 min', 'order': 1},
                        {'lessonId': 'les-finops-0202', 'title': 'Reserved Instances & Savings Plans', 'type': 'video', 'duration': '40 min', 'order': 2},
                        {'lessonId': 'les-finops-0203', 'title': 'Spot Instance Strategies', 'type': 'video', 'duration': '30 min', 'order': 3},
                    ],
                },
                {
                    'moduleId': 'mod-finops-03',
                    'title': 'FinOps Governance & Reporting',
                    'order': 3,
                    'lessons': [
                        {'lessonId': 'les-finops-0301', 'title': 'Tagging & Allocation', 'type': 'video', 'duration': '25 min', 'order': 1},
                        {'lessonId': 'les-finops-0302', 'title': 'Budgets & Alerts', 'type': 'video', 'duration': '20 min', 'order': 2},
                        {'lessonId': 'les-finops-0303', 'title': 'FinOps Maturity Model', 'type': 'video', 'duration': '30 min', 'order': 3},
                    ],
                },
            ],
        },
        {
            'courseId': 'course-awsai-001',
            'title': 'AWS AI Training Program',
            'description': 'Deep dive into AWS AI/ML services including SageMaker, Bedrock, and building production AI solutions on AWS.',
            'category': 'AWS AI',
            'price': 39900,  # $399.00
            'currency': 'usd',
            'level': 'advanced',
            'duration': '50 hours',
            'thumbnail': 'courses/aws-ai-training.jpg',
            'modules': [
                {
                    'moduleId': 'mod-awsai-01',
                    'title': 'AWS AI/ML Foundations',
                    'order': 1,
                    'lessons': [
                        {'lessonId': 'les-awsai-0101', 'title': 'AWS AI Services Overview', 'type': 'video', 'duration': '30 min', 'order': 1},
                        {'lessonId': 'les-awsai-0102', 'title': 'Amazon SageMaker Basics', 'type': 'video', 'duration': '45 min', 'order': 2},
                        {'lessonId': 'les-awsai-0103', 'title': 'Data Preparation on AWS', 'type': 'video', 'duration': '35 min', 'order': 3},
                    ],
                },
                {
                    'moduleId': 'mod-awsai-02',
                    'title': 'Amazon Bedrock & Generative AI',
                    'order': 2,
                    'lessons': [
                        {'lessonId': 'les-awsai-0201', 'title': 'Introduction to Amazon Bedrock', 'type': 'video', 'duration': '30 min', 'order': 1},
                        {'lessonId': 'les-awsai-0202', 'title': 'Building with Foundation Models', 'type': 'video', 'duration': '40 min', 'order': 2},
                        {'lessonId': 'les-awsai-0203', 'title': 'RAG Architecture on AWS', 'type': 'video', 'duration': '45 min', 'order': 3},
                    ],
                },
                {
                    'moduleId': 'mod-awsai-03',
                    'title': 'Production AI on AWS',
                    'order': 3,
                    'lessons': [
                        {'lessonId': 'les-awsai-0301', 'title': 'ML Model Deployment', 'type': 'video', 'duration': '35 min', 'order': 1},
                        {'lessonId': 'les-awsai-0302', 'title': 'MLOps with SageMaker Pipelines', 'type': 'video', 'duration': '40 min', 'order': 2},
                        {'lessonId': 'les-awsai-0303', 'title': 'AI Solution Architecture', 'type': 'video', 'duration': '30 min', 'order': 3},
                    ],
                },
            ],
        },
    ]

    for course in courses:
        # Count total lessons
        total_lessons = sum(len(m['lessons']) for m in course['modules'])

        # Store course metadata
        course_item = {
            'pk': f'COURSE#{course["courseId"]}',
            'sk': 'METADATA',
            'courseId': course['courseId'],
            'title': course['title'],
            'description': course['description'],
            'category': course['category'],
            'price': course['price'],
            'currency': course.get('currency', 'usd'),
            'level': course['level'],
            'duration': course['duration'],
            'thumbnail': course.get('thumbnail', ''),
            'totalModules': len(course['modules']),
            'totalLessons': total_lessons,
            'status': 'published',
            'entityType': 'COURSE',
            'createdAt': now,
            'updatedAt': now,
        }
        main_table.put_item(Item=course_item)
        print(f"  Created course: {course['title']} ({total_lessons} lessons)")

        # Store modules
        for module in course['modules']:
            module_item = {
                'pk': f'COURSE#{course["courseId"]}',
                'sk': f'MODULE#{module["moduleId"]}',
                'moduleId': module['moduleId'],
                'courseId': course['courseId'],
                'title': module['title'],
                'order': module['order'],
                'lessonCount': len(module['lessons']),
                'entityType': 'MODULE',
                'createdAt': now,
                'updatedAt': now,
            }
            main_table.put_item(Item=module_item)

            # Store lessons
            for lesson in module['lessons']:
                lesson_item = {
                    'pk': f'COURSE#{course["courseId"]}',
                    'sk': f'LESSON#{lesson["lessonId"]}',
                    'lessonId': lesson['lessonId'],
                    'courseId': course['courseId'],
                    'moduleId': module['moduleId'],
                    'title': lesson['title'],
                    'type': lesson['type'],
                    'duration': lesson['duration'],
                    'order': lesson['order'],
                    'entityType': 'LESSON',
                    'createdAt': now,
                    'updatedAt': now,
                }
                main_table.put_item(Item=lesson_item)

    return courses


def seed_services():
    """Create 6 FinOps consulting services."""
    print("Seeding services...")
    now = iso_now()

    services = [
        {
            'serviceId': 'svc-001',
            'title': 'Cloud Cost Assessment',
            'description': 'Comprehensive assessment of your cloud infrastructure costs with actionable recommendations for optimization.',
            'category': 'FinOps Consulting',
            'price': 5000,
            'features': ['Full cost analysis', 'Waste identification', 'Optimization roadmap', 'Executive summary report'],
            'serviceOrder': 1,
        },
        {
            'serviceId': 'svc-002',
            'title': 'FinOps Foundation Setup',
            'description': 'Establish FinOps practices including tagging strategy, cost allocation, budgets, and team enablement.',
            'category': 'FinOps Consulting',
            'price': 15000,
            'features': ['Tagging strategy', 'Cost allocation design', 'Budget & alert setup', 'Team training sessions'],
            'serviceOrder': 2,
        },
        {
            'serviceId': 'svc-003',
            'title': 'Reserved Instance Optimization',
            'description': 'Expert analysis and purchasing strategy for Reserved Instances and Savings Plans across AWS, Azure, and GCP.',
            'category': 'FinOps Consulting',
            'price': 8000,
            'features': ['Usage analysis', 'RI/SP recommendations', 'Purchase planning', 'ROI projections'],
            'serviceOrder': 3,
        },
        {
            'serviceId': 'svc-004',
            'title': 'Multi-Cloud Cost Management',
            'description': 'Unified cost visibility and management across AWS, Azure, and Google Cloud environments.',
            'category': 'FinOps Consulting',
            'price': 20000,
            'features': ['Multi-cloud dashboard', 'Cross-cloud optimization', 'Vendor comparison', 'Consolidated reporting'],
            'serviceOrder': 4,
        },
        {
            'serviceId': 'svc-005',
            'title': 'FinOps Maturity Accelerator',
            'description': 'Accelerate your FinOps maturity with guided workshops, tool implementation, and culture transformation.',
            'category': 'FinOps Consulting',
            'price': 25000,
            'features': ['Maturity assessment', 'Customized roadmap', 'Tool implementation', 'Quarterly reviews'],
            'serviceOrder': 5,
        },
        {
            'serviceId': 'svc-006',
            'title': 'AI Cost Optimization',
            'description': 'Specialized cost optimization for AI/ML workloads including SageMaker, GPU instances, and model serving.',
            'category': 'AI Consulting',
            'price': 12000,
            'features': ['AI workload analysis', 'GPU optimization', 'Model serving costs', 'Training cost reduction'],
            'serviceOrder': 6,
        },
    ]

    for svc in services:
        item = {
            'pk': f'SERVICE#{svc["serviceId"]}',
            'sk': 'METADATA',
            'serviceId': svc['serviceId'],
            'title': svc['title'],
            'description': svc['description'],
            'category': svc['category'],
            'price': svc['price'],
            'features': svc['features'],
            'serviceEntityType': 'SERVICE',
            'serviceOrder': svc['serviceOrder'],
            'entityType': 'SERVICE',
            'status': 'active',
            'createdAt': now,
            'updatedAt': now,
        }
        main_table.put_item(Item=item)
        print(f"  Created service: {svc['title']}")

    return services


def seed_leads():
    """Create 5 sample leads."""
    print("Seeding leads...")
    now = iso_now()

    leads = [
        {
            'leadId': 'lead-001',
            'name': 'Sarah Johnson',
            'email': 'sarah.johnson@techstart.io',
            'company': 'TechStart Inc.',
            'phone': '+1-555-0101',
            'serviceName': 'Cloud Cost Assessment',
            'serviceId': 'svc-001',
            'message': 'We are spending over $50k/month on AWS and need help optimizing our costs.',
            'source': 'website',
            'status': 'new',
        },
        {
            'leadId': 'lead-002',
            'name': 'David Chen',
            'email': 'david.chen@megacorp.com',
            'company': 'MegaCorp',
            'phone': '+1-555-0202',
            'serviceName': 'FinOps Foundation Setup',
            'serviceId': 'svc-002',
            'message': 'Looking to establish FinOps practices across our engineering organization of 200+ developers.',
            'source': 'referral',
            'status': 'contacted',
        },
        {
            'leadId': 'lead-003',
            'name': 'Emily Rodriguez',
            'email': 'emily.r@cloudnative.dev',
            'company': 'CloudNative Solutions',
            'phone': '+1-555-0303',
            'serviceName': 'Multi-Cloud Cost Management',
            'serviceId': 'svc-004',
            'message': 'We use both AWS and Azure and need unified cost management and reporting.',
            'source': 'website',
            'status': 'new',
        },
        {
            'leadId': 'lead-004',
            'name': 'Robert Kim',
            'email': 'robert.kim@aiventures.com',
            'company': 'AI Ventures',
            'phone': '+1-555-0404',
            'serviceName': 'AI Cost Optimization',
            'serviceId': 'svc-006',
            'message': 'Our ML training costs are growing rapidly. Need help optimizing SageMaker and GPU usage.',
            'source': 'linkedin',
            'status': 'qualified',
        },
        {
            'leadId': 'lead-005',
            'name': 'Amanda Foster',
            'email': 'amanda@globalretail.com',
            'company': 'Global Retail Co.',
            'phone': '+1-555-0505',
            'serviceName': 'FinOps Maturity Accelerator',
            'serviceId': 'svc-005',
            'message': 'We want to move from crawl to run phase in our FinOps journey. Currently at $2M annual cloud spend.',
            'source': 'service_request',
            'status': 'new',
        },
    ]

    for lead in leads:
        item = {
            'pk': f'LEAD#{lead["leadId"]}',
            'sk': 'METADATA',
            'leadId': lead['leadId'],
            'name': lead['name'],
            'email': lead['email'],
            'company': lead['company'],
            'phone': lead['phone'],
            'serviceName': lead['serviceName'],
            'serviceId': lead['serviceId'],
            'message': lead['message'],
            'source': lead['source'],
            'status': lead['status'],
            'entityType': 'LEAD',
            'createdAt': now,
            'updatedAt': now,
        }
        leads_table.put_item(Item=item)
        print(f"  Created lead: {lead['name']} ({lead['company']})")

    return leads


def main():
    print("=" * 60)
    print("CloudAIP DynamoDB Seed Script")
    print("=" * 60)
    print(f"Main Table:     {MAIN_TABLE_NAME}")
    print(f"Activity Table: {ACTIVITY_TABLE_NAME}")
    print(f"Leads Table:    {LEADS_TABLE_NAME}")
    print("=" * 60)

    seed_users()
    print()
    seed_courses()
    print()
    seed_services()
    print()
    seed_leads()

    print()
    print("=" * 60)
    print("Seeding complete!")
    print("=" * 60)


if __name__ == '__main__':
    main()
