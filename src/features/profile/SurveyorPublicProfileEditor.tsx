import React, { useState, useEffect } from 'react';
import { UserCheck, Globe, MapPin, Briefcase, Phone, Mail, Sparkles, CheckCircle2, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { User } from '../../models/User';
import { SurveyorPublicProfile } from '../../models/Stage6Models';
import { surveyorProfilesRepository } from '../../repositories';

export interface SurveyorPublicProfileEditorProps {
  user: User;
  onPreviewPublic?: () => void;
}

export const SurveyorPublicProfileEditor: React.FC<SurveyorPublicProfileEditorProps> = ({
  user,
  onPreviewPublic,
}) => {
  const [profile, setProfile] = useState<SurveyorPublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [serviceAreasStr, setServiceAreasStr] = useState('');
  const [specialtiesStr, setSpecialtiesStr] = useState('');
  const [experienceYears, setExperienceYears] = useState(5);
  const [isPublic, setIsPublic] = useState(true);
  const [phone, setPhone] = useState(user.phone || '');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      let p = await surveyorProfilesRepository.getProfileByUserId(user.id, { userId: user.id, role: user.role, environment: 'demo' });
      if (!p) {
        p = await surveyorProfilesRepository.saveProfile({
          userId: user.id,
          fullName: user.fullName,
          title: user.role === 'surveyor' ? 'مهندس نقشه‌بردار ارشد' : 'کارشناس نقشه‌برداری',
          province: 'یزد',
          city: 'یزد',
          phone: user.phone,
        });
      }
      setProfile(p);
      setTitle(p.title || '');
      setBio(p.bio || '');
      setProvince(p.province || 'یزد');
      setCity(p.city || 'یزد');
      setServiceAreasStr(p.serviceAreas ? p.serviceAreas.join('، ') : '');
      setSpecialtiesStr(p.specialties ? p.specialties.join('، ') : '');
      setExperienceYears(p.experienceYears || 5);
      setIsPublic(p.isPublic !== undefined ? p.isPublic : true);
      setPhone(p.phone || user.phone || '');
      setEmail(p.email || '');
      setWebsite(p.website || '');
    } catch (e) {
      console.error('Failed to load public profile:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    try {
      const serviceAreas = serviceAreasStr
        .split(/[،,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const specialties = specialtiesStr
        .split(/[،,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const saved = await surveyorProfilesRepository.saveProfile({
        userId: user.id,
        fullName: user.fullName,
        title,
        bio,
        province,
        city,
        serviceAreas: serviceAreas.length ? serviceAreas : [city || 'یزد'],
        specialties: specialties.length ? specialties : ['نقشه UTM سند'],
        experienceYears: Number(experienceYears) || 1,
        isPublic,
        phone,
        email: email || undefined,
        website: website || undefined,
      });

      setProfile(saved);
      setSuccessMessage('پروفایل عمومی و رزومه شما با موفقیت به‌روزرسانی شد.');
    } catch (e) {
      console.error('Failed to save public profile:', e);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center text-sm text-slate-500">در حال دریافت اطلاعات پروفایل عمومی...</div>;
  }

  return (
    <div className="space-y-5" dir="rtl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#0B1D35] to-[#1E3A8A] text-white p-4 sm:p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <Globe className="w-6 h-6 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg">ویترین و پروفایل عمومی نقشه‌بردار</h3>
              <Badge variant={isPublic ? 'success' : 'warning'} size="sm">
                {isPublic ? 'منتشرشده در پنل کارفرمایان' : 'خصوصی / عدم انتشار'}
              </Badge>
              {profile?.isVerified && (
                <Badge variant="accent" size="sm">
                  مدارک ثبت‌شده — بررسی نمایشی
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              اطلاعات این بخش برای کارفرمایان متقاضی خدمات نقشه‌برداری در سراسر استان قابل جستجو و مشاهده است.
            </p>
          </div>
        </div>

        {onPreviewPublic && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviewPublic}
            className="border-white/30 text-white hover:bg-white/10"
            rightIcon={<Eye className="w-4 h-4 text-teal-300" />}
          >
            پیش‌نمایش دید کارفرما
          </Button>
        )}
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form */}
      <Card variant="default">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-teal-600" />
            <span>مشخصات حرفه‌ای، تخصص‌ها و حوزه فعالیت</span>
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Title / Headline */}
            <div className="sm:col-span-2">
              <Input
                label="عنوان حرفه‌ای / تیتر معرفی *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: مهندس نقشه‌بردار ارشد - کارشناس رسمی امور ثبتی و فتوگرامتری پهپاد"
                helperText="این تیتر در کارت‌های جستجوی کارفرمایان برجسته نمایش داده می‌شود."
                required
              />
            </div>

            {/* Experience Years */}
            <Input
              label="سابقه کار تخصصی (سال) *"
              type="number"
              min={1}
              max={50}
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              helperText="تعداد سال‌های فعالیت اجرایی و مهندسی"
              required
            />

            {/* Public Visibility Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                وضعیت انتشار در بانک نقشه‌برداران
              </label>
              <div className="flex items-center gap-3 h-10 px-3 border border-slate-200 rounded-xl bg-slate-50">
                <input
                  type="checkbox"
                  id="isPublicToggle"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="isPublicToggle" className="text-xs text-slate-800 cursor-pointer select-none">
                  پروفایل برای کارفرمایان عمومی فعال و قابل استعلام باشد
                </label>
              </div>
            </div>

            {/* Province */}
            <Input
              label="استان اصلی فعالیت *"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="مثال: یزد"
              rightIcon={<MapPin className="w-4 h-4" />}
              required
            />

            {/* City */}
            <Input
              label="شهرستان مرکز استقرار *"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="مثال: یزد"
              rightIcon={<MapPin className="w-4 h-4" />}
              required
            />

            {/* Service Areas */}
            <div className="sm:col-span-2">
              <Input
                label="حوزه جغرافیایی و شهرهای تحت پوشش (با ویرگول جدا کنید)"
                value={serviceAreasStr}
                onChange={(e) => setServiceAreasStr(e.target.value)}
                placeholder="مثال: یزد، میبد، اردکان، تفت، مهریز، اشکذر"
                helperText="شهرهایی که آمادگی اعزام اکیپ و اجرای پروژه در آن‌ها را دارید."
              />
            </div>

            {/* Specialties */}
            <div className="sm:col-span-2">
              <Input
                label="تخصص‌ها و حوزه‌های کلیدی (با ویرگول جدا کنید)"
                value={specialtiesStr}
                onChange={(e) => setSpecialtiesStr(e.target.value)}
                placeholder="مثال: نقشه UTM سند، فتوگرامتری پهپاد، تفکیک اراضی، مانیتورینگ گود، کارشناسی ثبتی ماده ۱۴۷"
                helperText="تگ‌های مهارتی برای فیلتر و جستجوی کارفرما"
              />
            </div>

            {/* Bio / About */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                درباره من / بیوگرافی و معرفی سوابق کاری
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="شرحی از تجربیات، تجهیزات مورد استفاده، سوابق همکاری با ارگان‌ها یا شرکت‌ها..."
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1D35] focus:border-[#0B1D35] outline-hidden transition-all text-slate-800 leading-relaxed"
              />
            </div>

            {/* Public Contact Details */}
            <Input
              label="شماره تماس مستقیم (جهت استعلام تلفنی کارفرما) *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09131234567"
              dir="ltr"
              rightIcon={<Phone className="w-4 h-4" />}
              className="font-mono text-center"
              required
            />

            <Input
              label="ایمیل عمومی (اختیاری)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              dir="ltr"
              rightIcon={<Mail className="w-4 h-4" />}
              className="font-mono text-center"
            />

            <div className="sm:col-span-2">
              <Input
                label="آدرس وب‌سایت یا لینک شبکه‌های حرفه‌ای (اختیاری)"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="www.my-surveying.ir"
                dir="ltr"
                rightIcon={<Globe className="w-4 h-4" />}
                className="font-mono"
              />
            </div>

          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              rightIcon={<Sparkles className="w-4 h-4 text-teal-400" />}
            >
              ذخیره مشخصات پروفایل عمومی
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
