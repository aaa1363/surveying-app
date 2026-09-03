import {
  SurveyorPublicProfile,
  SurveyorResumeItem,
  SurveyorCredential,
  PortfolioItem,
  PublishedPriceCard,
  SurveyorSelection,
  SurveyorReview,
  ReviewAggregate,
  ModerationReport,
  ModerationAuditLog,
  DelegatedAdminPermission,
  RepositoryActor,
  Stage6Environment,
} from '../../models/Stage6Models';
import {
  ISurveyorProfilesRepository,
  ISurveyorResumeRepository,
  ICredentialsRepository,
  IPortfolioRepository,
  IPublishedPricesRepository,
  ISurveyorSelectionsRepository,
  ISurveyorReviewsRepository,
  IModerationRepository,
  IDelegatedPermissionsRepository,
  ProfileFilterOptions,
} from '../interfaces/IStage6Repositories';
import { storage } from '../../utils/storage';
import { toJalaliDate } from '../../utils/jalaliDate';
import {isDemoBusinessSeedDisabled} from '../../utils/demoSeedPolicy';

const KEYS = {
  PROFILES: 'public_profiles',
  RESUMES: 'resumes',
  CREDENTIALS: 'credentials',
  PORTFOLIO: 'portfolio',
  PRICES: 'published_prices',
  SELECTIONS: 'selections',
  REVIEWS: 'reviews',
  MODERATION_REPORTS: 'moderation_reports',
  MODERATION_LOGS: 'moderation_logs',
  DELEGATED_PERMS: 'delegated_perms',
};

abstract class Stage6RepositoryBase {
  constructor(protected readonly environment: Stage6Environment = 'demo') {}
  protected key(name: string): string {
    return `surveying_${this.environment}_${name}_v1`;
  }
  protected seed<T>(demoSeed: T): T {
    return (this.environment === 'demo' && !isDemoBusinessSeedDisabled() ? demoSeed : []) as T;
  }
  protected assertEnvironment(actor: RepositoryActor): void {
    if (actor.environment !== this.environment) throw new Error('دسترسی بین محیط Demo و Real مجاز نیست.');
  }
  protected assertAdmin(actor: RepositoryActor): void {
    this.assertEnvironment(actor);
    if (actor.role !== 'admin') throw new Error('این عملیات فقط برای مدیر مجاز است.');
  }
}

// ---------------- Seed Data ----------------

const SEED_PROFILES: SurveyorPublicProfile[] = [
  {
    id: 'prof-demo-123',
    userId: 'demo-user-123',
    fullName: 'مهندس علیرضا رضایی',
    title: 'مهندس نقشه‌بردار ارشد و کارشناس نقشه‌برداری با مدرک ثبت‌شده',
    bio: 'با بیش از ۱۲ سال سابقه فعالیت تخصصی در حوزه‌های ژئودزی، فتوگرامتری پهپاد، امور ثبتی و ماده ۱۴۷ و پیاده‌سازی سازه‌های دقیق صنعتی و ساختمانی در استان‌های یزد، اصفهان و فارس. عضو سازمان نظام مهندسی ساختمان و مرجع درج‌شده توسط کاربر — بررسی نمایشی.',
    province: 'یزد',
    city: 'یزد',
    serviceAreas: ['یزد', 'میبد', 'اردکان', 'تفت', 'مهریز', 'اصفهان'],
    specialties: ['نقشه UTM سند', 'فتوگرامتری پهپاد', 'تفکیک اراضی', 'مانیتورینگ گود و دیواره', 'کارشناسی ثبتی', 'پیاده‌سازی سازه'],
    experienceYears: 12,
    isPublic: true,
    phone: '09131234567',
    email: 'rezaei.survey@demo.ir',
    website: 'www.rezaei-survey.ir',
    ratingAverage: 4.8,
    reviewCount: 5,
    isVerified: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    environment: 'demo',
    schemaVersion: 1,
  },
  {
    id: 'prof-2',
    userId: 'surveyor-2',
    fullName: 'مهندس مریم کاظمی',
    title: 'متخصص فتوگرامتری پهپاد، اسکن لیزری ۳ بعدی و مدلسازی BIM',
    bio: 'فارغ‌التحصیل کارشناسی ارشد فتوگرامتری دانشگاه صنعتی خواجه نصیر. مجری پروژه‌های اسکن لیزری بناهای تاریخی، تهیه ابر نقاط و نقشه‌های هوایی دقیق با پهپادهای RTK.',
    province: 'تهران',
    city: 'تهران',
    serviceAreas: ['تهران', 'کرج', 'پردیس', 'دماوند', 'قزوین'],
    specialties: ['فتوگرامتری پهپاد', 'اسکن لیزری ۳ بعدی', 'مدلسازی BIM', 'توپوگرافی اراضی'],
    experienceYears: 9,
    isPublic: true,
    phone: '09129876543',
    email: 'kazemi.geomatics@demo.ir',
    ratingAverage: 4.9,
    reviewCount: 8,
    isVerified: true,
    createdAt: '2023-03-15T00:00:00.000Z',
    updatedAt: '2026-02-20T00:00:00.000Z',
    environment: 'demo',
    schemaVersion: 1,
  },
  {
    id: 'prof-3',
    userId: 'surveyor-3',
    fullName: 'مهندس رضا مرادی',
    title: 'کارشناس نقشه‌برداری با مدرک ثبت‌شده و متخصص کاداستر و تفکیک اراضی',
    bio: 'بیش از ۱۵ سال سابقه در حوزه کاداستر شهری و روستایی، پیاده‌سازی نقشه‌های ثبتی ماده ۱۴۷ و ۱۴۸، تعیین حریم املاک و حل اختلافات ثبتی.',
    province: 'اصفهان',
    city: 'اصفهان',
    serviceAreas: ['اصفهان', 'نجف‌آباد', 'شاهین‌شهر', 'کاشان', 'شهرضا'],
    specialties: ['کارشناسی ثبتی', 'تفکیک اراضی', 'نقشه UTM سند', 'تعیین حریم'],
    experienceYears: 15,
    isPublic: true,
    phone: '09139871122',
    ratingAverage: 4.7,
    reviewCount: 6,
    isVerified: true,
    createdAt: '2023-04-10T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
    environment: 'demo',
    schemaVersion: 1,
  },
  {
    id: 'prof-4',
    userId: 'surveyor-4',
    fullName: 'مهندس سارا حسینی',
    title: 'مهندس ژئودزی و مانیتورینگ دقیق ژئوتکنیکی و سدها',
    bio: 'طراحی شبکه‌های ژئودتیک میکرو و پایش تغییرشکل سازه‌های حساس، تونل‌ها، پل‌ها و گودبرداری‌های عمیق شهری با تجهیزات فوق‌دقیق لایکا.',
    province: 'فارس',
    city: 'شیراز',
    serviceAreas: ['شیراز', 'مرودشت', 'کازرون', 'فسا', 'جهرم'],
    specialties: ['مانیتورینگ گود و دیواره', 'شبکه ژئودتیک', 'میکروژئودزی', 'پیاده‌سازی سازه'],
    experienceYears: 8,
    isPublic: true,
    phone: '09171112233',
    ratingAverage: 4.6,
    reviewCount: 4,
    isVerified: false,
    createdAt: '2024-01-10T00:00:00.000Z',
    updatedAt: '2026-02-10T00:00:00.000Z',
    environment: 'demo',
    schemaVersion: 1,
  },
  {
    id: 'prof-5',
    userId: 'surveyor-5',
    fullName: 'مهندس پیمان ناصری',
    title: 'مهندس ارشد نقشه‌برداری مسیر، راه‌سازی و خطوط انتقال',
    bio: 'طراحی و پیاده‌سازی مسیر خطوط انتقال گاز، آب و برق، راه‌سازی و محاسبه احجام عملیات خاکی با استفاده از ابزارهای پیشرفته تحلیل مکانی.',
    province: 'آذربایجان شرقی',
    city: 'تبریز',
    serviceAreas: ['تبریز', 'مرند', 'مراغه', 'شبستر', 'ارومیه'],
    specialties: ['نقشه‌برداری مسیر', 'محاسبه احجام خاکی', 'توپوگرافی اراضی', 'خطوط انتقال'],
    experienceYears: 11,
    isPublic: true,
    phone: '09142223344',
    ratingAverage: 4.8,
    reviewCount: 7,
    isVerified: true,
    createdAt: '2023-06-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    environment: 'demo',
    schemaVersion: 1,
  },
];

const SEED_RESUMES: SurveyorResumeItem[] = [
  {
    id: 'res-1',
    userId: 'demo-user-123',
    type: 'education',
    title: 'کارشناسی ارشد مهندسی نقشه‌برداری (گرایش ژئودزی)',
    organization: 'دانشگاه تهران - دانشکده فنی',
    location: 'تهران',
    startYearJalali: '۱۳۸۸',
    endYearJalali: '۱۳۹۱',
    isCurrent: false,
    description: 'پایان‌نامه در زمینه پردازش داده‌های گیرنده‌های ماهواره‌ای GNSS و تحلیل تغییرشکل‌های پوسته زمین',
    orderIndex: 1,
    createdAt: '2023-01-01T00:00:00.000Z',
    environment: 'demo',
  },
  {
    id: 'res-2',
    userId: 'demo-user-123',
    type: 'work',
    title: 'مدیر دپارتمان ژئوماتیک و نقشه‌برداری هوایی',
    organization: 'شرکت مهندسین مشاور نقشه‌نگار یزد',
    location: 'یزد',
    startYearJalali: '۱۳۹۴',
    endYearJalali: 'تاکنون',
    isCurrent: true,
    description: 'مدیریت بیش از ۵۰ پروژه کلان نقشه‌برداری هوایی، کاداستر شهری و تفکیک اراضی در فلات مرکزی ایران',
    orderIndex: 2,
    createdAt: '2023-01-01T00:00:00.000Z',
    environment: 'demo',
  },
  {
    id: 'res-3',
    userId: 'demo-user-123',
    type: 'work',
    title: 'کارشناس نقشه‌برداری با مدرک ثبت‌شده در امور ثبتی و نقشه‌برداری',
    organization: 'مرجع درج‌شده توسط کاربر — بررسی نمایشی استان یزد',
    location: 'یزد',
    startYearJalali: '۱۳۹۷',
    endYearJalali: 'تاکنون',
    isCurrent: true,
    description: 'ارائه گزارش‌های کارشناسی معتبر در دعاوی تحدید حدود، رفع تداخل پلاک‌های ثبتی و صدور اسناد تک‌برگ',
    orderIndex: 3,
    createdAt: '2023-01-01T00:00:00.000Z',
    environment: 'demo',
  },
];

const SEED_CREDENTIALS: SurveyorCredential[] = [
  {
    id: 'cred-1',
    userId: 'demo-user-123',
    type: 'engineering_license',
    title: 'پروانه اشتغال به کار مهندسی ساختمان (پایه یک طراحی و نظارت نقشه‌برداری)',
    issuer: 'سازمان نظام مهندسی ساختمان استان یزد',
    credentialNumber: 'ن-۲۴۸۸۹-یزد',
    issueDateJalali: '۱۳۹۳/۰۴/۱۵',
    expiryDateJalali: '۱۴۰۶/۰۴/۱۵',
    gradeOrBase: 'پایه یک ارشد',
    isVerified: true,
    isPublic: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    environment: 'demo',
  },
  {
    id: 'cred-2',
    userId: 'demo-user-123',
    type: 'judicial_expert',
    title: 'پروانه کارشناس نقشه‌برداری با مدرک ثبت‌شده در رشته امور ثبتی و نقشه‌برداری',
    issuer: 'مرجع درج‌شده توسط کاربر — بررسی نمایشی استان یزد',
    credentialNumber: 'ک-۸۸۲۹۱-د',
    issueDateJalali: '۱۳۹۷/۰۸/۲۰',
    expiryDateJalali: '۱۴۰۶/۰۸/۲۰',
    gradeOrBase: 'مدرک حرفه‌ای ثبت‌شده — بررسی نمایشی',
    isVerified: true,
    isPublic: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    environment: 'demo',
  },
  {
    id: 'cred-3',
    userId: 'demo-user-123',
    type: 'drone_pilot',
    title: 'گواهینامه ثبت‌شده — بررسی نمایشی هدایت و تصویربرداری پهپاد غیرنظامی (RTK Mapping)',
    issuer: 'سازمان هواپیمایی کشوری و مرکز آموزش هوانوردی',
    credentialNumber: 'UAV-77402-IR',
    issueDateJalali: '۱۴۰۰/۰۲/۱۰',
    expiryDateJalali: '۱۴۰۵/۰۲/۱۰',
    gradeOrBase: 'خلبان مجاز فتوگرامتری صنعتی',
    isVerified: true,
    isPublic: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    environment: 'demo',
  },
];

const SEED_PORTFOLIO: PortfolioItem[] = [
  {
    id: 'port-1',
    userId: 'demo-user-123',
    title: 'نقشه‌برداری هوایی، ارتوفتو و تهیه نقشه توپوگرافی شهرک صنعتی یزد',
    category: 'فتوگرامتری پهپاد',
    clientName: 'شرکت شهرک‌های صنعتی استان یزد',
    location: 'یزد - شهرک صنعتی فاز ۴',
    completionYearJalali: '۱۴۰۳',
    scaleOrVolume: '۶۵۰ هکتار',
    equipmentUsed: ['پهپاد Phantom 4 RTK', 'گیرنده چندفرکانسه GNSS شمیم', 'نرم‌افزار Pix4D'],
    description: 'تهیه مدل رقومی ارتفاعی (DEM)، نقشه ارتوفتو با رزولوشن ۳ سانتی‌متر بر پیکسل و منحنی‌های میزان نیم‌متری جهت طراحی شبکه هدایت آب‌های سطحی.',
    deliverablesSummary: 'شیت‌های CAD توپوگرافی ۱:۱۰۰۰، ابر نقاط ژئورفرنس و گزارش کامل دقت مسطحاتی و ارتفاعی',
    isFeatured: true,
    createdAt: '2024-05-10T00:00:00.000Z',
    environment: 'demo',
  },
  {
    id: 'port-2',
    userId: 'demo-user-123',
    title: 'تفکیک، جانمایی ثبتی و پیاده‌سازی شهرک مسکونی ۲۴۰ واحدی مهر گستر',
    category: 'تفکیک اراضی',
    clientName: 'شرکت تعاونی مسکن فرهنگیان',
    location: 'میبد - بلوار شمس',
    completionYearJalali: '۱۴۰۲',
    scaleOrVolume: '۱۲ هکتار (۲۴۰ پلاک تفکیکی)',
    equipmentUsed: ['توتال استیشن Leica TS06 Plus', 'گیرنده ایستگاهی RTK', 'مترهای لیزری دقیق'],
    description: 'پیاده‌سازی خطوط مرزی قطعات، آکس شوارع، میله‌گذاری گوشه‌ها و تنظیم صورتمجلس تفکیکی جهت اخذ اسناد مالکیت تک‌برگ از اداره ثبت اسناد.',
    deliverablesSummary: 'دفترچه تفکیکی ممهور، نقشه‌های کدبندی شده قطعات و فایل‌های GIS',
    isFeatured: true,
    createdAt: '2023-11-20T00:00:00.000Z',
    environment: 'demo',
  },
  {
    id: 'port-3',
    userId: 'demo-user-123',
    title: 'مانیتورینگ دقیق تغییرشکل و رفتارنگاری دیواره گودبرداری ۱۸ متری مجتمع تجاری نگین',
    category: 'مانیتورینگ سازه',
    clientName: 'گروه ساختمانی مهستان',
    location: 'یزد - میدان شهدای محراب',
    completionYearJalali: '۱۴۰۳',
    scaleOrVolume: '۴,۰۰۰ مترمربع زیربنا (عمق ۱۸ متر)',
    equipmentUsed: ['توتال استیشن دقیق Leica TS09 (0.5 ثانیه)', 'تارگت‌های میکرو رفلکتور', 'نیووی دقیق دیجیتال'],
    description: 'پایش تغییرات میلی‌متری میکروپایل‌ها و انکراژهای نیلینگ دیواره‌های مجاور در طول عملیات خاکبرداری به صورت هفتگی و رسم نمودارهای نشست و جابه‌جایی برداری.',
    deliverablesSummary: 'گزارش‌های دوره‌ای پایش ایمنی گود با نمودارهای جابه‌جایی ۳ بعدی',
    isFeatured: true,
    createdAt: '2024-08-15T00:00:00.000Z',
    environment: 'demo',
  },
];

const SEED_PRICES: PublishedPriceCard[] = [
  {
    id: 'price-1',
    userId: 'demo-user-123',
    title: 'تهیه نقشه یو‌تی‌ام (UTM) تک‌برگی سند ثبتی',
    serviceCategory: 'ثبتی و شهرداری',
    unit: 'هر قطعه ملک مسکونی (تا ۵۰۰ متر)',
    basePrice: 4500000,
    priceRangeMax: 6000000,
    estimatedTurnaround: '۲ الی ۳ روز کاری',
    conditionsAndInclusions: [
      'برداشت میدانی با گیرنده مولتی‌فرکانس شمیم (دقت زیر سانتیمتر)',
      'تطبیق ابعاد با اسناد مادر و سند مالکیت',
      'ترسیم کاداستر طبق فرمت استاندارد اداره ثبت و شهرداری',
      'مهر و امضای کارشناس دارای مدرک ثبت‌شده یا مهندس نقشه‌بردار',
    ],
    notes: 'برای اراضی بزرگتر یا باغ ویلاهای خارج از محدوده شهری هزینه بر مبنای مساحت محاسبه می‌شود.',
    isPublished: true,
    orderIndex: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    environment: 'demo',
  },
  {
    id: 'price-2',
    userId: 'demo-user-123',
    title: 'نقشه‌برداری هوایی با پهپاد RTK و تولید نقشه توپوگرافی و ارتوفتو',
    serviceCategory: 'فتوگرامتری پهپاد',
    unit: 'روزانه / تا ۱۰۰ هکتار',
    basePrice: 16000000,
    priceRangeMax: 22000000,
    estimatedTurnaround: '۳ الی ۵ روز کاری',
    conditionsAndInclusions: [
      'پرواز با مدارک پرواز ثبت‌شده — بررسی نمایشی و پوشش بیمه‌ای کامل',
      'کاشت و قرائت نقاط کنترل زمینی (GCP) با دقت ژئودتیک',
      'تولید ارتوفتوموزاییک با رزولوشن بالا و ابر نقاط سه‌بعدی',
      'استخراج منحنی‌های میزان و پروفیل‌های طولی و عرضی',
    ],
    notes: 'ایاب و ذهاب برای پروژه‌های خارج از حومه شهر به صورت توافقی منظور می‌گردد.',
    isPublished: true,
    orderIndex: 2,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    environment: 'demo',
  },
  {
    id: 'price-3',
    userId: 'demo-user-123',
    title: 'پیاده‌سازی آکس ستون‌ها، فونداسیون و کنترل ترازهای ساختمانی',
    serviceCategory: 'ساختمانی و اجرایی',
    unit: 'هر سقف / مرحله اجرایی',
    basePrice: 5500000,
    priceRangeMax: 8000000,
    estimatedTurnaround: '۱ روز کاری (هماهنگی از ۲۴ ساعت قبل)',
    conditionsAndInclusions: [
      'پیاده‌سازی خطوط اصلی با توتال استیشن کالیبره',
      'ایجاد بنچ‌مارک‌های ثابت کارگاهی روی نقاط مطمئن',
      'کنترل شاقولی ستون‌ها و دیوارهای برشی',
      'تحویل صورت‌جلسه کنترل کیفیت به ناظر سازه',
    ],
    notes: 'پروژه‌های دارای قرارداد بلندمدت ماهانه از تخفیف ۲۰٪ بهره‌مند می‌شوند.',
    isPublished: true,
    orderIndex: 3,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    environment: 'demo',
  },
  {
    id: 'price-4',
    userId: 'demo-user-123',
    title: 'مانیتورینگ و پایش رفتار دیواره گود و ساختمان‌های مجاور',
    serviceCategory: 'ژئوتکنیک و پایش',
    unit: 'هر نوبت قرائت دوره‌ای',
    basePrice: 7000000,
    priceRangeMax: 10000000,
    estimatedTurnaround: '۲۴ ساعت پس از قرائت میدانی',
    conditionsAndInclusions: [
      'قرائت تارگت‌های میکرو رفلکتور نصب شده در دیواره',
      'تحلیل بردارهای جابه‌جایی افقی و نشست‌های قائم',
      'ارائه نمودارهای تغییرشکل و هشدار خطوط بحرانی به مجری گود',
    ],
    notes: 'هزینه نصب اولیه تارگت‌ها و ایجاد شبکه مبنای خارج از محدوده گود جداگانه محاسبه می‌شود.',
    isPublished: true,
    orderIndex: 4,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    environment: 'demo',
  },
];

const SEED_REVIEWS: SurveyorReview[] = [
  {
    id: 'rev-1',
    surveyorId: 'demo-user-123',
    clientId: 'client-1',
    clientName: 'حاج محمد کاشانی (مالک ملک ثبتی)',
    overallRating: 5,
    ratings: {
      accuracy: 5,
      punctuality: 5,
      communication: 5,
      pricingFairness: 5,
    },
    projectType: 'نقشه UTM و تحدید حدود سند',
    comment: 'جناب مهندس رضایی با تسلط فوق‌العاده بالا به قوانین ثبتی، نقشه ملک ما را در کمتر از ۴۸ ساعت آماده کردند و در اداره ثبت بدون حتی یک ایراد تأیید شد. بسیار دقیق، وقت‌شناس و متعهد هستند.',
    isApproved: true,
    isReported: false,
    createdAtJalali: '۱۴۰۴/۱۰/۱۲',
    createdAt: '2025-12-30T00:00:00.000Z',
    environment: 'demo',
    surveyorReply: {
      text: 'با تشکر از حسن اعتماد و همراهی صمیمانه جناب کاشانی گرامی. رضایت شما مایه افتخار است.',
      replyDateJalali: '۱۴۰۴/۱۰/۱۳',
    },
  },
  {
    id: 'rev-2',
    surveyorId: 'demo-user-123',
    clientId: 'client-2',
    clientName: 'مهندس سعید جلالی (سرپرست کارگاه برج پارسیان)',
    overallRating: 5,
    ratings: {
      accuracy: 5,
      punctuality: 5,
      communication: 4,
      pricingFairness: 5,
    },
    projectType: 'پیاده‌سازی آکس ستون‌ها و کنترل تراز',
    comment: 'دقت در جانمایی آکس ستون‌ها و شاقولی قالب‌ها عالی بود. ابزارهای بسیار دقیق و نوینی دارند و گزارش‌ها همیشه منظم و مکتوب تحویل می‌شد.',
    isApproved: true,
    isReported: false,
    createdAtJalali: '۱۴۰۴/۱۱/۰۴',
    createdAt: '2026-01-20T00:00:00.000Z',
    environment: 'demo',
  },
  {
    id: 'rev-3',
    surveyorId: 'demo-user-123',
    clientId: 'client-3',
    clientName: 'دکتر احسان فلاحتی (مدیرعامل شرکت توسعه کویر)',
    overallRating: 4,
    ratings: {
      accuracy: 5,
      punctuality: 4,
      communication: 5,
      pricingFairness: 4,
    },
    projectType: 'نقشه‌برداری هوایی با پهپاد',
    comment: 'کیفیت خروجی‌های ارتوفتو و فایل‌های CAD توپوگرافی بسیار فراتر از انتظار مهندسین مشاور ما بود. سرعت پردازش داده‌ها هم خوب بود.',
    isApproved: true,
    isReported: false,
    createdAtJalali: '۱۴۰۴/۱۱/۲۸',
    createdAt: '2026-02-15T00:00:00.000Z',
    environment: 'demo',
  },
  {
    id: 'rev-4',
    surveyorId: 'demo-user-123',
    clientId: 'client-4',
    clientName: 'مهندس مهدی ابراهیمی (پیمانکار راهسازی)',
    overallRating: 5,
    ratings: {
      accuracy: 5,
      punctuality: 5,
      communication: 5,
      pricingFairness: 5,
    },
    projectType: 'تفکیک اراضی و بر و کف',
    comment: 'بسیار حرفه‌ای و خوش‌قول. با تجهیزات GNSS شمیم در سریع‌ترین زمان کار تفکیک ۲۴ قطعه را نهایی کردند.',
    isApproved: true,
    isReported: false,
    createdAtJalali: '۱۴۰۴/۱۲/۰۵',
    createdAt: '2026-02-24T00:00:00.000Z',
    environment: 'demo',
  },
  {
    id: 'rev-5',
    surveyorId: 'demo-user-123',
    clientId: 'client-5',
    clientName: 'خانم مهندس سمیرا زارع (طراح منظر)',
    overallRating: 5,
    ratings: {
      accuracy: 5,
      punctuality: 5,
      communication: 5,
      pricingFairness: 4,
    },
    projectType: 'توپوگرافی و برداشت عوارض طبیعی باغ ویلا',
    comment: 'برداشت تمامی تک‌درخت‌ها و اختلاف ارتفاع‌ها با دقت سانتی‌متری انجام شد. از برخورد صبورانه و پاسخگویی سریع ایشان کمال تشکر را دارم.',
    isApproved: true,
    isReported: false,
    createdAtJalali: '۱۴۰۴/۱۲/۱۰',
    createdAt: '2026-02-28T00:00:00.000Z',
    environment: 'demo',
  },
];

const SEED_SELECTIONS: SurveyorSelection[] = [
  {
    id: 'sel-1',
    clientId: 'client-demo-1',
    clientName: 'مهندس نادر حسنی',
    clientPhone: '09121113355',
    surveyorId: 'demo-user-123',
    surveyorName: 'مهندس علیرضا رضایی',
    serviceRequestedTitle: 'تهیه نقشه یو‌تی‌ام تک‌برگی برای سند باغ ۵۰۰۰ متری',
    location: 'یزد - تفت',
    approximateBudget: 6000000,
    preferredDateJalali: '۱۴۰۵/۰۱/۱۵',
    inquiryNotes: 'ملک دارای سند دفترچه‌ای قدیمی است و برای تبدیل به تک‌برگ نیازمند نقشه UTM ممهور به مهر کارشناس دارای مدرک ثبت‌شده هستیم.',
    status: 'contacted',
    createdAt: '2026-03-01T10:00:00.000Z',
    environment: 'demo',
  },
];

// Helper to compute aggregates
function computeReviewAggregate(surveyorId: string, reviews: SurveyorReview[]): ReviewAggregate {
  const approved = reviews.filter((r) => r.surveyorId === surveyorId && r.isApproved);
  if (approved.length === 0) {
    return {
      surveyorId,
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      categoryAverages: { accuracy: 0, punctuality: 0, communication: 0, pricingFairness: 0 },
    };
  }

  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sumOverall = 0;
  let sumAcc = 0;
  let sumPunct = 0;
  let sumComm = 0;
  let sumPrice = 0;

  for (const r of approved) {
    const rounded = Math.min(5, Math.max(1, Math.round(r.overallRating))) as 1 | 2 | 3 | 4 | 5;
    dist[rounded] = (dist[rounded] || 0) + 1;
    sumOverall += r.overallRating;
    sumAcc += r.ratings.accuracy;
    sumPunct += r.ratings.punctuality;
    sumComm += r.ratings.communication;
    sumPrice += r.ratings.pricingFairness;
  }

  const n = approved.length;
  return {
    surveyorId,
    averageRating: Number((sumOverall / n).toFixed(1)),
    totalReviews: n,
    ratingDistribution: dist,
    categoryAverages: {
      accuracy: Number((sumAcc / n).toFixed(1)),
      punctuality: Number((sumPunct / n).toFixed(1)),
      communication: Number((sumComm / n).toFixed(1)),
      pricingFairness: Number((sumPrice / n).toFixed(1)),
    },
  };
}

// ---------------- 1. Surveyor Profiles Repository ----------------

export class DemoSurveyorProfilesRepository extends Stage6RepositoryBase implements ISurveyorProfilesRepository {
  private checkPhoneAccess(surveyorUserId: string, viewer?: RepositoryActor): boolean {
    if (!viewer || viewer.environment !== this.environment) return false;
    if (viewer.role === 'surveyor' && viewer.userId === surveyorUserId) return true;
    if (viewer.role !== 'client') return false;
    const selections = storage.get<SurveyorSelection[]>(this.key(KEYS.SELECTIONS), this.seed(SEED_SELECTIONS));
    return selections.some((s) => s.clientId === viewer.userId && s.surveyorId === surveyorUserId);
  }

  private sanitizeProfileForViewer(
    raw: SurveyorPublicProfile,
    viewer?: RepositoryActor
  ): SurveyorPublicProfile {
    const hasAccess = this.checkPhoneAccess(raw.userId, viewer);
    return {
      ...raw,
      phone: hasAccess ? raw.phone : undefined,
      hasPhoneAccess: hasAccess,
      phoneMaskedNotice: hasAccess
        ? undefined
        : 'شماره تماس پس از ثبت درخواست استعلام نمایش داده می‌شود.',
    };
  }

  async getProfileByUserId(
    userId: string,
    viewer?: RepositoryActor
  ): Promise<SurveyorPublicProfile | null> {
    const all = storage.get<SurveyorPublicProfile[]>(this.key(KEYS.PROFILES), this.seed(SEED_PROFILES));
    const found = all.find((p) => p.userId === userId);
    if (!found) return null;
    return this.sanitizeProfileForViewer(found, viewer);
  }

  async getAllPublicProfiles(
    filters?: ProfileFilterOptions,
    viewer?: RepositoryActor
  ): Promise<SurveyorPublicProfile[]> {
    let list = storage.get<SurveyorPublicProfile[]>(this.key(KEYS.PROFILES), this.seed(SEED_PROFILES)).filter((p) => p.isPublic);

    if (filters) {
      if (filters.province) {
        list = list.filter((p) => p.province === filters.province);
      }
      if (filters.city) {
        list = list.filter((p) => p.city.includes(filters.city!) || p.serviceAreas.some((a) => a.includes(filters.city!)));
      }
      if (filters.specialty) {
        list = list.filter((p) => p.specialties.some((s) => s.includes(filters.specialty!)));
      }
      if (filters.onlyVerified) {
        list = list.filter((p) => p.isVerified);
      }
      if (filters.minRating && filters.minRating > 0) {
        list = list.filter((p) => p.ratingAverage >= filters.minRating!);
      }
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const q = filters.searchQuery.trim().toLowerCase();
        list = list.filter(
          (p) =>
            p.fullName.toLowerCase().includes(q) ||
            p.title.toLowerCase().includes(q) ||
            p.bio.toLowerCase().includes(q) ||
            p.city.toLowerCase().includes(q) ||
            p.province.toLowerCase().includes(q) ||
            p.specialties.some((s) => s.toLowerCase().includes(q)) ||
            p.serviceAreas.some((a) => a.toLowerCase().includes(q))
        );
      }
    }

    return list.map((p) => this.sanitizeProfileForViewer(p, viewer));
  }

  async hasValidInquiry(clientId: string, surveyorId: string): Promise<boolean> {
    if (!clientId || !surveyorId) return false;
    const selections = storage.get<SurveyorSelection[]>(this.key(KEYS.SELECTIONS), this.seed(SEED_SELECTIONS));
    return selections.some((s) => s.clientId === clientId && s.surveyorId === surveyorId);
  }

  async saveProfile(data: Partial<SurveyorPublicProfile> & { userId: string }): Promise<SurveyorPublicProfile> {
    const all = storage.get<SurveyorPublicProfile[]>(this.key(KEYS.PROFILES), this.seed(SEED_PROFILES));
    const index = all.findIndex((p) => p.userId === data.userId);

    const now = new Date().toISOString();
    let updated: SurveyorPublicProfile;

    if (index >= 0) {
      updated = {
        ...all[index],
        ...data,
        updatedAt: now,
      };
      all[index] = updated;
    } else {
      updated = {
        id: `prof-${Date.now()}`,
        userId: data.userId,
        fullName: data.fullName || 'مهندس نقشه‌بردار',
        title: data.title || 'مهندس نقشه‌بردار',
        bio: data.bio || '',
        province: data.province || 'یزد',
        city: data.city || 'یزد',
        serviceAreas: data.serviceAreas || [data.city || 'یزد'],
        specialties: data.specialties || ['نقشه UTM سند'],
        experienceYears: data.experienceYears || 5,
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
        phone: data.phone || '',
        email: data.email,
        website: data.website,
        ratingAverage: data.ratingAverage || 5.0,
        reviewCount: data.reviewCount || 0,
        isVerified: data.isVerified || false,
        avatarUrl: data.avatarUrl,
        createdAt: now,
        updatedAt: now,
        environment: this.environment,
        schemaVersion: 1,
      };
      all.push(updated);
    }

    storage.set(this.key(KEYS.PROFILES), all);
    return updated;
  }

  async updateRatingAggregate(userId: string, avgRating: number, count: number): Promise<void> {
    const all = storage.get<SurveyorPublicProfile[]>(this.key(KEYS.PROFILES), this.seed(SEED_PROFILES));
    const index = all.findIndex((p) => p.userId === userId);
    if (index >= 0) {
      all[index].ratingAverage = avgRating;
      all[index].reviewCount = count;
      all[index].updatedAt = new Date().toISOString();
      storage.set(this.key(KEYS.PROFILES), all);
    }
  }

  async verifyProfile(actor: RepositoryActor, userId: string, isVerified: boolean): Promise<SurveyorPublicProfile> {
    this.assertAdmin(actor);
    const all = storage.get<SurveyorPublicProfile[]>(this.key(KEYS.PROFILES), this.seed(SEED_PROFILES));
    const index = all.findIndex((p) => p.userId === userId);
    if (index === -1) throw new Error('پروفایل یافت نشد');

    all[index].isVerified = isVerified;
    all[index].updatedAt = new Date().toISOString();
    storage.set(this.key(KEYS.PROFILES), all);
    return all[index];
  }
}

// ---------------- 2. Surveyor Resume Repository ----------------

export class DemoSurveyorResumeRepository extends Stage6RepositoryBase implements ISurveyorResumeRepository {
  async getItemsByUserId(userId: string): Promise<SurveyorResumeItem[]> {
    const all = storage.get<SurveyorResumeItem[]>(this.key(KEYS.RESUMES), this.seed(SEED_RESUMES));
    return all
      .filter((r) => r.userId === userId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async addItem(item: Omit<SurveyorResumeItem, 'id' | 'createdAt' | 'environment'>): Promise<SurveyorResumeItem> {
    const all = storage.get<SurveyorResumeItem[]>(this.key(KEYS.RESUMES), this.seed(SEED_RESUMES));
    const newItem: SurveyorResumeItem = {
      ...item,
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      environment: this.environment,
    };
    all.push(newItem);
    storage.set(this.key(KEYS.RESUMES), all);
    return newItem;
  }

  async updateItem(id: string, updates: Partial<SurveyorResumeItem>): Promise<SurveyorResumeItem> {
    const all = storage.get<SurveyorResumeItem[]>(this.key(KEYS.RESUMES), this.seed(SEED_RESUMES));
    const index = all.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('مورد سابقه یافت نشد');

    all[index] = { ...all[index], ...updates };
    storage.set(this.key(KEYS.RESUMES), all);
    return all[index];
  }

  async deleteItem(id: string): Promise<boolean> {
    const all = storage.get<SurveyorResumeItem[]>(this.key(KEYS.RESUMES), this.seed(SEED_RESUMES));
    const filtered = all.filter((r) => r.id !== id);
    storage.set(this.key(KEYS.RESUMES), filtered);
    return filtered.length < all.length;
  }
}

// ---------------- 3. Credentials Repository ----------------

export class DemoCredentialsRepository extends Stage6RepositoryBase implements ICredentialsRepository {
  async getCredentialsByUserId(userId: string, onlyPublic = false): Promise<SurveyorCredential[]> {
    const all = storage.get<SurveyorCredential[]>(this.key(KEYS.CREDENTIALS), this.seed(SEED_CREDENTIALS));
    let list = all.filter((c) => c.userId === userId);
    if (onlyPublic) {
      list = list.filter((c) => c.isPublic);
    }
    return list;
  }

  async addCredential(cred: Omit<SurveyorCredential, 'id' | 'createdAt' | 'environment'>): Promise<SurveyorCredential> {
    const all = storage.get<SurveyorCredential[]>(this.key(KEYS.CREDENTIALS), this.seed(SEED_CREDENTIALS));
    const newCred: SurveyorCredential = {
      ...cred,
      id: `cred-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      environment: this.environment,
    };
    all.push(newCred);
    storage.set(this.key(KEYS.CREDENTIALS), all);
    return newCred;
  }

  async updateCredential(id: string, updates: Partial<SurveyorCredential>): Promise<SurveyorCredential> {
    const all = storage.get<SurveyorCredential[]>(this.key(KEYS.CREDENTIALS), this.seed(SEED_CREDENTIALS));
    const index = all.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('گواهینامه یافت نشد');

    all[index] = { ...all[index], ...updates };
    storage.set(this.key(KEYS.CREDENTIALS), all);
    return all[index];
  }

  async deleteCredential(id: string): Promise<boolean> {
    const all = storage.get<SurveyorCredential[]>(this.key(KEYS.CREDENTIALS), this.seed(SEED_CREDENTIALS));
    const filtered = all.filter((c) => c.id !== id);
    storage.set(this.key(KEYS.CREDENTIALS), filtered);
    return filtered.length < all.length;
  }

  async verifyCredential(actor: RepositoryActor, id: string, isVerified: boolean): Promise<SurveyorCredential> {
    this.assertAdmin(actor);
    const all = storage.get<SurveyorCredential[]>(this.key(KEYS.CREDENTIALS), this.seed(SEED_CREDENTIALS));
    const index = all.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('گواهینامه یافت نشد');

    all[index].isVerified = isVerified;
    storage.set(this.key(KEYS.CREDENTIALS), all);
    return all[index];
  }
}

// ---------------- 4. Portfolio Repository ----------------

export class DemoPortfolioRepository extends Stage6RepositoryBase implements IPortfolioRepository {
  async getItemsByUserId(userId: string): Promise<PortfolioItem[]> {
    const all = storage.get<PortfolioItem[]>(this.key(KEYS.PORTFOLIO), this.seed(SEED_PORTFOLIO));
    return all.filter((p) => p.userId === userId);
  }

  async addItem(item: Omit<PortfolioItem, 'id' | 'createdAt' | 'environment'>): Promise<PortfolioItem> {
    const all = storage.get<PortfolioItem[]>(this.key(KEYS.PORTFOLIO), this.seed(SEED_PORTFOLIO));
    const newItem: PortfolioItem = {
      ...item,
      id: `port-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      environment: this.environment,
    };
    all.push(newItem);
    storage.set(this.key(KEYS.PORTFOLIO), all);
    return newItem;
  }

  async updateItem(id: string, updates: Partial<PortfolioItem>): Promise<PortfolioItem> {
    const all = storage.get<PortfolioItem[]>(this.key(KEYS.PORTFOLIO), this.seed(SEED_PORTFOLIO));
    const index = all.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('نمونه کار یافت نشد');

    all[index] = { ...all[index], ...updates };
    storage.set(this.key(KEYS.PORTFOLIO), all);
    return all[index];
  }

  async deleteItem(id: string): Promise<boolean> {
    const all = storage.get<PortfolioItem[]>(this.key(KEYS.PORTFOLIO), this.seed(SEED_PORTFOLIO));
    const filtered = all.filter((p) => p.id !== id);
    storage.set(this.key(KEYS.PORTFOLIO), filtered);
    return filtered.length < all.length;
  }
}

// ---------------- 5. Published Prices Repository ----------------

export class DemoPublishedPricesRepository extends Stage6RepositoryBase implements IPublishedPricesRepository {
  async getPriceCardsByUserId(userId: string, onlyPublished = false): Promise<PublishedPriceCard[]> {
    const all = storage.get<PublishedPriceCard[]>(this.key(KEYS.PRICES), this.seed(SEED_PRICES));
    let list = all.filter((p) => p.userId === userId);
    if (onlyPublished) {
      list = list.filter((p) => p.isPublished);
    }
    return list.sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async getAllPublishedPriceCards(category?: string): Promise<PublishedPriceCard[]> {
    const all = storage.get<PublishedPriceCard[]>(this.key(KEYS.PRICES), this.seed(SEED_PRICES));
    let list = all.filter((p) => p.isPublished);
    if (category) {
      list = list.filter((p) => p.serviceCategory === category);
    }
    return list;
  }

  async addPriceCard(card: Omit<PublishedPriceCard, 'id' | 'createdAt' | 'updatedAt' | 'environment'>): Promise<PublishedPriceCard> {
    const all = storage.get<PublishedPriceCard[]>(this.key(KEYS.PRICES), this.seed(SEED_PRICES));
    const now = new Date().toISOString();
    const newCard: PublishedPriceCard = {
      ...card,
      id: `price-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
      environment: this.environment,
    };
    all.push(newCard);
    storage.set(this.key(KEYS.PRICES), all);
    return newCard;
  }

  async updatePriceCard(id: string, updates: Partial<PublishedPriceCard>): Promise<PublishedPriceCard> {
    const all = storage.get<PublishedPriceCard[]>(this.key(KEYS.PRICES), this.seed(SEED_PRICES));
    const index = all.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('تعرفه منتشرشده یافت نشد');

    all[index] = {
      ...all[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    storage.set(this.key(KEYS.PRICES), all);
    return all[index];
  }

  async deletePriceCard(id: string): Promise<boolean> {
    const all = storage.get<PublishedPriceCard[]>(this.key(KEYS.PRICES), this.seed(SEED_PRICES));
    const filtered = all.filter((p) => p.id !== id);
    storage.set(this.key(KEYS.PRICES), filtered);
    return filtered.length < all.length;
  }
}

// ---------------- 6. Surveyor Selections Repository ----------------

export class DemoSurveyorSelectionsRepository extends Stage6RepositoryBase implements ISurveyorSelectionsRepository {
  private withAuthorizedPhone(selection: SurveyorSelection, actor: RepositoryActor): SurveyorSelection {
    const profiles = storage.get<SurveyorPublicProfile[]>(this.key(KEYS.PROFILES), this.seed(SEED_PROFILES));
    const profile = profiles.find((p) => p.userId === selection.surveyorId);
    return { ...selection, surveyorPhone: actor.role === 'client' && actor.userId === selection.clientId ? profile?.phone : undefined };
  }

  async getSelectionsForClient(actor: RepositoryActor): Promise<SurveyorSelection[]> {
    this.assertEnvironment(actor);
    if (actor.role !== 'client') throw new Error('این فهرست فقط برای کارفرمای مالک درخواست قابل مشاهده است.');
    const all = storage.get<SurveyorSelection[]>(this.key(KEYS.SELECTIONS), this.seed(SEED_SELECTIONS));
    return all.filter((s) => s.clientId === actor.userId).map((s) => this.withAuthorizedPhone(s, actor));
  }

  async getSelectionsForSurveyor(actor: RepositoryActor): Promise<SurveyorSelection[]> {
    this.assertEnvironment(actor);
    if (actor.role !== 'surveyor') throw new Error('این فهرست فقط برای نقشه‌بردار مالک درخواست قابل مشاهده است.');
    const all = storage.get<SurveyorSelection[]>(this.key(KEYS.SELECTIONS), this.seed(SEED_SELECTIONS));
    return all.filter((s) => s.surveyorId === actor.userId).map((s) => ({ ...s, surveyorPhone: undefined }));
  }

  async getSelectionById(id: string, actor: RepositoryActor): Promise<SurveyorSelection | null> {
    this.assertEnvironment(actor);
    const all = storage.get<SurveyorSelection[]>(this.key(KEYS.SELECTIONS), this.seed(SEED_SELECTIONS));
    const found = all.find((s) => s.id === id);
    if (!found) return null;
    const isOwner = (actor.role === 'client' && actor.userId === found.clientId) ||
      (actor.role === 'surveyor' && actor.userId === found.surveyorId);
    if (!isOwner) throw new Error('دسترسی به این درخواست مجاز نیست.');
    return this.withAuthorizedPhone(found, actor);
  }

  async createSelection(
    actor: RepositoryActor,
    selection: Omit<SurveyorSelection, 'id' | 'createdAt' | 'environment' | 'status' | 'surveyorPhone'>
  ): Promise<SurveyorSelection> {
    this.assertEnvironment(actor);
    if (actor.role !== 'client' || actor.userId !== selection.clientId) throw new Error('ثبت استعلام فقط برای کارفرمای واردشده مجاز است.');
    const all = storage.get<SurveyorSelection[]>(this.key(KEYS.SELECTIONS), this.seed(SEED_SELECTIONS));
    const now = new Date();
    const jalaliDate = toJalaliDate(now);

    const newSel: SurveyorSelection = {
      ...selection,
      id: `sel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'submitted',
      createdAtJalali: jalaliDate,
      createdAt: now.toISOString(),
      environment: this.environment,
    };
    all.unshift(newSel);
    storage.set(this.key(KEYS.SELECTIONS), all);
    return this.withAuthorizedPhone(newSel, actor);
  }

  async updateSelectionStatus(actor: RepositoryActor, id: string, status: SurveyorSelection['status']): Promise<SurveyorSelection> {
    this.assertEnvironment(actor);
    const all = storage.get<SurveyorSelection[]>(this.key(KEYS.SELECTIONS), this.seed(SEED_SELECTIONS));
    const index = all.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('درخواست انتخاب یافت نشد');
    if (actor.role !== 'surveyor' || actor.userId !== all[index].surveyorId) throw new Error('تغییر وضعیت فقط برای نقشه‌بردار این درخواست مجاز است.');

    all[index].status = status;
    storage.set(this.key(KEYS.SELECTIONS), all);
    return all[index];
  }
}

// ---------------- 7. Surveyor Reviews Repository ----------------

export class DemoSurveyorReviewsRepository extends Stage6RepositoryBase implements ISurveyorReviewsRepository {
  async getReviewsForSurveyor(surveyorId: string, actor?: RepositoryActor, includeUnapproved = false): Promise<SurveyorReview[]> {
    if (actor) this.assertEnvironment(actor);
    if (includeUnapproved && actor?.role !== 'admin') throw new Error('مشاهده نظرات مخفی فقط برای مدیر مجاز است.');
    const all = storage.get<SurveyorReview[]>(this.key(KEYS.REVIEWS), this.seed(SEED_REVIEWS));
    return all.filter((r) => r.surveyorId === surveyorId && (includeUnapproved || r.isApproved));
  }

  async getReviewsByClient(actor: RepositoryActor): Promise<SurveyorReview[]> {
    this.assertEnvironment(actor);
    if (actor.role !== 'client') throw new Error('مشاهده این نظرات فقط برای کارفرما مجاز است.');
    const all = storage.get<SurveyorReview[]>(this.key(KEYS.REVIEWS), this.seed(SEED_REVIEWS));
    return all.filter((r) => r.clientId === actor.userId);
  }

  async getReviewAggregate(surveyorId: string): Promise<ReviewAggregate> {
    const all = storage.get<SurveyorReview[]>(this.key(KEYS.REVIEWS), this.seed(SEED_REVIEWS));
    return computeReviewAggregate(surveyorId, all);
  }

  async submitReview(
    actor: RepositoryActor,
    review: Omit<SurveyorReview, 'id' | 'createdAt' | 'createdAtJalali' | 'environment' | 'isApproved' | 'isReported'>
  ): Promise<SurveyorReview> {
    this.assertEnvironment(actor);
    if (actor.role !== 'client' || actor.userId !== review.clientId) throw new Error('ثبت نظر فقط برای کارفرمای واردشده مجاز است.');
    if (review.clientId === review.surveyorId) throw new Error('امتیازدهی به خود مجاز نیست.');
    if (!review.selectionId) throw new Error('نظر باید به یک همکاری انجام‌شده متصل باشد.');
    const ratings = [review.overallRating, review.ratings.accuracy, review.ratings.punctuality, review.ratings.communication, review.ratings.pricingFairness];
    if (ratings.some((value) => !Number.isInteger(value) || value < 1 || value > 5)) {
      throw new Error('امتیاز باید عدد صحیح بین ۱ تا ۵ باشد.');
    }
    const selections = storage.get<SurveyorSelection[]>(this.key(KEYS.SELECTIONS), this.seed(SEED_SELECTIONS));
    const selection = selections.find((item) => item.id === review.selectionId);
    if (!selection || selection.clientId !== actor.userId || selection.surveyorId !== review.surveyorId || selection.status !== 'completed') {
      throw new Error('امتیاز فقط پس از وضعیت همکاری انجام‌شده مجاز است.');
    }
    const all = storage.get<SurveyorReview[]>(this.key(KEYS.REVIEWS), this.seed(SEED_REVIEWS));
    if (all.some((item) => item.selectionId === review.selectionId && item.isApproved)) {
      throw new Error('برای هر همکاری فقط یک نظر فعال قابل ثبت است.');
    }
    const now = new Date();
    const jalaliDate = toJalaliDate(now);

    const newRev: SurveyorReview = {
      ...review,
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isApproved: true,
      isReported: false,
      createdAtJalali: jalaliDate,
      createdAt: now.toISOString(),
      environment: this.environment,
    };

    all.unshift(newRev);
    storage.set(this.key(KEYS.REVIEWS), all);

    // Update aggregate on profile
    const agg = computeReviewAggregate(review.surveyorId, all);
    const profilesRepo = new DemoSurveyorProfilesRepository(this.environment);
    await profilesRepo.updateRatingAggregate(review.surveyorId, agg.averageRating, agg.totalReviews);

    return newRev;
  }

  async replyToReview(reviewId: string, replyText: string, replyDateJalali: string): Promise<SurveyorReview> {
    const all = storage.get<SurveyorReview[]>(this.key(KEYS.REVIEWS), this.seed(SEED_REVIEWS));
    const index = all.findIndex((r) => r.id === reviewId);
    if (index === -1) throw new Error('دیدگاه یافت نشد');

    all[index].surveyorReply = {
      text: replyText,
      replyDateJalali,
    };
    storage.set(this.key(KEYS.REVIEWS), all);
    return all[index];
  }

  async reportReview(reviewId: string, reason: string): Promise<SurveyorReview> {
    const all = storage.get<SurveyorReview[]>(this.key(KEYS.REVIEWS), this.seed(SEED_REVIEWS));
    const index = all.findIndex((r) => r.id === reviewId);
    if (index === -1) throw new Error('دیدگاه یافت نشد');

    all[index].isReported = true;
    all[index].reportReason = reason;
    storage.set(this.key(KEYS.REVIEWS), all);

    // Create auto report in ModerationRepo
    const modRepo = new DemoModerationRepository(this.environment);
    await modRepo.createReport({
      targetType: 'review',
      targetId: reviewId,
      reportedByUserId: all[index].surveyorId,
      reason: `گزارش بازبینی نظر: ${reason}`,
    });

    return all[index];
  }

  async moderateReview(actor: RepositoryActor, reviewId: string, isApproved: boolean, moderationNote?: string): Promise<SurveyorReview> {
    this.assertAdmin(actor);
    const all = storage.get<SurveyorReview[]>(this.key(KEYS.REVIEWS), this.seed(SEED_REVIEWS));
    const index = all.findIndex((r) => r.id === reviewId);
    if (index === -1) throw new Error('دیدگاه یافت نشد');

    all[index].isApproved = isApproved;
    if (moderationNote) {
      all[index].adminModerationNote = moderationNote;
    }
    storage.set(this.key(KEYS.REVIEWS), all);

    // Update aggregate
    const agg = computeReviewAggregate(all[index].surveyorId, all);
    const profilesRepo = new DemoSurveyorProfilesRepository(this.environment);
    await profilesRepo.updateRatingAggregate(all[index].surveyorId, agg.averageRating, agg.totalReviews);

    return all[index];
  }
}

// ---------------- 8. Moderation Repository ----------------

export class DemoModerationRepository extends Stage6RepositoryBase implements IModerationRepository {
  async getPendingReports(): Promise<ModerationReport[]> {
    const all = storage.get<ModerationReport[]>(this.key(KEYS.MODERATION_REPORTS), []);
    return all.filter((r) => r.status === 'pending');
  }

  async getAllReports(): Promise<ModerationReport[]> {
    return storage.get<ModerationReport[]>(this.key(KEYS.MODERATION_REPORTS), []);
  }

  async createReport(report: Omit<ModerationReport, 'id' | 'status' | 'createdAt' | 'environment'>): Promise<ModerationReport> {
    const all = storage.get<ModerationReport[]>(this.key(KEYS.MODERATION_REPORTS), []);
    const newRep: ModerationReport = {
      ...report,
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      environment: this.environment,
    };
    all.unshift(newRep);
    storage.set(this.key(KEYS.MODERATION_REPORTS), all);

    // Log action
    await this.logAction({
      action: 'REPORT_SUBMITTED',
      targetType: report.targetType,
      targetId: report.targetId,
      performedByUserId: report.reportedByUserId,
      details: `ثبت گزارش نظارتی به دلیل: ${report.reason}`,
    });

    return newRep;
  }

  async resolveReport(
    id: string,
    status: ModerationReport['status'],
    actionTaken?: ModerationReport['actionTaken'],
    adminNotes?: string
  ): Promise<ModerationReport> {
    const all = storage.get<ModerationReport[]>(this.key(KEYS.MODERATION_REPORTS), []);
    const index = all.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('گزارش نظارت یافت نشد');

    all[index].status = status;
    all[index].actionTaken = actionTaken;
    all[index].adminNotes = adminNotes;
    all[index].resolvedAt = new Date().toISOString();
    storage.set(this.key(KEYS.MODERATION_REPORTS), all);

    await this.logAction({
      action: `REPORT_RESOLVED_${status.toUpperCase()}`,
      targetType: all[index].targetType,
      targetId: all[index].targetId,
      performedByUserId: 'admin-demo',
      details: `رسیدگی به گزارش با وضعیت ${status} و اقدام ${actionTaken || 'بدون اقدام'}. توضیحات: ${adminNotes || '-'}`,
    });

    return all[index];
  }

  async getAuditLogs(): Promise<ModerationAuditLog[]> {
    return storage.get<ModerationAuditLog[]>(this.key(KEYS.MODERATION_LOGS), []);
  }

  async logAction(log: Omit<ModerationAuditLog, 'id' | 'timestamp' | 'environment'>): Promise<ModerationAuditLog> {
    const all = storage.get<ModerationAuditLog[]>(this.key(KEYS.MODERATION_LOGS), []);
    const newLog: ModerationAuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      environment: this.environment,
    };
    all.unshift(newLog);
    storage.set(this.key(KEYS.MODERATION_LOGS), all);
    return newLog;
  }
}

// ---------------- 9. Delegated Permissions Repository ----------------

export class DemoDelegatedPermissionsRepository extends Stage6RepositoryBase implements IDelegatedPermissionsRepository {
  async getPermissionsForUser(userId: string): Promise<DelegatedAdminPermission | null> {
    const all = storage.get<DelegatedAdminPermission[]>(this.key(KEYS.DELEGATED_PERMS), []);
    const found = all.find((p) => p.userId === userId);
    return found || null;
  }

  async grantPermissions(
    userId: string,
    grantedByUserId: string,
    permissions: DelegatedAdminPermission['permissions']
  ): Promise<DelegatedAdminPermission> {
    const all = storage.get<DelegatedAdminPermission[]>(this.key(KEYS.DELEGATED_PERMS), []);
    const index = all.findIndex((p) => p.userId === userId);

    let record: DelegatedAdminPermission;
    if (index >= 0) {
      all[index].permissions = permissions;
      all[index].grantedByUserId = grantedByUserId;
      all[index].grantedAt = new Date().toISOString();
      record = all[index];
    } else {
      record = {
        id: `perm-${Date.now()}`,
        userId,
        grantedByUserId,
        permissions,
        grantedAt: new Date().toISOString(),
        environment: this.environment,
      };
      all.push(record);
    }
    storage.set(this.key(KEYS.DELEGATED_PERMS), all);
    return record;
  }

  async revokePermissions(userId: string): Promise<boolean> {
    const all = storage.get<DelegatedAdminPermission[]>(this.key(KEYS.DELEGATED_PERMS), []);
    const filtered = all.filter((p) => p.userId !== userId);
    storage.set(this.key(KEYS.DELEGATED_PERMS), filtered);
    return filtered.length < all.length;
  }
}
