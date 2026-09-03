import { IProfileRepository } from '../interfaces/IProfileRepository';
import { Profile } from '../../models/Profile';
import { storage } from '../../utils/storage';

const STORAGE_KEY_PROFILE_PREFIX = 'geo_demo_profile_';

export class DemoProfileRepository implements IProfileRepository {
  async getProfile(userId: string): Promise<Profile> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const key = `${STORAGE_KEY_PROFILE_PREFIX}${userId}`;
    const existing = storage.get<Profile | null>(key, null);

    if (existing) {
      const sanitized = { ...existing } as Profile & Record<string, unknown>;
      delete sanitized.address;
      delete sanitized.nationalId;
      delete sanitized.bankIban;
      storage.set(key, sanitized);
      return sanitized;
    }

    // Stage 6 intentionally does not collect or persist national ID, exact address or IBAN.
    const initialProfile: Profile = {
      id: `prof_${userId}`,
      userId: userId,
      completionPercentage: 35,
      isComplete: false,
      province: 'یزد',
      city: 'یزد',
      engineerLicenseNumber: '',
      judicialExpertNumber: '',
      updatedAt: new Date().toISOString(),
      environment: 'demo'
    };

    storage.set(key, initialProfile);
    return initialProfile;
  }

  async updateProfile(userId: string, data: Partial<Profile>): Promise<Profile> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const current = await this.getProfile(userId);

    const { address: _address, nationalId: _nationalId, bankIban: _bankIban, ...safeData } = data as Partial<Profile> & Record<string, unknown>;
    void _address; void _nationalId; void _bankIban;
    const merged: Profile = {
      ...current,
      ...safeData,
      updatedAt: new Date().toISOString(),
      environment: 'demo'
    };

    // Calculate completion based on required fields
    const hasLocation = Boolean(merged.province?.trim() && merged.city?.trim());
    const isComplete = hasLocation;
    const score = hasLocation ? 100 : 0;

    merged.completionPercentage = score;
    merged.isComplete = isComplete;

    const key = `${STORAGE_KEY_PROFILE_PREFIX}${userId}`;
    storage.set(key, merged);
    return merged;
  }

  async toggleCompletionForTesting(userId: string): Promise<Profile> {
    const current = await this.getProfile(userId);
    const willBeComplete = !current.isComplete;

    const updated: Profile = {
      ...current,
      isComplete: willBeComplete,
      completionPercentage: willBeComplete ? 100 : 35,
      province: 'یزد',
      city: 'یزد',
      engineerLicenseNumber: willBeComplete ? 'ن-۲۴۸۸۹-یزد' : '',
      updatedAt: new Date().toISOString(),
      environment: 'demo'
    };

    const key = `${STORAGE_KEY_PROFILE_PREFIX}${userId}`;
    storage.set(key, updated);
    return updated;
  }
}
