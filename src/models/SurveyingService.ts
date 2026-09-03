/** Stage 4 service catalogue and versioned tariffs. */
export type SurveyingUnit = 'مترمربع' | 'هکتار' | 'کیلومتر' | 'نقطه' | 'پلاک' | 'بلوک' | 'مورد';

export const SURVEYING_UNITS: { value: SurveyingUnit; label: string; description: string }[] = [
  { value: 'مترمربع', label: 'مترمربع (m²)', description: 'برداشت‌های سطحی، نما و پلان' },
  { value: 'هکتار', label: 'هکتار (ha)', description: 'اراضی بزرگ و فضای سبز' },
  { value: 'کیلومتر', label: 'کیلومتر (km)', description: 'پروژه‌های خطی و مسیر' },
  { value: 'نقطه', label: 'نقطه', description: 'نقاط کنترلی و تأسیسات' },
  { value: 'پلاک', label: 'پلاک', description: 'املاک ثبتی' },
  { value: 'بلوک', label: 'بلوک', description: 'بلوک شهری' },
  { value: 'مورد', label: 'مورد / مقطوع', description: 'خدمات موردی' },
];

export interface ServiceCategory { id: string; title: string; description?: string; isActive: boolean; sortOrder: number; schemaVersion: 1; }
export interface SurveyingService { id: string; categoryId: string; title: string; unit: SurveyingUnit; description?: string; isActive: boolean; isDemo: boolean; createdAt: string; updatedAt: string; schemaVersion: 1; }
export interface ServiceTariff { id: string; serviceId: string; version: string; baseRate: number; minAmount: number; validFrom: string; sourceTitle: string; sourceUrl?: string; notes?: string; isActive: boolean; isDemo: boolean; currency: 'TOMAN'; createdAt: string; createdBy: string; parentVersionId?: string; updatedAt: string; schemaVersion: 1; }
export interface PricedSurveyingService extends SurveyingService { tariff: ServiceTariff; }

export const DEFAULT_SERVICE_CATEGORIES: ServiceCategory[] = [{ id: 'cat_mapping', title: 'برداشت و تهیه نقشه', description: 'خدمات برداشت میدانی و تهیه نقشه‌های پایه', isActive: true, sortOrder: 1, schemaVersion: 1 }];
const createdAt = '2025-03-21T00:00:00.000Z';
const service = (id: string, title: string, unit: SurveyingUnit, description: string): SurveyingService => ({ id, categoryId: 'cat_mapping', title, unit, description, isActive: true, isDemo: true, createdAt, updatedAt: createdAt, schemaVersion: 1 });
const coreService = (id: string, title: string, unit: SurveyingUnit, description: string, categoryId: string): SurveyingService => ({ ...service(id,title,unit,description), categoryId, isDemo: false });
export const DEFAULT_SURVEYING_SERVICES: SurveyingService[] = [
  service('sur_1', 'برداشت مسطحاتی بلوک شهری تا عمق یک پلاک', 'بلوک', 'برداشت عوارض کالبدی و معابر پیرامونی تا عمق پلاک اول'),
  service('sur_2', 'برداشت عوارض ترافیکی', 'مورد', 'برداشت تابلوها، علائم، خط‌کشی و هندسه تقاطع‌ها'),
  service('sur_3', 'برداشت نما', 'مترمربع', 'برداشت جزئیات نما و تهیه فایل‌های دو و سه‌بعدی'),
  service('sur_4', 'برداشت عوارض تأسیسات و تجهیزات شهری', 'نقطه', 'برداشت تجهیزات و تأسیسات شهری'),
  service('sur_5', 'برداشت فضای سبز', 'هکتار', 'برداشت فضای سبز، درختان و شبکه آبرسانی'),
  coreService('sur_property_stakeout_v1', 'پیاده‌سازی پلاک طبق سند', 'پلاک', 'خدمت کاتالوگی بدون تعرفه پیش‌فرض', 'surveying_mapping'),
  coreService('sur_deed_existing_compare_v1', 'برداشت جهت تطبیق ابعاد سند با وضع موجود', 'پلاک', 'خدمت کاتالوگی بدون تعرفه پیش‌فرض', 'surveying_mapping'),
  coreService('rou_street_project_line_v1', 'پیاده‌سازی خط پروژه معابر اصلی و فرعی', 'کیلومتر', 'خدمت کاتالوگی بدون تعرفه پیش‌فرض', 'route_linear'),
];
const tariff = (serviceId: string, baseRate: number, minAmount: number): ServiceTariff => ({ id: `tariff_${serviceId}_1403_1`, serviceId, version: '1403.1', baseRate, minAmount, validFrom: '1403/01/01', sourceTitle: 'برآورد پیشنهادی براساس تنظیمات و داده‌های موجود', isActive: true, isDemo: true, currency: 'TOMAN', createdAt, createdBy: 'system_admin', updatedAt: createdAt, schemaVersion: 1 });
export const DEFAULT_SERVICE_TARIFFS: ServiceTariff[] = [tariff('sur_1', 4_500_000, 3_000_000), tariff('sur_2', 3_200_000, 2_500_000), tariff('sur_3', 38_000, 2_000_000), tariff('sur_4', 180_000, 1_500_000), tariff('sur_5', 6_800_000, 3_500_000)];
