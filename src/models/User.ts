export type UserRole = 'surveyor' | 'client' | 'admin';
export type EntityType = 'individual' | 'legal';

export interface User {
  id: string;
  profileId?: string;
  phone: string;
  role: UserRole;
  entityType: EntityType;
  fullName: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  representativeName?: string;
  avatarUrl?: string;
  createdAt: string;
  environment: 'demo';
}

export interface RegisterDTO {
  entityType: EntityType;
  phone: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  representativeName?: string;
}
