import {
  SurveyorPublicProfile,
  SurveyorResumeItem,
  SurveyorCredential,
  PortfolioItem,
  PublishedPriceCard,
  SurveyorSelection,
  SurveyorReview,
  ReviewAggregate,
  ModerationReport,
  ModerationAuditLog,
  DelegatedAdminPermission,
  RepositoryActor,
} from '../../models/Stage6Models';

export interface ProfileFilterOptions {
  province?: string;
  city?: string;
  specialty?: string;
  searchQuery?: string;
  minRating?: number;
  onlyVerified?: boolean;
}

export interface ISurveyorProfilesRepository {
  getProfileByUserId(userId: string, viewer?: RepositoryActor): Promise<SurveyorPublicProfile | null>;
  getAllPublicProfiles(filters?: ProfileFilterOptions, viewer?: RepositoryActor): Promise<SurveyorPublicProfile[]>;
  saveProfile(profile: Partial<SurveyorPublicProfile> & { userId: string }): Promise<SurveyorPublicProfile>;
  updateRatingAggregate(userId: string, avgRating: number, count: number): Promise<void>;
  verifyProfile(actor: RepositoryActor, userId: string, isVerified: boolean): Promise<SurveyorPublicProfile>;
  hasValidInquiry(clientId: string, surveyorId: string): Promise<boolean>;
}

export interface ISurveyorResumeRepository {
  getItemsByUserId(userId: string): Promise<SurveyorResumeItem[]>;
  addItem(item: Omit<SurveyorResumeItem, 'id' | 'createdAt' | 'environment'>): Promise<SurveyorResumeItem>;
  updateItem(id: string, updates: Partial<SurveyorResumeItem>): Promise<SurveyorResumeItem>;
  deleteItem(id: string): Promise<boolean>;
}

export interface ICredentialsRepository {
  getCredentialsByUserId(userId: string, onlyPublic?: boolean): Promise<SurveyorCredential[]>;
  addCredential(cred: Omit<SurveyorCredential, 'id' | 'createdAt' | 'environment'>): Promise<SurveyorCredential>;
  updateCredential(id: string, updates: Partial<SurveyorCredential>): Promise<SurveyorCredential>;
  deleteCredential(id: string): Promise<boolean>;
  verifyCredential(actor: RepositoryActor, id: string, isVerified: boolean): Promise<SurveyorCredential>;
}

export interface IPortfolioRepository {
  getItemsByUserId(userId: string): Promise<PortfolioItem[]>;
  addItem(item: Omit<PortfolioItem, 'id' | 'createdAt' | 'environment'>): Promise<PortfolioItem>;
  updateItem(id: string, updates: Partial<PortfolioItem>): Promise<PortfolioItem>;
  deleteItem(id: string): Promise<boolean>;
}

export interface IPublishedPricesRepository {
  getPriceCardsByUserId(userId: string, onlyPublished?: boolean): Promise<PublishedPriceCard[]>;
  getAllPublishedPriceCards(category?: string): Promise<PublishedPriceCard[]>;
  addPriceCard(card: Omit<PublishedPriceCard, 'id' | 'createdAt' | 'updatedAt' | 'environment'>): Promise<PublishedPriceCard>;
  updatePriceCard(id: string, updates: Partial<PublishedPriceCard>): Promise<PublishedPriceCard>;
  deletePriceCard(id: string): Promise<boolean>;
}

export interface ISurveyorSelectionsRepository {
  getSelectionsForClient(actor: RepositoryActor): Promise<SurveyorSelection[]>;
  getSelectionsForSurveyor(actor: RepositoryActor): Promise<SurveyorSelection[]>;
  getSelectionById(id: string, actor: RepositoryActor): Promise<SurveyorSelection | null>;
  createSelection(actor: RepositoryActor, selection: Omit<SurveyorSelection, 'id' | 'createdAt' | 'environment' | 'status' | 'surveyorPhone'>): Promise<SurveyorSelection>;
  updateSelectionStatus(actor: RepositoryActor, id: string, status: SurveyorSelection['status']): Promise<SurveyorSelection>;
}

export interface ISurveyorReviewsRepository {
  getReviewsForSurveyor(surveyorId: string, actor?: RepositoryActor, includeUnapproved?: boolean): Promise<SurveyorReview[]>;
  getReviewsByClient(actor: RepositoryActor): Promise<SurveyorReview[]>;
  getReviewAggregate(surveyorId: string): Promise<ReviewAggregate>;
  submitReview(actor: RepositoryActor, review: Omit<SurveyorReview, 'id' | 'createdAt' | 'createdAtJalali' | 'environment' | 'isApproved' | 'isReported'>): Promise<SurveyorReview>;
  replyToReview(reviewId: string, replyText: string, replyDateJalali: string): Promise<SurveyorReview>;
  reportReview(reviewId: string, reason: string): Promise<SurveyorReview>;
  moderateReview(actor: RepositoryActor, reviewId: string, isApproved: boolean, moderationNote?: string): Promise<SurveyorReview>;
}

export interface IModerationRepository {
  getPendingReports(): Promise<ModerationReport[]>;
  getAllReports(): Promise<ModerationReport[]>;
  createReport(report: Omit<ModerationReport, 'id' | 'status' | 'createdAt' | 'environment'>): Promise<ModerationReport>;
  resolveReport(id: string, status: ModerationReport['status'], actionTaken?: ModerationReport['actionTaken'], adminNotes?: string): Promise<ModerationReport>;
  getAuditLogs(): Promise<ModerationAuditLog[]>;
  logAction(log: Omit<ModerationAuditLog, 'id' | 'timestamp' | 'environment'>): Promise<ModerationAuditLog>;
}

export interface IDelegatedPermissionsRepository {
  getPermissionsForUser(userId: string): Promise<DelegatedAdminPermission | null>;
  grantPermissions(userId: string, grantedByUserId: string, permissions: DelegatedAdminPermission['permissions']): Promise<DelegatedAdminPermission>;
  revokePermissions(userId: string): Promise<boolean>;
}
