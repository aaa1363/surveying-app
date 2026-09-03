export interface SubServiceItem {
  id: string;
  title: string;
  description?: string;
}

export interface ServiceCategory {
  id: string;
  number: number;
  title: string;
  description: string;
  iconName: string;
  subServices: SubServiceItem[];
}

export const SERVICES_CATALOG_VERSION = 2;

export const SERVICES_CATALOG: ServiceCategory[] = [
  {
    id: 'cadastral_registration',
    number: 1,
    title: 'نقشه‌برداری ملکی و ثبتی',
    description: 'تفکیک، افراز، تهیه نقشه شمیم، جانمایی پلاک و پرونده‌های ثبتی',
    iconName: 'Building2',
    subServices: [
      { id: 'cad_1', title: 'تفکیک و افراز اراضی و املاک مسکونی و تجاری' },
      { id: 'cad_2', title: 'تعیین عرصه و اعیان و جانمایی سند مالکیت' },
      { id: 'cad_3', title: 'نقشه‌برداری پرونده‌های ماده ۱۴۷ و ۱۴۸ اصلاحی قانون ثبت' },
      { id: 'cad_4', title: 'تهیه نقشه و فایل شمیم (SSBR) و اتصال به سامانه ثبت' },
      { id: 'cad_5', title: 'تحدید حدود، تجمیع و اصلاح اسناد ملکی' },
    ],
  },
  {
    id: 'surveying_mapping',
    number: 2,
    title: 'برداشت و تهیه نقشه',
    description: 'برداشت‌های مسطحاتی شهری، معابر، نما و عوارض شهری',
    iconName: 'Map',
    subServices: [
      { id: 'sur_1', title: 'برداشت مسطحاتی بلوک شهری تا عمق یک پلاک' },
      { id: 'sur_2', title: 'برداشت عوارض ترافیکی' },
      { id: 'sur_3', title: 'برداشت نما' },
      { id: 'sur_4', title: 'برداشت عوارض تأسیسات و تجهیزات شهری' },
      { id: 'sur_5', title: 'برداشت فضای سبز' },
      { id: 'sur_property_stakeout_v1', title: 'پیاده‌سازی پلاک طبق سند' },
      { id: 'sur_deed_existing_compare_v1', title: 'برداشت جهت تطبیق ابعاد سند با وضع موجود' },
    ],
  },
  {
    id: 'construction_surveying',
    number: 3,
    title: 'نقشه‌برداری ساختمانی',
    description: 'پیاده‌سازی آکس ستون، کنترل شاقولی، پایش گودبرداری و ازبیلت',
    iconName: 'HardHat',
    subServices: [
      { id: 'con_1', title: 'پیاده‌سازی فونداسیون، آکس ستون‌ها و بیس‌پلیت' },
      { id: 'con_2', title: 'کنترل شاقولی ستون‌ها، دیوارهای برشی و حائل' },
      { id: 'con_3', title: 'کنترل و پایش گودبرداری، نیلینگ و سازه نگهبان' },
      { id: 'con_4', title: 'تهیه نقشه‌های چون ساخت (ازبیلت) معماری و سازه' },
      { id: 'con_5', title: 'کنترل شیب‌بندی، کف‌سازی و ترازهای ارتفاعی' },
    ],
  },
  {
    id: 'route_linear',
    number: 4,
    title: 'راه و پروژه‌های خطی',
    description: 'برداشت مسیر، پروفیل طولی و عرضی، خطوط لوله و انتقال نیرو',
    iconName: 'Milestone',
    subServices: [
      { id: 'rou_1', title: 'برداشت مسیر، تهیه پروفیل طولی و مقاطع عرضی راه' },
      { id: 'rou_2', title: 'پیاده‌سازی و کنترل خطوط لوله گاز، آب و فاضلاب' },
      { id: 'rou_3', title: 'پیاده‌سازی خطوط انتقال نیرو و فیبر نوری' },
      { id: 'rou_4', title: 'پیاده‌سازی قوس‌های افقی و قائم و شیب‌بندی مسیر' },
      { id: 'rou_street_project_line_v1', title: 'پیاده‌سازی خط پروژه معابر اصلی و فرعی' },
    ],
  },
  {
    id: 'earthwork_volumes',
    number: 5,
    title: 'عملیات خاکی و حجمی',
    description: 'توپوگرافی، محاسبه احجام خاکبرداری و خاکریزی و باطله‌برداری',
    iconName: 'Layers',
    subServices: [
      { id: 'ear_1', title: 'برداشت اولیه و ثانویه توپوگرافی و تولید سطوح TIN' },
      { id: 'ear_2', title: 'محاسبه حجم عملیات خاکبرداری و خاکریزی' },
      { id: 'ear_3', title: 'برآورد دپوی مصالح، استخراج معادن و باطله‌برداری' },
      { id: 'ear_4', title: 'تهیه نقشه‌های منحنی میزان و خطوط تراز' },
    ],
  },
  {
    id: 'geodesy_control',
    number: 6,
    title: 'ژئودزی و کنترل',
    description: 'شبکه نقاط ماندگار، بنچ‌مارک، پایش نشست و میکروژئودزی',
    iconName: 'Compass',
    subServices: [
      { id: 'geo_1', title: 'طراحی، کاشت و قرائت شبکه ژئودتیک و بنچ‌مارک‌ها' },
      { id: 'geo_2', title: 'پایش نشست سازه، سدها و پل‌ها (تغییرشکل)' },
      { id: 'geo_3', title: 'اندازه‌گیری‌های دقیق میکروژئودزی صنعتی و تجهیزات' },
      { id: 'geo_4', title: 'تعیین موقعیت دقیق ماهواره‌ای GNSS چندفرکانسه' },
    ],
  },
  {
    id: 'photogrammetry_drone',
    number: 7,
    title: 'فتوگرامتری و پهپاد',
    description: 'تصویربرداری هوایی پهپادی، ارتوفتو، DEM/DSM و مدل ۳ بعدی',
    iconName: 'Camera',
    subServices: [
      { id: 'pho_1', title: 'پرواز پهپاد نقشه‌برداری و تولید ارتوفتوموزاییک با رزولوشن بالا' },
      { id: 'pho_2', title: 'تولید مدل رقومی ارتفاعی زمین (DEM / DSM / DTM)' },
      { id: 'pho_3', title: 'مدل‌سازی سه‌بعدی مشبک عوارض، سایت‌ها و معادن' },
      { id: 'pho_4', title: 'تولید ابر نقاط متراکم فتوگرامتری هوایی' },
    ],
  },
  {
    id: 'gis_spatial',
    number: 8,
    title: 'GIS و پردازش اطلاعات',
    description: 'سامانه اطلاعات مکانی، ژئودیتابیس، رقومی‌سازی و تحلیل فضایی',
    iconName: 'Globe',
    subServices: [
      { id: 'gis_1', title: 'طراحی و استقرار ژئودیتابیس و لایه‌بندی اطلاعات مکانی' },
      { id: 'gis_2', title: 'رقومی‌سازی و ژئورفرنس نقشه‌های کاغذی و تصاویر ماهواره‌ای' },
      { id: 'gis_3', title: 'تحلیل‌های فضایی، مکان‌یابی بهینه و پهنه‌بندی کاربری اراضی' },
      { id: 'gis_4', title: 'تولید نقشه‌های اطلس موضوعی و کاداستر شهری' },
    ],
  },
  {
    id: 'other_services',
    number: 9,
    title: 'سایر خدمات',
    description: 'کارشناسی رسمی، مشاوره فنی، استقرار اکیپ مقیم و خدمات سفارشی',
    iconName: 'MoreHorizontal',
    subServices: [
      { id: 'oth_1', title: 'خدمات کارشناسی و مشاوره فنی مهندسی نقشه‌برداری' },
      { id: 'oth_2', title: 'استقرار اکیپ مقیم نقشه‌برداری در کارگاه‌های عمرانی' },
      { id: 'oth_3', title: 'پیاده‌سازی نقاط مرجع و کنترل کیفی نقشه‌های تهیه‌شده' },
      { id: 'oth_custom', title: 'سایر خدمات سفارشی (تعریف شده توسط کاربر)' },
    ],
  },
];

export function getCategoryById(categoryId: string): ServiceCategory | undefined {
  return SERVICES_CATALOG.find((cat) => cat.id === categoryId);
}

export function getSubServiceLabel(categoryId: string, subServiceId: string): string {
  const cat = getCategoryById(categoryId);
  if (!cat) return subServiceId;
  const item = cat.subServices.find((s) => s.id === subServiceId);
  return item ? item.title : subServiceId;
}
