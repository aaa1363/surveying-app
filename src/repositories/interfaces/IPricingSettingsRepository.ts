import { PricingSettings, UserRole } from '../../models';

export interface IPricingSettingsRepository {
  getSettings(): Promise<PricingSettings>;
  updateSettings(settings: Partial<PricingSettings>, actor: { id: string; name: string; role: UserRole }): Promise<PricingSettings>;
  resetToDefault(actor: { id: string; name: string; role: UserRole }): Promise<PricingSettings>;
}
