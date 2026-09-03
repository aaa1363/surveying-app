import { ProjectClient } from './Client';

export type ProjectStatus =
  | 'draft'
  | 'planned'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived';

export interface ProjectLocation {
  province: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ProjectAttachment {
  id: string;
  name: string;
  title?: string;
  description?: string;
  mimeType: string;
  size: number;
  extension: string;
  environment: 'demo';
}

export interface ProjectServiceSelection {
  mainCategoryId: string;
  selectedSubServiceIds: string[];
  primarySubServiceId: string;
  customServiceTitle?: string;
}

export interface SurveyProject {
  id: string;
  projectCode: string;
  internalCode?: string;
  title: string;
  description?: string;
  clientId: string;
  clientSnapshot: ProjectClient;
  services: ProjectServiceSelection;
  location: ProjectLocation;
  registrationDateJalali: string;
  startDateJalali: string;
  agreedDeliveryDateJalali?: string;
  actualEndDateJalali?: string;
  status: ProjectStatus;
  attachments: ProjectAttachment[];
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
  environment: 'demo';
}
