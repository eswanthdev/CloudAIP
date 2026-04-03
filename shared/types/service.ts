export interface Service {
  _id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: "finops" | "cloud-optimization" | "consulting" | "managed-services";
  features: string[];
  benefits: string[];
  icon: string;
  thumbnail: string;
  pricing?: ServicePricing;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServicePricing {
  type: "fixed" | "monthly" | "custom" | "usage-based";
  startingPrice?: number;
  currency: string;
  details?: string;
}

export interface ServiceRequest {
  _id: string;
  serviceId: string;
  userId?: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  cloudProvider: "aws" | "azure" | "gcp" | "multi-cloud" | "other";
  monthlyCloudSpend?: string;
  message: string;
  status: "new" | "contacted" | "in-progress" | "proposal-sent" | "closed-won" | "closed-lost";
  assignedTo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  jobTitle?: string;
  source: "website" | "referral" | "linkedin" | "event" | "partner" | "other";
  interest: "training" | "services" | "consulting" | "partnership";
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  notes?: string;
  assignedTo?: string;
  estimatedValue?: number;
  createdAt: Date;
  updatedAt: Date;
}
