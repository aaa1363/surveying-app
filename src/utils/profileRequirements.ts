import { User } from '../models/User';
import { Profile } from '../models/Profile';

export interface ProfileRequirementItem {
  key: string;
  label: string;
  isSatisfied: boolean;
  isOptional?: boolean;
}

export interface ProfileEvaluation {
  requiredItems: ProfileRequirementItem[];
  missingItems: ProfileRequirementItem[];
  optionalItems: ProfileRequirementItem[];
  isComplete: boolean;
  completionPercentage: number;
}

/** Stage 6 never requires or persists national ID, exact address or IBAN. */
export function getProfileRequirements(user: User, profile: Profile): ProfileEvaluation {
  const isLegal = user.entityType === 'legal';
  const requiredItems: ProfileRequirementItem[] = [
    {
      key: isLegal ? 'companyName' : 'fullName',
      label: isLegal ? 'نام شرکت / مهندسین مشاور' : 'نام و نام خانوادگی',
      isSatisfied: Boolean((isLegal ? user.companyName || user.fullName : user.fullName)?.trim()),
    },
    {
      key: 'phone',
      label: isLegal ? 'شماره موبایل نماینده' : 'شماره تلفن همراه',
      isSatisfied: Boolean(user.phone?.trim().length >= 11),
    },
    {
      key: 'location',
      label: 'استان و شهر محل فعالیت',
      isSatisfied: Boolean(profile.province?.trim() && profile.city?.trim()),
    },
  ];
  if (isLegal) {
    requiredItems.splice(1, 0, {
      key: 'representativeName',
      label: 'نام و نام خانوادگی نماینده',
      isSatisfied: Boolean(user.representativeName?.trim()),
    });
  }

  const optionalItems: ProfileRequirementItem[] = [
    { key: 'engineerLicenseNumber', label: 'شماره پروانه ثبت‌شده (اختیاری)', isSatisfied: Boolean(profile.engineerLicenseNumber?.trim()), isOptional: true },
    { key: 'judicialExpertNumber', label: 'شماره مدرک حرفه‌ای ثبت‌شده (اختیاری)', isSatisfied: Boolean(profile.judicialExpertNumber?.trim()), isOptional: true },
  ];
  if (isLegal) {
    optionalItems.push(
      { key: 'companyRegistrationNumber', label: 'شماره ثبت شرکت (اختیاری)', isSatisfied: Boolean(profile.companyRegistrationNumber?.trim()), isOptional: true },
      { key: 'economicCode', label: 'کد اقتصادی (اختیاری)', isSatisfied: Boolean(profile.economicCode?.trim()), isOptional: true },
    );
  }

  const missingItems = requiredItems.filter((item) => !item.isSatisfied);
  const completionPercentage = Math.round(((requiredItems.length - missingItems.length) / requiredItems.length) * 100);
  return { requiredItems, missingItems, optionalItems, isComplete: missingItems.length === 0, completionPercentage };
}
