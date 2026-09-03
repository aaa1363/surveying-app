/**
 * Demo Pricing Settings Repository
 * Storage Key: surveying.pricingSettings.v1
 */

import { PricingSettings, DEFAULT_PRICING_SETTINGS } from '../../models';
import { IPricingSettingsRepository } from '../interfaces/IPricingSettingsRepository';
import { storage } from '../../utils/storage';
import { getCurrentJalaliDate } from '../../utils/jalaliDate';
import { DemoTariffAuditRepository } from './DemoTariffAuditRepository';
import { UserRole } from '../../models';
import { validatePricingSettings } from '../../utils/pricingValidation';

const STORAGE_KEY = 'surveying.pricingSettings.v1';
const auditRepo = new DemoTariffAuditRepository();

export class DemoPricingSettingsRepository implements IPricingSettingsRepository {
  async getSettings(): Promise<PricingSettings> {
    return storage.get<PricingSettings>(STORAGE_KEY, DEFAULT_PRICING_SETTINGS);
  }

  async updateSettings(
    newSettings: Partial<PricingSettings>,
    actor: { id: string; name: string; role: UserRole }
  ): Promise<PricingSettings> {
    if (actor.role !== 'admin') throw new Error('دسترسی غیرمجاز: فقط مدیر می‌تواند تنظیمات قیمت‌گذاری را تغییر دهد.');
    const current = await this.getSettings();
    const updated = validatePricingSettings({
      ...current,
      ...newSettings,
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.name,
    });

    storage.set(STORAGE_KEY, updated);

    // Audit log
    await auditRepo.logChange({
      action: 'update_settings',
      fieldChanged: 'تنظیمات عمومی موتور قیمت‌گذاری',
      performedBy: actor.name,
      performedAtJalali: getCurrentJalaliDate(),
      note: 'بروزرسانی ضرایب، وزن‌های تعرفه و حدود اطمینان بازار',
    });

    return updated;
  }

  async resetToDefault(actor: { id: string; name: string; role: UserRole }): Promise<PricingSettings> {
    if (actor.role !== 'admin') throw new Error('دسترسی غیرمجاز: فقط مدیر می‌تواند تنظیمات قیمت‌گذاری را تغییر دهد.');
    storage.set(STORAGE_KEY, DEFAULT_PRICING_SETTINGS);
    return DEFAULT_PRICING_SETTINGS;
  }
}
