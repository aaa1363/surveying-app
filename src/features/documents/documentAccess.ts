import { UserRole } from '../../models';

export function canManageProjectDocuments(role: UserRole, currentUserId: string, ownerUserId: string): boolean {
  return role === 'surveyor' && Boolean(currentUserId) && currentUserId === ownerUserId;
}
