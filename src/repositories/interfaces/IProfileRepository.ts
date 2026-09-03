import { Profile } from '../../models/Profile';

export interface IProfileRepository {
  getProfile(userId: string): Promise<Profile>;
  updateProfile(userId: string, data: Partial<Profile>): Promise<Profile>;
  toggleCompletionForTesting(userId: string): Promise<Profile>;
}
