import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/cloudaip";

// ---------------------------------------------------------------------------
// Schemas (inline so the seed script is self-contained)
// ---------------------------------------------------------------------------

// User
const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "student", "client", "instructor"],
      default: "student",
    },
    avatar: String,
    phone: String,
    company: String,
    jobTitle: String,
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// Course
const lessonSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ["video", "article", "quiz", "lab"],
      default: "video",
    },
    content: { type: String, required: true },
    videoUrl: String,
    duration: { type: Number, default: 0 },
    order: { type: Number, required: true },
    isPreview: { type: Boolean, default: false },
    resources: [
      {
        name: String,
        url: String,
        type: { type: String, enum: ["pdf", "link", "download"] },
      },
    ],
  },
  { timestamps: true }
);

const moduleSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    order: { type: Number, required: true },
    lessons: [lessonSchema],
  },
  { timestamps: true }
);

const courseSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true },
    category: {
      type: String,
      enum: ["finops", "aws", "azure", "gcp", "devops", "security"],
      required: true,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    thumbnail: { type: String, default: "" },
    previewVideoUrl: String,
    instructor: { type: Schema.Types.ObjectId, ref: "User" },
    price: { type: Number, required: true },
    discountPrice: Number,
    currency: { type: String, default: "USD" },
    modules: [moduleSchema],
    totalDuration: { type: Number, default: 0 },
    totalLessons: { type: Number, default: 0 },
    enrollmentCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    tags: [String],
    prerequisites: [String],
    learningOutcomes: [String],
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

// Service
const serviceSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    tagline: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["finops", "cloud-optimization", "consulting", "managed-services"],
      required: true,
    },
    features: [String],
    benefits: [String],
    icon: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    pricing: {
      type: {
        type: String,
        enum: ["fixed", "monthly", "custom", "usage-based"],
      },
      startingPrice: Number,
      currency: { type: String, default: "USD" },
      details: String,
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Service = mongoose.model("Service", serviceSchema);

// Lead
const leadSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    company: { type: String, required: true },
    jobTitle: String,
    source: {
      type: String,
      enum: ["website", "referral", "linkedin", "event", "partner", "other"],
      default: "website",
    },
    interest: {
      type: String,
      enum: ["training", "services", "consulting", "partnership"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "negotiation",
        "won",
        "lost",
      ],
      default: "new",
    },
    notes: String,
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    estimatedValue: Number,
  },
  { timestamps: true }
);

const Lead = mongoose.model("Lead", leadSchema);

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

async function seed(): Promise<void> {
  console.log(`Connecting to MongoDB at ${MONGODB_URI} ...`);
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Service.deleteMany({}),
    Lead.deleteMany({}),
  ]);
  console.log("Cleared existing data.");

  // ---- Users ----
  const hashedPassword = await bcrypt.hash("Admin123!", 12);
  const studentPassword = await bcrypt.hash("Student123!", 12);
  const clientPassword = await bcrypt.hash("Client123!", 12);

  const [adminUser] = await User.insertMany([
    {
      email: "admin@cloudaip.com",
      password: hashedPassword,
      firstName: "CloudAIP",
      lastName: "Admin",
      role: "admin",
      isActive: true,
      isEmailVerified: true,
      company: "CloudAIP",
      jobTitle: "Platform Administrator",
    },
    {
      email: "student1@example.com",
      password: studentPassword,
      firstName: "Alice",
      lastName: "Johnson",
      role: "student",
      isActive: true,
      isEmailVerified: true,
      company: "TechStart Inc.",
      jobTitle: "Cloud Engineer",
    },
    {
      email: "student2@example.com",
      password: studentPassword,
      firstName: "Bob",
      lastName: "Martinez",
      role: "student",
      isActive: true,
      isEmailVerified: true,
      company: "DataFlow Corp",
      jobTitle: "DevOps Engineer",
    },
    {
      email: "client1@example.com",
      password: clientPassword,
      firstName: "Carol",
      lastName: "Williams",
      role: "client",
      isActive: true,
      isEmailVerified: true,
      company: "Enterprise Solutions Ltd",
      jobTitle: "VP of Engineering",
    },
  ]);

  console.log("Created 4 users (1 admin, 2 students, 1 client).");

  // ---- Courses ----
  const finopsCourse = {
    title: "FinOps Certified Practitioner",
    slug: "finops-certified-practitioner",
    description:
      "Master the principles and practices of Cloud Financial Management. This comprehensive course prepares you for the FinOps Certified Practitioner exam with real-world scenarios, hands-on labs, and expert instruction covering the full FinOps lifecycle.",
    shortDescription:
      "Prepare for the FinOps Certified Practitioner exam with hands-on labs and expert-led instruction.",
    category: "finops",
    level: "intermediate" as const,
    thumbnail: "/images/courses/finops-practitioner.jpg",
    instructor: adminUser._id,
    price: 499,
    discountPrice: 399,
    currency: "USD",
    tags: ["finops", "cloud-cost", "certification", "practitioner"],
    prerequisites: [
      "Basic understanding of cloud computing",
      "Familiarity with at least one major cloud provider",
    ],
    learningOutcomes: [
      "Understand the FinOps framework and its principles",
      "Implement cost allocation and showback/chargeback models",
      "Optimize cloud spending across AWS, Azure, and GCP",
      "Build a culture of financial accountability",
      "Pass the FinOps Certified Practitioner exam",
    ],
    isPublished: true,
    isFeatured: true,
    totalDuration: 1620,
    totalLessons: 9,
    modules: [
      {
        title: "FinOps Foundations",
        description:
          "Understand the core principles and framework of FinOps.",
        order: 1,
        lessons: [
          {
            title: "What is FinOps?",
            description:
              "Introduction to Cloud Financial Management and the FinOps Foundation.",
            type: "video",
            content:
              "This lesson covers the definition of FinOps, its origins, and why organizations adopt it to manage cloud costs effectively.",
            duration: 30,
            order: 1,
            isPreview: true,
          },
          {
            title: "FinOps Principles",
            description:
              "The six core principles that guide FinOps practice.",
            type: "video",
            content:
              "Deep dive into the six FinOps principles: Teams need to collaborate, decisions are driven by business value, everyone takes ownership, reports should be accessible and timely, a centralized team drives FinOps, and leverage the variable cost model of cloud.",
            duration: 45,
            order: 2,
            isPreview: false,
          },
          {
            title: "FinOps Lifecycle",
            description:
              "The Inform, Optimize, and Operate phases of FinOps.",
            type: "article",
            content:
              "Detailed walkthrough of the three iterative phases: Inform (visibility and allocation), Optimize (rates and usage), and Operate (continuous improvement and governance).",
            duration: 35,
            order: 3,
            isPreview: false,
          },
        ],
      },
      {
        title: "Cloud Cost Allocation & Reporting",
        description:
          "Learn to allocate costs, build dashboards, and implement showback/chargeback.",
        order: 2,
        lessons: [
          {
            title: "Tagging Strategies",
            description:
              "Designing and enforcing a cloud tagging standard.",
            type: "video",
            content:
              "Covers tagging best practices, mandatory vs. optional tags, tag enforcement policies, and automation tools for consistent tagging across accounts.",
            duration: 40,
            order: 1,
            isPreview: false,
          },
          {
            title: "Cost Allocation Models",
            description:
              "Showback, chargeback, and hybrid allocation approaches.",
            type: "video",
            content:
              "Explains different allocation models, shared cost distribution methods, amortization of reservations, and how to handle untagged or unallocated spend.",
            duration: 50,
            order: 2,
            isPreview: false,
          },
          {
            title: "Building FinOps Dashboards",
            description:
              "Hands-on lab creating cost visibility dashboards.",
            type: "lab",
            content:
              "Step-by-step lab to build cost dashboards using real cloud billing data, including unit economics, trend analysis, and anomaly detection views.",
            duration: 60,
            order: 3,
            isPreview: false,
          },
        ],
      },
      {
        title: "Optimization & Governance",
        description:
          "Rate optimization, rightsizing, and establishing governance.",
        order: 3,
        lessons: [
          {
            title: "Rate Optimization",
            description:
              "Reserved Instances, Savings Plans, and committed-use discounts.",
            type: "video",
            content:
              "Comprehensive guide to rate optimization strategies including RI purchasing, Savings Plans coverage, spot instances, and CUD management across cloud providers.",
            duration: 45,
            order: 1,
            isPreview: false,
          },
          {
            title: "Rightsizing & Usage Optimization",
            description:
              "Identifying and acting on rightsizing opportunities.",
            type: "video",
            content:
              "Techniques for identifying idle and underutilized resources, rightsizing recommendations, scheduling policies, and storage lifecycle optimization.",
            duration: 50,
            order: 2,
            isPreview: false,
          },
          {
            title: "FinOps Governance Framework",
            description:
              "Policies, automation, and organizational alignment.",
            type: "article",
            content:
              "Building a governance framework with budget alerts, anomaly detection, approval workflows, and policy-as-code for cloud cost management.",
            duration: 40,
            order: 3,
            isPreview: false,
          },
        ],
      },
    ],
  };

  const awsCourse = {
    title: "AWS AI Practitioner",
    slug: "aws-ai-practitioner",
    description:
      "Gain a comprehensive understanding of AI/ML concepts on AWS. This course covers the foundations of artificial intelligence, machine learning services on AWS, and prepares you for the AWS Certified AI Practitioner certification with practical examples and hands-on labs.",
    shortDescription:
      "Learn AI and ML fundamentals on AWS and prepare for the AWS AI Practitioner certification.",
    category: "aws",
    level: "beginner" as const,
    thumbnail: "/images/courses/aws-ai-practitioner.jpg",
    instructor: adminUser._id,
    price: 449,
    discountPrice: 349,
    currency: "USD",
    tags: ["aws", "ai", "machine-learning", "certification"],
    prerequisites: [
      "Basic understanding of AWS cloud services",
      "No prior AI/ML experience required",
    ],
    learningOutcomes: [
      "Understand fundamental AI and ML concepts",
      "Navigate AWS AI/ML services and choose the right tool",
      "Build and deploy ML models using Amazon SageMaker",
      "Implement responsible AI practices",
      "Pass the AWS AI Practitioner certification exam",
    ],
    isPublished: true,
    isFeatured: true,
    totalDuration: 1530,
    totalLessons: 9,
    modules: [
      {
        title: "AI/ML Fundamentals",
        description:
          "Core concepts of artificial intelligence and machine learning.",
        order: 1,
        lessons: [
          {
            title: "Introduction to AI and ML",
            description:
              "What is AI, ML, and Deep Learning? Key differences and use cases.",
            type: "video",
            content:
              "Overview of artificial intelligence, machine learning, and deep learning. Covers supervised, unsupervised, and reinforcement learning paradigms with real-world examples.",
            duration: 35,
            order: 1,
            isPreview: true,
          },
          {
            title: "ML Problem Framing",
            description:
              "How to define an ML problem and choose the right approach.",
            type: "video",
            content:
              "Learn to identify whether a problem is suitable for ML, frame it correctly (classification, regression, clustering), select features, and define success metrics.",
            duration: 40,
            order: 2,
            isPreview: false,
          },
          {
            title: "Data Preparation for ML",
            description:
              "Data collection, cleaning, and feature engineering fundamentals.",
            type: "article",
            content:
              "Best practices for data preparation including handling missing values, feature scaling, encoding categorical variables, and splitting datasets for training and evaluation.",
            duration: 45,
            order: 3,
            isPreview: false,
          },
        ],
      },
      {
        title: "AWS AI/ML Services",
        description:
          "Explore the breadth of AI and ML services available on AWS.",
        order: 2,
        lessons: [
          {
            title: "Amazon SageMaker Overview",
            description:
              "End-to-end ML platform for building, training, and deploying models.",
            type: "video",
            content:
              "Comprehensive tour of SageMaker including Studio, notebooks, built-in algorithms, training jobs, model hosting, and SageMaker Pipelines for MLOps.",
            duration: 50,
            order: 1,
            isPreview: false,
          },
          {
            title: "AWS AI Services",
            description:
              "Pre-trained AI services: Rekognition, Comprehend, Textract, Polly, and Translate.",
            type: "video",
            content:
              "Hands-on exploration of AWS managed AI services for vision, language, speech, and document processing. Includes API walkthroughs and integration patterns.",
            duration: 55,
            order: 2,
            isPreview: false,
          },
          {
            title: "Building with Amazon Bedrock",
            description:
              "Generative AI with foundation models on AWS.",
            type: "lab",
            content:
              "Lab exercise using Amazon Bedrock to access foundation models, build conversational AI applications, implement RAG patterns, and customize models with fine-tuning.",
            duration: 60,
            order: 3,
            isPreview: false,
          },
        ],
      },
      {
        title: "Responsible AI & Exam Preparation",
        description:
          "AI ethics, governance, and certification exam readiness.",
        order: 3,
        lessons: [
          {
            title: "Responsible AI on AWS",
            description:
              "Fairness, explainability, privacy, and governance in AI systems.",
            type: "video",
            content:
              "Covers AWS tools for responsible AI including SageMaker Clarify for bias detection, Model Monitor for drift detection, and implementing AI governance frameworks.",
            duration: 40,
            order: 1,
            isPreview: false,
          },
          {
            title: "AI Security & Compliance",
            description:
              "Securing AI workloads and meeting compliance requirements.",
            type: "article",
            content:
              "Best practices for securing ML pipelines, data encryption, access control for models and endpoints, compliance considerations, and audit logging for AI systems.",
            duration: 35,
            order: 2,
            isPreview: false,
          },
          {
            title: "Practice Exam & Review",
            description:
              "Full-length practice exam with detailed explanations.",
            type: "quiz",
            content:
              "Complete practice exam covering all domains of the AWS AI Practitioner certification with detailed answer explanations and references to AWS documentation.",
            duration: 60,
            order: 3,
            isPreview: false,
          },
        ],
      },
    ],
  };

  await Course.insertMany([finopsCourse, awsCourse]);
  console.log("Created 2 courses with modules and lessons.");

  // ---- Services ----
  const services = [
    {
      name: "CloudAIP Assessment",
      slug: "cloudaip-assessment",
      tagline: "Comprehensive cloud cost and architecture assessment",
      description:
        "A thorough analysis of your cloud environment covering cost efficiency, architectural best practices, security posture, and optimization opportunities. Our certified experts deliver an actionable report with prioritized recommendations and projected savings.",
      category: "finops",
      features: [
        "Full cloud environment audit",
        "Cost optimization roadmap",
        "Architecture review and recommendations",
        "Security and compliance gap analysis",
        "Executive summary with ROI projections",
      ],
      benefits: [
        "Identify 20-40% potential cost savings",
        "Improve architectural resilience",
        "Reduce security risk exposure",
        "Data-driven optimization priorities",
      ],
      icon: "clipboard-check",
      thumbnail: "/images/services/assessment.jpg",
      pricing: {
        type: "fixed",
        startingPrice: 5000,
        currency: "USD",
        details: "One-time assessment fee based on environment size",
      },
      isActive: true,
      order: 1,
    },
    {
      name: "CloudAIP Visualizer",
      slug: "cloudaip-visualizer",
      tagline: "Real-time cloud cost visibility and dashboards",
      description:
        "Interactive dashboards and reporting tools that provide real-time visibility into your cloud spending across all accounts, services, and teams. Customizable views with anomaly detection and budget tracking built in.",
      category: "cloud-optimization",
      features: [
        "Multi-cloud cost dashboards",
        "Real-time spending alerts",
        "Custom report builder",
        "Anomaly detection engine",
        "Team and project cost breakdowns",
        "Trend analysis and forecasting",
      ],
      benefits: [
        "Complete cost visibility in minutes",
        "Catch billing anomalies instantly",
        "Empower teams with self-service reports",
        "Accurate budget forecasting",
      ],
      icon: "bar-chart-2",
      thumbnail: "/images/services/visualizer.jpg",
      pricing: {
        type: "monthly",
        startingPrice: 500,
        currency: "USD",
        details: "Monthly subscription based on monitored cloud spend",
      },
      isActive: true,
      order: 2,
    },
    {
      name: "CloudAIP Optimizer",
      slug: "cloudaip-optimizer",
      tagline: "Automated cloud resource optimization",
      description:
        "AI-powered optimization engine that continuously analyzes your cloud resources and automatically applies rightsizing, scheduling, and purchasing recommendations to reduce waste and maximize efficiency.",
      category: "cloud-optimization",
      features: [
        "Automated rightsizing recommendations",
        "Reserved Instance and Savings Plan optimization",
        "Idle resource detection and cleanup",
        "Scheduling automation for non-production workloads",
        "Storage tier optimization",
        "Container and serverless cost optimization",
      ],
      benefits: [
        "Reduce cloud waste by up to 35%",
        "Automate repetitive optimization tasks",
        "Maximize commitment discount coverage",
        "Continuous optimization without manual effort",
      ],
      icon: "settings",
      thumbnail: "/images/services/optimizer.jpg",
      pricing: {
        type: "monthly",
        startingPrice: 800,
        currency: "USD",
        details: "Percentage-of-savings or flat monthly fee available",
      },
      isActive: true,
      order: 3,
    },
    {
      name: "CloudAIP Enforcer",
      slug: "cloudaip-enforcer",
      tagline: "Cloud governance and policy enforcement",
      description:
        "Policy-as-code engine that enforces your organization's cloud governance rules in real time. Prevent cost overruns, enforce tagging standards, and ensure compliance before resources are provisioned.",
      category: "managed-services",
      features: [
        "Policy-as-code framework",
        "Real-time provisioning guardrails",
        "Tagging compliance enforcement",
        "Budget limit enforcement",
        "Approval workflows for high-cost resources",
        "Compliance audit trail",
      ],
      benefits: [
        "Prevent cost overruns proactively",
        "Achieve 95%+ tagging compliance",
        "Automate governance at scale",
        "Full audit trail for compliance",
      ],
      icon: "shield",
      thumbnail: "/images/services/enforcer.jpg",
      pricing: {
        type: "monthly",
        startingPrice: 600,
        currency: "USD",
        details: "Tiered pricing based on number of accounts managed",
      },
      isActive: true,
      order: 4,
    },
    {
      name: "CloudAIP Smart Saver",
      slug: "cloudaip-smart-saver",
      tagline: "Intelligent commitment management and purchasing",
      description:
        "Smart purchasing engine that analyzes your usage patterns and automatically manages Reserved Instances, Savings Plans, and spot instances to maximize discounts while maintaining flexibility.",
      category: "cloud-optimization",
      features: [
        "AI-driven purchasing recommendations",
        "Automated RI and Savings Plan management",
        "Spot instance orchestration",
        "Commitment utilization tracking",
        "Break-even analysis and forecasting",
        "Multi-account commitment sharing",
      ],
      benefits: [
        "Maximize commitment discount coverage",
        "Reduce on-demand spending by 40-60%",
        "Eliminate unused reservation waste",
        "Automated purchasing decisions",
      ],
      icon: "piggy-bank",
      thumbnail: "/images/services/smart-saver.jpg",
      pricing: {
        type: "usage-based",
        startingPrice: 300,
        currency: "USD",
        details: "Base fee plus percentage of realized savings",
      },
      isActive: true,
      order: 5,
    },
    {
      name: "CloudAIP FaaS (FinOps as a Service)",
      slug: "cloudaip-faas",
      tagline: "Fully managed FinOps practice for your organization",
      description:
        "End-to-end managed FinOps service where our certified practitioners embed with your teams to build and run a world-class cloud financial management practice. Includes tooling, processes, training, and ongoing optimization.",
      category: "consulting",
      features: [
        "Dedicated FinOps practitioner team",
        "Custom tooling and dashboard setup",
        "Monthly optimization reviews",
        "Executive reporting and KPIs",
        "Team training and enablement",
        "Vendor negotiation support",
        "Cloud architecture advisory",
      ],
      benefits: [
        "Full FinOps practice without hiring",
        "Proven methodology from certified experts",
        "Continuous month-over-month savings",
        "Knowledge transfer to internal teams",
      ],
      icon: "users",
      thumbnail: "/images/services/faas.jpg",
      pricing: {
        type: "custom",
        currency: "USD",
        details:
          "Custom pricing based on cloud spend, number of accounts, and engagement scope",
      },
      isActive: true,
      order: 6,
    },
  ];

  await Service.insertMany(services);
  console.log("Created 6 services.");

  // ---- Leads ----
  const leads = [
    {
      firstName: "David",
      lastName: "Chen",
      email: "david.chen@techcorp.io",
      phone: "+1-555-0101",
      company: "TechCorp International",
      jobTitle: "CTO",
      source: "website",
      interest: "services",
      status: "new",
      notes: "Interested in cloud cost optimization for multi-cloud environment.",
      estimatedValue: 50000,
    },
    {
      firstName: "Sarah",
      lastName: "Kim",
      email: "sarah.kim@finserv.com",
      phone: "+1-555-0102",
      company: "FinServ Global",
      jobTitle: "Director of Cloud Infrastructure",
      source: "linkedin",
      interest: "consulting",
      status: "contacted",
      notes:
        "Discussed FinOps maturity assessment. Follow up with proposal by end of week.",
      estimatedValue: 75000,
    },
    {
      firstName: "James",
      lastName: "Patel",
      email: "james.patel@healthdata.org",
      phone: "+1-555-0103",
      company: "HealthData Systems",
      jobTitle: "VP of Engineering",
      source: "referral",
      interest: "training",
      status: "qualified",
      notes:
        "Wants to certify 15 engineers in FinOps. Requesting group discount.",
      estimatedValue: 30000,
    },
    {
      firstName: "Maria",
      lastName: "Gonzalez",
      email: "maria.gonzalez@retailx.com",
      company: "RetailX Technologies",
      jobTitle: "Cloud Architect",
      source: "event",
      interest: "services",
      status: "proposal",
      notes:
        "Met at AWS re:Invent. Sent proposal for Optimizer + Visualizer bundle.",
      estimatedValue: 120000,
    },
    {
      firstName: "Robert",
      lastName: "O'Brien",
      email: "rob.obrien@mediastream.tv",
      phone: "+1-555-0105",
      company: "MediaStream Inc.",
      jobTitle: "Head of DevOps",
      source: "partner",
      interest: "partnership",
      status: "negotiation",
      notes:
        "Exploring reseller partnership for APAC region. Legal review in progress.",
      estimatedValue: 200000,
    },
  ];

  await Lead.insertMany(leads);
  console.log("Created 5 leads.");

  // ---------------------------------------------------------------------------
  console.log("\nSeed completed successfully!");
  console.log("  Admin login: admin@cloudaip.com / Admin123!");
  console.log("  Student logins: student1@example.com, student2@example.com / Student123!");
  console.log("  Client login: client1@example.com / Client123!");
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
