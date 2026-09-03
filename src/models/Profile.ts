export interface Profile {
  id: string;
  userId: string;
  completionPercentage: number;
  isComplete: boolean;
  province?: string;
  city?: string;
  companyRegistrationNumber?: string; // شماره ثبت شرکت
  economicCode?: string; // کد اقتصادی
  engineerLicenseNumber?: string; // شماره پروانه نظام مهندسی
  judicialExpertNumber?: string; // شماره کارشناسی رسمی دادگستری
  updatedAt: string;
  environment: 'demo';
}
