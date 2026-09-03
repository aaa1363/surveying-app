import { IPersonalRatesRepository } from '../interfaces/IPersonalRatesRepository';
import {
  PersonalRatesProfile,
  DEFAULT_LABOR_RATES,
  DEFAULT_EQUIPMENT_RATES,
  DEFAULT_MATERIAL_RATES,
} from '../../models/PersonalRates';
import { storage } from '../../utils/storage';

export class DemoPersonalRatesRepository implements IPersonalRatesRepository {
  private readonly STORAGE_KEY = 'surveying.personalRates.v1';

  private getAllRates(): Record<string, PersonalRatesProfile> {
    return storage.get<Record<string, PersonalRatesProfile>>(this.STORAGE_KEY, {});
  }

  private saveAllRates(all: Record<string, PersonalRatesProfile>): void {
    storage.set(this.STORAGE_KEY, all);
  }

  public async getPersonalRates(userId: string): Promise<PersonalRatesProfile> {
    const all = this.getAllRates();
    if (all[userId]) {
      const stored = all[userId];
      if (stored.schemaVersion === 1) {
        const migrated: PersonalRatesProfile = { ...stored, schemaVersion: 2, laborRates: stored.laborRates.map(item => ({ ...item, enabled: item.fullDayRate !== undefined || item.halfDayRate !== undefined, personCount: 1, calculationMethod: item.fullDayRate !== undefined ? 'full_day' : 'half_day' })) };
        all[userId] = migrated;
        this.saveAllRates(all);
        return migrated;
      }
      return stored;
    }

    // Initialize with standard defaults
    const initialProfile: PersonalRatesProfile = {
      userId,
      laborRates: JSON.parse(JSON.stringify(DEFAULT_LABOR_RATES)),
      equipmentRates: JSON.parse(JSON.stringify(DEFAULT_EQUIPMENT_RATES)),
      materialRates: JSON.parse(JSON.stringify(DEFAULT_MATERIAL_RATES)),
      updatedAt: new Date().toISOString(),
      schemaVersion: 2,
    };

    all[userId] = initialProfile;
    this.saveAllRates(all);
    return initialProfile;
  }

  public async savePersonalRates(rates: PersonalRatesProfile): Promise<PersonalRatesProfile> {
    const values = [
      ...rates.laborRates.flatMap(item => [item.fullDayRate, item.halfDayRate, item.hourlyRate, item.fixedRate]),
      ...rates.equipmentRates.flatMap(item => [item.dailyRate, item.depreciationDailyRate]),
      ...rates.materialRates.map(item => item.unitRate),
    ].filter((value): value is number => value !== undefined);
    if (values.some(value => !Number.isFinite(value) || value <= 0)) throw new Error('نرخ واردشده باید عددی مثبت و معتبر باشد.');
    if (rates.equipmentRates.some(item => item.ownershipType === 'rented' && item.depreciationDailyRate !== undefined)) throw new Error('تجهیز اجاره‌ای استهلاک جداگانه ندارد.');
    const all = this.getAllRates();
    const updated: PersonalRatesProfile = {
      ...rates,
      updatedAt: new Date().toISOString(),
      schemaVersion: 2,
    };
    all[rates.userId] = updated;
    this.saveAllRates(all);
    return updated;
  }

  public async resetToDefaults(userId: string): Promise<PersonalRatesProfile> {
    const initialProfile: PersonalRatesProfile = {
      userId,
      laborRates: JSON.parse(JSON.stringify(DEFAULT_LABOR_RATES)),
      equipmentRates: JSON.parse(JSON.stringify(DEFAULT_EQUIPMENT_RATES)),
      materialRates: JSON.parse(JSON.stringify(DEFAULT_MATERIAL_RATES)),
      updatedAt: new Date().toISOString(),
      schemaVersion: 2,
    };

    const all = this.getAllRates();
    all[userId] = initialProfile;
    this.saveAllRates(all);
    return initialProfile;
  }
}
