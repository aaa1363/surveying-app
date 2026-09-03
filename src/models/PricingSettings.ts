/**
 * Pricing Settings, Coefficients & Audit Log Model
 * Stage 4 - Pricing Engine
 */

export type PriceLevel = 'economic' | 'standard' | 'specialized' | 'custom';

export type PriceComparisonLabel =
  | 'lower_than_market'
  | 'within_market'
  | 'higher_than_market'
  | 'insufficient_data';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface PricingCoefficientConfig {
  key: string;
  label: string;
  defaultValue: number;
  minValue: number;
  maxValue: number;
  step: number;
  description: string;
}

export const DEFAULT_COEFFICIENTS_CONFIG: PricingCoefficientConfig[] = [
  {
    key: 'locationCoefficient',
    label: 'ضریب موقعیت جغرافیایی و دسترسی',
    defaultValue: 1.0,
    minValue: 0.5,
    maxValue: 3.0,
    step: 0.05,
    description: 'فاصله تا مرکز شهر، وضعیت راه‌های دسترسی، مناطق کوهستانی یا کویری',
  },
  {
    key: 'difficultyCoefficient',
    label: 'ضریب سختی کار و شرایط محیطی',
    defaultValue: 1.0,
    minValue: 0.5,
    maxValue: 3.0,
    step: 0.05,
    description: 'دید نامناسب، تراکم عوارض، شیب تند، ترافیک بالا یا کار در شب',
  },
  {
    key: 'riskCoefficient',
    label: 'ضریب ریسک و مسئولیت حقوقی',
    defaultValue: 1.0,
    minValue: 0.5,
    maxValue: 3.0,
    step: 0.05,
    description: 'حساسیت املاک مجاور، اختلافات ثبتی، کار در اتوبان و سازه‌های خطرآفرین',
  },
  {
    key: 'qualityCoefficient',
    label: 'ضریب کیفیت و سطح تحویل داده',
    defaultValue: 1.0,
    minValue: 0.5,
    maxValue: 3.0,
    step: 0.05,
    description: 'دقت در حد میلی‌متر، فرمت‌های تخصصی GIS، خروجی ۳ بعدی و گزارش تفصیلی',
  },
];

export interface PricingSettings {
  id: string;
  tariffWeight: number; // e.g. 0.60 (60%)
  marketWeight: number; // e.g. 0.40 (40%) - tariffWeight + marketWeight = 1.0
  economicFactor: number; // e.g. 0.90 (90%)
  specializedFactor: number; // e.g. 1.15 (115%)
  confidenceThresholdLow: number; // e.g. 5 samples (< 5 is 'low')
  confidenceThresholdMedium: number; // e.g. 20 samples (5 to 19 is 'medium', >= 20 is 'high')
  outlierIqrMultiplier: number; // e.g. 1.5 for standard IQR boxplot boundaries
  adminDisclaimer: string;
  schemaVersion: 1;
  updatedAt: string;
  updatedBy?: string;
}

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  id: 'global_pricing_settings',
  tariffWeight: 0.6,
  marketWeight: 0.4,
  economicFactor: 0.9,
  specializedFactor: 1.15,
  confidenceThresholdLow: 5,
  confidenceThresholdMedium: 20,
  outlierIqrMultiplier: 1.5,
  adminDisclaimer: 'برآورد پیشنهادی براساس تنظیمات و داده‌های موجود است و الزام قانونی ایجاد نمی‌کند.',
  schemaVersion: 1,
  updatedAt: '2026-01-01T00:00:00.000Z',
  updatedBy: 'system_admin',
};

export interface TariffAuditLog {
  id: string;
  serviceId?: string;
  serviceTitle?: string;
  action: 'create' | 'update' | 'toggle_active' | 'update_settings';
  fieldChanged?: string;
  oldValue?: string | number | boolean;
  newValue?: string | number | boolean;
  performedBy: string;
  performedAtJalali: string;
  timestamp: string;
  note?: string;
}

