import { SurveyProject } from '../../models/Project';
import { DashboardStats } from '../../models/DashboardStats';
import { RecentProject } from '../../models/RecentProject';
import { Notification } from '../../models/Notification';
import { UserRole } from '../../models/User';

export interface IProjectRepository {
  createDraft(userId: string): Promise<SurveyProject>;
  saveDraft(project: SurveyProject): Promise<SurveyProject>;
  finalizeProject(project: SurveyProject): Promise<SurveyProject>;
  getProjects(userId: string): Promise<SurveyProject[]>;
  getDeletedProjects(userId: string): Promise<SurveyProject[]>;
  getProjectById(userId: string, projectId: string): Promise<SurveyProject | null>;
  archiveProject(userId: string, projectId: string): Promise<void>;
  softDeleteProject(userId: string, projectId: string, role: UserRole): Promise<void>;
  restoreProject(userId: string, projectId: string, role: UserRole): Promise<void>;
  getDashboardStats(userId: string): Promise<DashboardStats>;
  getRecentProjects(userId: string): Promise<RecentProject[]>;
  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;
}
