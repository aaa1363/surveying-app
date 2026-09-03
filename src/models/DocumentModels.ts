/**
 * Document and Financial Models
 * Stage 5 - Contract, Proforma Invoice, Progress Statement, Invoices, and Milestone Payments
 */

import { ProjectClient } from './Client';

export type DocumentType = 'proforma' | 'contract' | 'statement' | 'invoice';

export interface SurveyorPartyInfo {
  fullName: string;
  phone: string;
  engineerLicenseNumber?: string;
  judicialExpertNumber?: string;
  nationalId?: string;
  address?: string;
  bankIban?: string;
  province?: string;
  city?: string;
}

export interface DocumentPartySnapshot {
  surveyor: SurveyorPartyInfo;
  client: ProjectClient;
  validationWarnings?: string[];
}

export interface DocumentCounter {
  id: string;
  userId: string;
  type: DocumentType;
  jalaliYear: number;
  lastNumber: number;
  updatedAt: string;
}

export interface DocumentStatusHistory {
  id: string;
  documentId: string;
  documentType: DocumentType;
  fromStatus: string;
  toStatus: string;
  actionDateJalali: string;
  changedByUserId: string;
  reason?: string;
  timestamp: string;
}

export interface DocumentRevision<T = unknown> {
  revision: number;
  documentNumber: string;
  savedAt: string;
  savedByUserId: string;
  snapshot: T;
}

export type ManualApprovalType = 'phone' | 'in_person' | 'paper_document';

export interface ManualApproval {
  approverName: string;
  approvalDateJalali: string;
  approvalType: ManualApprovalType;
  notes?: string;
  recordedAt: string;
}

/* =========================================================================
   1. Proforma Invoice (پیش‌فاکتور)
   ========================================================================= */

export type ProformaStatus =
  | 'draft'
  | 'issued'
  | 'phone_approved'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export interface ProformaInvoice {
  id: string;
  userId: string;
  projectId: string;
  documentNumber?: string; // e.g. PF-1405-0001 (assigned only upon issue)
  projectTitle: string;
  partySnapshot: DocumentPartySnapshot;
  serviceDescription: string;
  issueDateJalali: string;
  validityDateJalali: string;
  totalProposedAmount: number; // in TOMAN
  paymentTerms: string;
  estimatedDuration: string;
  notes?: string;
  status: ProformaStatus;
  cancellationReason?: string;
  cancellationDateJalali?: string;
  manualApproval?: ManualApproval;
  version: number;
  revisions?: DocumentRevision<ProformaInvoice>[];
  currency: 'TOMAN';
  schemaVersion: 1;
  createdAt: string;
  updatedAt: string;
}

/* =========================================================================
   2. Contract (قرارداد)
   ========================================================================= */

export type ContractStatus =
  | 'draft'
  | 'ready_to_send'
  | 'manual_approved'
  | 'active'
  | 'completed'
  | 'terminated'
  | 'cancelled';

export interface ContractSection {
  id: string;
  title: string;
  content: string;
  isRequired: boolean;
}

export interface ContractTemplate {
  id: string;
  name: string;
  version: string;
  sections: ContractSection[];
  surveyorObligations: string;
  clientObligations: string;
  scopeChangeTerms: string;
  delayTerms: string;
  terminationTerms: string;
  disputeResolution: string;
}

export interface ContractVersion {
  versionNumber: number;
  savedAt: string;
  savedByUserId: string;
  changeSummary: string;
  totalAmount: number;
  sections: ContractSection[];
  updatedAtJalali: string;
}

export interface Contract {
  id: string;
  userId: string;
  projectId: string;
  documentNumber?: string; // e.g. CT-1405-0001 (assigned only upon issue)
  projectTitle: string;
  partySnapshot: DocumentPartySnapshot;
  subject: string;
  scopeOfServices: string;
  deliverables: string;
  startDateJalali: string;
  durationDaysOrMonths: string;
  totalAmount: number; // in TOMAN
  sections: ContractSection[];
  surveyorObligations: string;
  clientObligations: string;
  scopeChangeTerms: string;
  delayTerms: string;
  terminationTerms: string;
  disputeResolution: string;
  notesAndAttachments?: string;
  status: ContractStatus;
  manualApproval?: ManualApproval;
  cancellationReason?: string;
  cancellationDateJalali?: string;
  currentVersion: number;
  versions: ContractVersion[];
  currency: 'TOMAN';
  schemaVersion: 1;
  createdAt: string;
  updatedAt: string;
}

/* =========================================================================
   3. Payment Schedule & Milestones (پرداخت‌های مرحله‌ای)
   ========================================================================= */

export type MilestoneType = 'percentage' | 'fixed_amount';
export type MilestoneStatus = 'unpaid' | 'partially_paid' | 'paid' | 'overdue';

export interface PaymentMilestone {
  id: string;
  contractId?: string;
  projectId: string;
  userId: string;
  title: string;
  type: MilestoneType;
  percentage?: number; // e.g. 25
  amount: number; // in TOMAN
  dueDateJalali?: string;
  conditionOrDeliverable?: string;
  condition?: string;
  status: MilestoneStatus;
  paidAmount: number; // in TOMAN
  notes?: string;
  orderIndex?: number;
  order?: number;
}

export interface PaymentSchedule {
  id: string;
  userId: string;
  projectId: string;
  contractId?: string;
  totalContractAmount: number;
  milestones: PaymentMilestone[];
  totalPaidAmount: number;
  remainingBalance: number;
  currency: 'TOMAN';
  schemaVersion: 1;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod =
  | 'cash'
  | 'card_to_card'
  | 'bank_transfer'
  | 'cheque'
  | 'other';

export interface PaymentRecord {
  id: string;
  userId: string;
  projectId: string;
  invoiceId: string;
  milestoneId?: string;
  milestoneTitle?: string;
  amount: number; // in TOMAN (> 0)
  paymentDateJalali: string;
  paymentMethod: PaymentMethod;
  trackingNumber?: string;
  notes?: string;
  status?: 'valid' | 'void';
  voidReason?: string;
  voidedAt?: string;
  voidedByUserId?: string;
  currency: 'TOMAN';
  schemaVersion: 1;
  createdAt: string;
  updatedAt: string;
}

/* =========================================================================
   4. Progress Statement & Service Invoice (صورت‌وضعیت و صورتحساب خدمات)
   ========================================================================= */

export type StatementStatus =
  | 'draft'
  | 'issued'
  | 'partially_paid'
  | 'settled'
  | 'cancelled';

export interface ProgressStatement {
  id: string;
  userId: string;
  projectId: string;
  contractId?: string;
  documentNumber?: string; // e.g. ST-1405-0001 (assigned only upon issue)
  stageTitle: string;
  statementDateJalali: string;
  progressPercentage?: number; // Optional progress %
  totalClaimableAmount: number; // in TOMAN
  previousClaimedAmount: number; // in TOMAN
  currentStageAmount: number; // in TOMAN (totalClaimable - previousClaimed)
  remainingBalance: number; // in TOMAN
  notes?: string;
  status: StatementStatus;
  manualApproval?: ManualApproval;
  cancellationReason?: string;
  cancellationDateJalali?: string;
  version: number;
  revisions?: DocumentRevision<ProgressStatement>[];
  currency: 'TOMAN';
  schemaVersion: 1;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus =
  | 'draft'
  | 'issued'
  | 'partially_paid'
  | 'settled'
  | 'cancelled';

export interface ServiceInvoice {
  id: string;
  userId: string;
  projectId: string;
  contractId?: string;
  documentNumber?: string; // e.g. IN-1405-0001 (assigned only upon issue)
  projectTitle: string;
  partySnapshot: DocumentPartySnapshot;
  serviceDescription: string;
  totalAmount: number; // in TOMAN
  paidAmount: number; // in TOMAN
  remainingBalance: number; // in TOMAN
  issueDateJalali: string;
  dueDateJalali: string;
  notes?: string;
  status: InvoiceStatus;
  cancellationReason?: string;
  cancellationDateJalali?: string;
  version: number;
  revisions?: DocumentRevision<ServiceInvoice>[];
  currency: 'TOMAN';
  schemaVersion: 1;
  createdAt: string;
  updatedAt: string;
}

/* =========================================================================
   5. Inactive Future Extension Points (توسعه آینده - غیرفعال)
   ========================================================================= */

export interface DigitalSignatureProvider {
  readonly isEnabled: false;
  readonly futureFeatureNote: 'امضای دیجیتال در نسخه آینده پس از اخذ تاییدیه‌های لازم فعال خواهد شد.';
  signDocument?(documentId: string): Promise<never>;
  verifySignature?(documentId: string): Promise<never>;
}

export interface PaymentGatewayProvider {
  readonly isEnabled: false;
  readonly futureFeatureNote: 'درگاه پرداخت آنلاین در نسخه آینده اضافه خواهد شد.';
  createPaymentUrl?(amount: number, trackingCode: string): Promise<never>;
  verifyPayment?(token: string): Promise<never>;
}
