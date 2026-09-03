import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  User,
  MapPin,
  Award,
  Sparkles,
  CheckCircle2,
  FileBadge2,
  Globe,
  Briefcase,
  GraduationCap,
  Layers,
  Coins,
  MessageSquare,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { LoadingState } from '../../components/ui/LoadingState';
import { User as UserModel } from '../../models/User';
import { Profile } from '../../models/Profile';
import { SurveyorPublicProfile } from '../../models/Stage6Models';
import { profileRepository, surveyorProfilesRepository } from '../../repositories';
import { formatPhoneNumber } from '../../utils/formatters';
import { getProfileRequirements } from '../../utils/profileRequirements';
import { getErrorMessage } from '../../utils/errors';
import { SurveyorPublicProfileEditor } from './SurveyorPublicProfileEditor';
import { SurveyorResumeManager } from './SurveyorResumeManager';
import { SurveyorCredentialsManager } from './SurveyorCredentialsManager';
import { SurveyorPortfolioManager } from './SurveyorPortfolioManager';
import { SurveyorPublishedPricesManager } from './SurveyorPublishedPricesManager';
import { SurveyorReviewsManager } from './SurveyorReviewsManager';
import { SurveyorPublicProfileModal } from '../client/SurveyorPublicProfileModal';

export interface ProfileViewProps {
  user: UserModel;
  onProfileUpdated?: () => void;
}

type ProfileTab =
  | 'base_identity'
  | 'public_profile'
  | 'resume'
  | 'credentials'
  | 'portfolio'
  | 'prices'
  | 'reviews';

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onProfileUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('base_identity');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [publicProfile, setPublicProfile] = useState<SurveyorPublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Editable fields for base identity
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [companyRegistrationNumber, setCompanyRegistrationNumber] = useState('');
  const [economicCode, setEconomicCode] = useState('');
  const [engineerLicenseNumber, setEngineerLicenseNumber] = useState('');
  const [judicialExpertNumber, setJudicialExpertNumber] = useState('');

  const isLegal = user.entityType === 'legal';
  const isSurveyor = user.role === 'surveyor';

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const [p, pubP] = await Promise.all([
        profileRepository.getProfile(user.id),
        surveyorProfilesRepository.getProfileByUserId(user.id, { userId: user.id, role: user.role, environment: 'demo' }),
      ]);
      setProfile(p);
      setPublicProfile(pubP);
      setProvince(p.province || 'یزد');
      setCity(p.city || 'یزد');
      setCompanyRegistrationNumber(p.companyRegistrationNumber || '');
      setEconomicCode(p.economicCode || '');
      setEngineerLicenseNumber(p.engineerLicenseNumber || '');
      setJudicialExpertNumber(p.judicialExpertNumber || '');
    } catch (e: unknown) {
      setSaveErrorMessage(getErrorMessage(e, 'خطا در دریافت اطلاعات پرونده'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);
    try {
      const updated = await profileRepository.updateProfile(user.id, {
        province,
        city,
        companyRegistrationNumber,
        economicCode,
        engineerLicenseNumber,
        judicialExpertNumber,
      });
      setProfile(updated);
      setSaveSuccessMessage('اطلاعات پرونده با موفقیت در مخزن آزمایشی ذخیره شد.');
      if (onProfileUpdated) onProfileUpdated();
    } catch (e: unknown) {
      setSaveErrorMessage(getErrorMessage(e, 'خطا در ذخیره‌سازی مشخصات پرونده'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDemoCompleteness = async () => {
    setIsSaving(true);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);
    try {
      const toggled = await profileRepository.toggleCompletionForTesting(user.id);
      setProfile(toggled);
      setProvince(toggled.province || 'یزد');
      setCity(toggled.city || 'یزد');
      setEngineerLicenseNumber(toggled.engineerLicenseNumber || '');
      setSaveSuccessMessage(
        toggled.isComplete
          ? 'وضعیت پرونده به «تکمیل شده (۱۰۰٪)» تغییر یافت. اکنون تمام گزینه‌های قرارداد داخلی و فاکتور فعال هستند.'
          : 'وضعیت پرونده به «ناقص» بازگردانده شد. گزینه‌های قرارداد و فاکتور قفل می‌باشند.'
      );
      if (onProfileUpdated) onProfileUpdated();
    } catch (e: unknown) {
      setSaveErrorMessage(getErrorMessage(e, 'خطا در تغییر وضعیت آزمایشی پرونده'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPreview = async () => {
    let pub = publicProfile;
    if (!pub) {
      pub = await surveyorProfilesRepository.getProfileByUserId(user.id, { userId: user.id, role: user.role, environment: 'demo' });
      setPublicProfile(pub);
    }
    setIsPreviewOpen(true);
  };

  if (isLoading || !profile) {
    return <LoadingState message="در حال بارگذاری اطلاعات پرونده مهندسی..." className="py-20" />;
  }

  const evaluation = getProfileRequirements(user, profile);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto" dir="rtl">

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0B1D35] text-white flex items-center justify-center font-bold">
            {isLegal ? <Building2 className="w-6 h-6 text-teal-300" /> : <User className="w-6 h-6 text-teal-300" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-slate-900 text-base sm:text-lg">
                {user.fullName}
              </h2>
              <Badge variant={evaluation.isComplete ? 'success' : 'warning'} size="sm">
                {evaluation.isComplete ? 'پرونده کامل' : 'پرونده ناقص'}
              </Badge>
              {isSurveyor && (
                <Badge variant="accent" size="sm">
                  پنل مدیریت مهندس نقشه‌بردار
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              شماره تماس: {formatPhoneNumber(user.phone)} • {user.role === 'surveyor' ? 'مهندس نقشه‌بردار' : 'کارفرما'}
              {isLegal && user.representativeName ? ` • نماینده: ${user.representativeName}` : ''}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isSurveyor && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenPreview}
              rightIcon={<Eye className="w-4 h-4 text-teal-600" />}
            >
              دید کارفرما از پروفایل من
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleDemoCompleteness}
            isLoading={isSaving}
            rightIcon={<Sparkles className="w-4 h-4 text-teal-600" />}
          >
            {evaluation.isComplete ? 'تغییر به حالت ناقص' : 'تکمیل خودکار ۱۰۰٪'}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs (Stage 6 Multi-Tab Subsystem) */}
      {isSurveyor && (
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto text-xs sm:text-sm font-semibold select-none">
          <button
            onClick={() => setActiveTab('base_identity')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'base_identity'
                ? 'bg-white text-[#0B1D35] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            مشخصات پایه
          </button>

          <button
            onClick={() => setActiveTab('public_profile')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'public_profile'
                ? 'bg-white text-[#0B1D35] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            ویترین عمومی و بیوگرافی
          </button>

          <button
            onClick={() => setActiveTab('credentials')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'bg-white text-[#0B1D35] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-teal-600" />
            پروانه‌ها و مدارک
          </button>

          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'portfolio'
                ? 'bg-white text-[#0B1D35] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            نمونه‌کارهای شاخص
          </button>

          <button
            onClick={() => setActiveTab('prices')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'prices'
                ? 'bg-white text-[#0B1D35] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-teal-600" />
            تعرفه‌های منتشرشده
          </button>

          <button
            onClick={() => setActiveTab('resume')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'resume'
                ? 'bg-white text-[#0B1D35] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
            سوابق شغلی و تحصیلی
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'bg-white text-[#0B1D35] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
            نظرات و امتیازات
          </button>
        </div>
      )}

      {/* Tab 1: Base Legal & Identity Profile */}
      {activeTab === 'base_identity' && (
        <div className="space-y-6">
          {/* Completion Progress Banner */}
          <Card variant="engineering" className="bg-gradient-to-r from-slate-50 to-white">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    وضعیت تکمیل مشخصات پایه و هویتی
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {evaluation.isComplete
                      ? 'تمامی اطلاعات اجباری جهت صدور پیش‌نویس قرارداد داخلی و پیش‌فاکتور تکمیل شده است.'
                      : `جهت فعال‌سازی قرارداد و فاکتور، فیلدهای اجباری زیر را تکمیل فرمایید (${evaluation.missingItems.length} مورد باقی‌مانده).`}
                  </p>
                </div>
                <span className="font-mono font-bold text-sm text-[#0B1D35]">
                  ٪{evaluation.completionPercentage}
                </span>
              </div>

              <ProgressBar
                percentage={evaluation.completionPercentage}
                color={evaluation.isComplete ? 'emerald' : 'amber'}
                size="md"
                showPercentText={false}
              />

              {!evaluation.isComplete && evaluation.missingItems.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {evaluation.missingItems.map((item) => (
                    <span
                      key={item.key}
                      className="bg-amber-100/90 text-amber-900 text-[11px] px-2.5 py-0.5 rounded-md font-medium"
                    >
                      نیازمند تکمیل: {item.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {saveSuccessMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {saveErrorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
              <span>{saveErrorMessage}</span>
            </div>
          )}

          {/* Profile Form */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-600" />
                <span>مشخصات پایه حرفه‌ای</span>
              </CardTitle>
              <Badge variant="demo" size="sm">ذخیره در دیتابیس آزمایشی</Badge>
            </CardHeader>

            <form onSubmit={handleSave} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Location: Province */}
                <Input
                  label="استان محل استقرار / فعالیت *"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="مثال: یزد"
                  rightIcon={<MapPin className="w-4 h-4" />}
                  helperText="فیلد اجباری جهت تعیین موقعیت جغرافیایی"
                />

                {/* Location: City */}
                <Input
                  label="شهرستان *"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="مثال: یزد"
                  rightIcon={<MapPin className="w-4 h-4" />}
                  helperText="فیلد اجباری جهت صدور اسناد داخلی"
                />

                {/* Optional Legal Fields */}
                {isLegal ? (
                  <>
                    <Input
                      label="شماره ثبت شرکت (اختیاری)"
                      value={companyRegistrationNumber}
                      onChange={(e) => setCompanyRegistrationNumber(e.target.value)}
                      placeholder="در صورت وجود"
                      dir="ltr"
                      className="font-mono text-center"
                    />

                    <Input
                      label="کد اقتصادی (اختیاری)"
                      value={economicCode}
                      onChange={(e) => setEconomicCode(e.target.value)}
                      placeholder="در صورت وجود"
                      dir="ltr"
                      className="font-mono text-center"
                    />

                    <Input
                      label="شماره پروانه نظام مهندسی حقوقی (اختیاری)"
                      value={engineerLicenseNumber}
                      onChange={(e) => setEngineerLicenseNumber(e.target.value)}
                      placeholder="در صورت دارا بودن پروانه حقوقی"
                      dir="ltr"
                      className="font-mono text-center"
                      rightIcon={<FileBadge2 className="w-4 h-4" />}
                    />
                  </>
                ) : (
                  <>
                    {/* Optional Individual Fields */}
                    <Input
                      label="شماره پروانه اشتغال نظام مهندسی (اختیاری)"
                      value={engineerLicenseNumber}
                      onChange={(e) => setEngineerLicenseNumber(e.target.value)}
                      placeholder="مثال: ن-۲۴۸۸۹-یزد"
                      dir="ltr"
                      className="font-mono text-center"
                      rightIcon={<FileBadge2 className="w-4 h-4" />}
                      helperText="در این مرحله اختیاری می‌باشد"
                    />

                    <Input
                      label="شماره کارشناسی رسمی دادگستری (اختیاری)"
                      value={judicialExpertNumber}
                      onChange={(e) => setJudicialExpertNumber(e.target.value)}
                      placeholder="در صورت دارا بودن"
                      dir="ltr"
                      className="font-mono text-center"
                    />
                  </>
                )}

              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSaving}
                  rightIcon={<ShieldCheck className="w-4 h-4 text-teal-400" />}
                >
                  ذخیره و به‌روزرسانی مشخصات پرونده
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Tab 2: Public Profile Editor */}
      {activeTab === 'public_profile' && (
        <SurveyorPublicProfileEditor
          user={user}
          onPreviewPublic={handleOpenPreview}
        />
      )}

      {/* Tab 3: Credentials */}
      {activeTab === 'credentials' && (
        <SurveyorCredentialsManager user={user} />
      )}

      {/* Tab 4: Portfolio */}
      {activeTab === 'portfolio' && (
        <SurveyorPortfolioManager user={user} />
      )}

      {/* Tab 5: Published Prices */}
      {activeTab === 'prices' && (
        <SurveyorPublishedPricesManager user={user} />
      )}

      {/* Tab 6: Resume */}
      {activeTab === 'resume' && (
        <SurveyorResumeManager user={user} />
      )}

      {/* Tab 7: Reviews */}
      {activeTab === 'reviews' && (
        <SurveyorReviewsManager user={user} />
      )}

      {/* Preview Modal */}
      {publicProfile && (
        <SurveyorPublicProfileModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          profile={publicProfile}
          clientUser={user}
          onOpenSelectionModal={() => {}}
          onOpenReviewModal={() => {}}
        />
      )}

    </div>
  );
};
