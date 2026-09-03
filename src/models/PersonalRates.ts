export type LaborRoleId = 'crew_leader' | 'survey_expert' | 'assistant';

export interface LaborRateItem {
  roleId: LaborRoleId;
  title: string;
  enabled?: boolean;
  personCount?: number;
  calculationMethod?: 'full_day' | 'half_day' | 'hourly' | 'fixed';
  fullDayRate?: number; // Toman
  halfDayRate?: number; // Toman
  hourlyRate?: number; // Toman
  fixedRate?: number; // Toman
  notes?: string;
}

export type EquipmentOwnership = 'owned' | 'rented';

export interface EquipmentRateItem {
  id: string;
  name: string;
  ownershipType: EquipmentOwnership;
  dailyRate?: number; // Toman (Usage rate for owned, rental rate for rented)
  depreciationDailyRate?: number; // Toman (Only if owned)
  notes?: string;
  isCustom?: boolean;
}

export interface MaterialRateItem {
  id: string;
  name: string;
  unit: string;
  unitRate?: number; // Toman
  notes?: string;
  isCustom?: boolean;
}

export interface PersonalRatesProfile {
  userId: string;
  laborRates: LaborRateItem[];
  equipmentRates: EquipmentRateItem[];
  materialRates: MaterialRateItem[];
  updatedAt: string;
  schemaVersion: 1 | 2;
}

export const DEFAULT_LABOR_RATES: LaborRateItem[] = [
  {
    roleId: 'crew_leader',
    title: 'سرپرست اکیپ',
    notes: 'مدیریت هماهنگی میدان، کنترل کیفیت داده‌ها و بنچ‌مارک‌ها',
  },
  {
    roleId: 'survey_expert',
    title: 'کارشناس نقشه‌برداری',
    notes: 'اپراتور ارشد توتال استیشن، GPS و برداشت نقاط کنترل',
  },
  {
    roleId: 'assistant',
    title: 'کمک‌نقشه‌بردار',
    notes: 'میردار، استقرار ژالون، نشانه‌گذاری و استقرار تجهیزات',
  },
];

export const DEFAULT_EQUIPMENT_RATES: EquipmentRateItem[] = [
  {
    id: 'eq_total_station',
    name: 'توتال استیشن',
    ownershipType: 'owned',
    notes: 'توتال استیشن دقیق زاویه‌ای ۱ تا ۲ ثانیه به همراه سه‌پایه و منشور',
  },
  {
    id: 'eq_gps_gnss',
    name: 'گیرنده GNSS/GPS چندفرکانسه',
    ownershipType: 'owned',
    notes: 'مولتی‌فرکانس ایستگاهی و روور با اتصال به سامانه‌های شمیم و هدی',
  },
  {
    id: 'eq_level',
    name: 'ترازیاب',
    ownershipType: 'owned',
    notes: 'ترازیاب اپتیکی یا دیجیتال به همراه میر استاندارد',
  },
  {
    id: 'eq_scanner',
    name: 'اسکنر',
    ownershipType: 'rented',
    notes: 'اسکنر لیزری زمینی ۳D با اهداف و تارگت‌های کالیبره',
  },
  {
    id: 'eq_drone',
    name: 'پهپاد',
    ownershipType: 'owned',
    notes: 'پهپاد فتوگرامتری با سنسور دوربین متریک و باتری‌های یدک',
  },
  {
    id: 'eq_laptop',
    name: 'لپ‌تاپ',
    ownershipType: 'owned',
    notes: 'لپ‌تاپ صحرایی جهت تخلیه داده، کنترل و پیش‌پردازش سریع',
  },
  {
    id: 'eq_car',
    name: 'خودرو',
    ownershipType: 'owned',
    notes: 'خودرو صحرایی اکیپ جهت حمل و تردد در سایت پروژه',
  },
];

export const DEFAULT_MATERIAL_RATES: MaterialRateItem[] = [
  {
    id: 'mat_wooden_peg',
    name: 'میخ چوبی',
    unit: 'عدد',
    notes: 'میخ چوبی تراش‌خورده نشانه‌گذاری مرزها و نقاط پیمایش',
  },
  {
    id: 'mat_spray_paint',
    name: 'رنگ اسپری',
    unit: 'قوطی',
    notes: 'اسپری رنگ شب‌نما جهت نشانه‌گذاری نقاط زمینی و ایستگاه‌ها',
  },
  {
    id: 'mat_metal_nail',
    name: 'میخ فلزی',
    unit: 'عدد',
    notes: 'میخ فولادی بتنی به همراه واشر جهت میخ‌کوبی در آسفالت و سازه‌ها',
  },
  {
    id: 'mat_survey_string',
    name: 'نخ',
    unit: 'قرقره',
    notes: 'نخ ریسمان‌کار ابریشمی جهت امتدادها و تراز خطوط',
  },
  {
    id: 'mat_marker_plate',
    name: 'پلاک',
    unit: 'عدد',
    notes: 'پلاک آلومینیومی شناسنامه بنچ‌مارک و ایستگاه ماندگار',
  },
];
