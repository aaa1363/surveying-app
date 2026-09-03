/**
 * Stage 6 Domain Models:
 * Surveyor Public Profile, Resume, Credentials, Portfolio,
 * Published Price Cards, Client Selections, Reviews & Moderation
 */

import { UserRole } from './User';

export type Stage6Environment = 'demo' | 'real';

export interface RepositoryActor {
  userId: string;
  role: UserRole;
  environment: Stage6Environment;
}

export interface SurveyorPublicProfile {
  id: string;
  userId: string;
  fullName: string;
  title: string; // e.g. مهندس نقشه‌بردار ارشد / کارشناس نقشه‌برداری با مدرک ثبت‌شده
  bio: string;
  province: string;
  city: string;
  serviceAreas: string[];
  specialties: string[];
  experienceYears: number;
  isPublic: boolean;
  phone?: string; // Only populated for self or the same client after an inquiry
  hasPhoneAccess?: boolean;
  phoneMaskedNotice?: string;
  email?: string;
  website?: string;
  ratingAverage: number;
  reviewCount: number;
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  environment: Stage6Environment;
  schemaVersion: 1;
}

export type ResumeType = 'work' | 'education' | 'project' | 'award';

export interface SurveyorResumeItem {
  id: string;
  userId: string;
  type: ResumeType;
  title: string;
  organization: string;
  location?: string;
  startYearJalali: string;
  endYearJalali?: string;
  isCurrent: boolean;
  description?: string;
  orderIndex: number;
  createdAt: string;
  environment: Stage6Environment;
}

export type CredentialType =
  | 'engineering_license'
  | 'judicial_expert'
  | 'drone_pilot'
  | 'society_membership'
  | 'certificate';

export interface SurveyorCredential {
  id: string;
  userId: string;
  type: CredentialType;
  title: string;
  issuer: string;
  credentialNumber: string;
  issueDateJalali: string;
  expiryDateJalali?: string;
  gradeOrBase?: string;
  isVerified: boolean;
  isPublic: boolean;
  createdAt: string;
  environment: Stage6Environment;
}

export interface PortfolioItem {
  id: string;
  userId: string;
  title: string;
  category: string; // پهپاد، تفکیک، UTM، صنعتی، راهسازی، مانیتورینگ
  clientName?: string;
  location: string;
  completionYearJalali: string;
  scaleOrVolume?: string; // e.g. ۵۰۰ هکتار / ۲۵ کیلومتر
  equipmentUsed?: string[];
  description: string;
  deliverablesSummary?: string;
  isFeatured: boolean;
  createdAt: string;
  environment: Stage6Environment;
}

export interface PublishedPriceCard {
  id: string;
  userId: string;
  title: string;
  serviceCategory: string;
  unit: string; // هر هکتار، هر قطعه، روزانه، هر شیت
  basePrice: number; // in TOMAN
  priceRangeMax?: number; // in TOMAN (optional)
  estimatedTurnaround: string; // e.g. ۲ الی ۴ روز کاری
  conditionsAndInclusions: string[];
  notes?: string;
  isPublished: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  environment: Stage6Environment;
}

export type SelectionStatus = 'submitted' | 'contacted' | 'negotiating' | 'completed' | 'archived';

export interface SurveyorSelection {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  surveyorId: string;
  surveyorName: string;
  /** Transient response field. It must never be persisted in a SelectionRecord. */
  surveyorPhone?: string;
  serviceRequestedTitle: string;
  location: string;
  approximateBudget?: number; // in TOMAN
  preferredDateJalali?: string;
  inquiryNotes: string;
  status: SelectionStatus;
  createdAtJalali?: string;
  createdAt: string;
  environment: Stage6Environment;
}

export interface CriteriaRatings {
  accuracy: number; // 1-5
  punctuality: number; // 1-5
  communication: number; // 1-5
  pricingFairness: number; // 1-5
}

export interface SurveyorReview {
  id: string;
  surveyorId: string;
  clientId: string;
  clientName: string;
  selectionId?: string;
  overallRating: number; // 1-5
  ratings: CriteriaRatings;
  projectType: string;
  comment: string;
  isApproved: boolean; // default true for clean reviews
  isReported: boolean;
  reportReason?: string;
  adminModerationNote?: string;
  surveyorReply?: {
    text: string;
    replyDateJalali: string;
  };
  createdAtJalali: string;
  createdAt: string;
  environment: Stage6Environment;
}

export interface ReviewAggregate {
  surveyorId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  categoryAverages: {
    accuracy: number;
    punctuality: number;
    communication: number;
    pricingFairness: number;
  };
}

export type ModerationTargetType = 'review' | 'profile' | 'price_card' | 'portfolio';
export type ModerationStatus = 'pending' | 'reviewed' | 'action_taken' | 'dismissed';

export interface ModerationReport {
  id: string;
  targetType: ModerationTargetType;
  targetId: string;
  reportedByUserId: string;
  reason: string;
  status: ModerationStatus;
  actionTaken?: 'hidden' | 'approved' | 'modified';
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  environment: Stage6Environment;
}

export interface ModerationAuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  performedByUserId: string;
  details: string;
  timestamp: string;
  environment: Stage6Environment;
}

export type DelegatedPermissionType =
  | 'moderate_reviews'
  | 'verify_credentials'
  | 'manage_price_catalogs';

export interface DelegatedAdminPermission {
  id: string;
  userId: string;
  grantedByUserId: string;
  permissions: DelegatedPermissionType[];
  grantedAt: string;
  environment: Stage6Environment;
}
