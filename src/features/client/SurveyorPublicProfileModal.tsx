import React, { useState, useEffect } from 'react';
import {
  Star,
  ShieldCheck,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  Globe,
  Award,
  GraduationCap,
  Layers,
  Coins,
  MessageSquare,
  Clock,
  CheckCircle2,
  Send,
  CornerDownLeft,
  Calendar,
  Wrench,
  Lock,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { User } from '../../models/User';
import {
  SurveyorPublicProfile,
  SurveyorResumeItem,
  SurveyorCredential,
  PortfolioItem,
  PublishedPriceCard,
  SurveyorReview,
  ReviewAggregate,
} from '../../models/Stage6Models';
import {
  surveyorProfilesRepository,
  surveyorResumeRepository,
  credentialsRepository,
  portfolioRepository,
  publishedPricesRepository,
  surveyorReviewsRepository,
} from '../../repositories';
import { formatPhoneNumber, formatToman, toPersianDigits } from '../../utils/formatters';

export interface SurveyorPublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SurveyorPublicProfile | null;
  clientUser: User;
  onOpenSelectionModal: (profile: SurveyorPublicProfile, priceCard?: PublishedPriceCard) => void;
  onOpenReviewModal: (profile: SurveyorPublicProfile) => void;
}

type ProfileTab = 'overview' | 'credentials' | 'resume' | 'portfolio' | 'prices' | 'reviews';

export const SurveyorPublicProfileModal: React.FC<SurveyorPublicProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  clientUser,
  onOpenSelectionModal,
  onOpenReviewModal,
}) => {
  const [currentProfile, setCurrentProfile] = useState<SurveyorPublicProfile | null>(profile);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [resumes, setResumes] = useState<SurveyorResumeItem[]>([]);
  const [credentials, setCredentials] = useState<SurveyorCredential[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [prices, setPrices] = useState<PublishedPriceCard[]>([]);
  const [reviews, setReviews] = useState<SurveyorReview[]>([]);
  const [aggregate, setAggregate] = useState<ReviewAggregate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!profile) {
      return;
    }
    setCurrentProfile(profile);
    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        const [freshProfile, resList, credList, portList, priceList, revList, agg] = await Promise.all([
          surveyorProfilesRepository.getProfileByUserId(profile.userId, { userId: clientUser.id, role: 'client', environment: 'demo' }),
          surveyorResumeRepository.getItemsByUserId(profile.userId),
          credentialsRepository.getCredentialsByUserId(profile.userId, true),
          portfolioRepository.getItemsByUserId(profile.userId),
          publishedPricesRepository.getPriceCardsByUserId(profile.userId, true),
          surveyorReviewsRepository.getReviewsForSurveyor(profile.userId, { userId: clientUser.id, role: 'client', environment: 'demo' }, false),
          surveyorReviewsRepository.getReviewAggregate(profile.userId),
        ]);
        if (freshProfile) {
          setCurrentProfile(freshProfile);
        }
        setResumes(resList);
        setCredentials(credList);
        setPortfolio(portList);
        setPrices(priceList);
        setReviews(revList);
        setAggregate(agg);
      } catch (e) {
        console.error('Failed to load full public profile data:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [profile, clientUser.id, clientUser.role]);

  const activeProfile = currentProfile || profile;
  if (!activeProfile) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <div dir="rtl" className="space-y-6 -mt-2 pb-2">
        
        {/* Profile Header Hero */}
        <div className="bg-gradient-to-br from-[#0B1D35] via-[#11294D] to-[#1E3A8A] text-white p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                {activeProfile.fullName.charAt(0)}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-2xl font-black text-white">
                    {activeProfile.fullName}
                  </h2>
                  {activeProfile.isVerified && (
                    <span className="bg-teal-500/20 text-teal-300 border border-teal-400/40 text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                      مدارک ثبت‌شده — بررسی نمایشی
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  {activeProfile.title}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-300 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-300" />
                    {activeProfile.province} - {activeProfile.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-teal-300" />
                    {toPersianDigits(activeProfile.experienceYears)} سال سابقه فعالیت مهندسی
                  </span>
                </div>
              </div>
            </div>

            {/* Overall Rating & Contact Action */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 sm:gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
              <div className="flex items-center gap-1.5 bg-amber-400/20 border border-amber-300/30 text-amber-200 px-3 py-1 rounded-xl text-xs font-bold">
                <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span className="font-mono text-sm">{activeProfile.ratingAverage.toFixed(1)}</span>
                <span className="text-[11px] opacity-80">({toPersianDigits(activeProfile.reviewCount)} نظر)</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {activeProfile.phone ? (
                  <a
                    href={`tel:${activeProfile.phone}`}
                    className="bg-white text-[#0B1D35] hover:bg-slate-100 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                    dir="ltr"
                  >
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                    <span>{formatPhoneNumber(activeProfile.phone)}</span>
                  </a>
                ) : (
                  <div
                    className="bg-white/10 border border-white/20 text-teal-200 px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                    title="شماره تماس پس از ثبت درخواست استعلام نمایش داده می‌شود."
                  >
                    <Lock className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span className="text-[11px] font-medium">
                      {activeProfile.phoneMaskedNotice || 'شماره تماس پس از ثبت درخواست استعلام نمایش داده می‌شود.'}
                    </span>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onOpenSelectionModal(activeProfile)}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
                  rightIcon={<Send className="w-3.5 h-3.5" />}
                >
                  ثبت استعلام
                </Button>
              </div>
            </div>

          </div>

          {/* Specialties Pills */}
          {activeProfile.specialties && activeProfile.specialties.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-white/10">
              <span className="text-[11px] text-slate-300 font-medium">حوزه‌های تخصصی:</span>
              {activeProfile.specialties.map((spec, i) => (
                <span
                  key={i}
                  className="bg-white/10 text-teal-200 text-[11px] px-2.5 py-0.5 rounded-lg font-medium border border-white/10"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs sm:text-sm font-semibold select-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#0B1D35] text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            معرفی و بیوگرافی
          </button>

          <button
            onClick={() => setActiveTab('prices')}
            className={`px-3 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'prices'
                ? 'bg-[#0B1D35] text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            تعرفه‌ها و خدمات ({toPersianDigits(prices.length)})
          </button>

          <button
            onClick={() => setActiveTab('credentials')}
            className={`px-3 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'bg-[#0B1D35] text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            پروانه‌ها و مدارک ({toPersianDigits(credentials.length)})
          </button>

          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-3 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'portfolio'
                ? 'bg-[#0B1D35] text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            نمونه‌کارها ({toPersianDigits(portfolio.length)})
          </button>

          <button
            onClick={() => setActiveTab('resume')}
            className={`px-3 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'resume'
                ? 'bg-[#0B1D35] text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            سوابق ({toPersianDigits(resumes.length)})
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-3 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'bg-[#0B1D35] text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            نظرات ({toPersianDigits(reviews.length)})
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <Card variant="default" className="p-5 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-teal-600" />
                <span>درباره مهندس نقشه‌بردار و معرفی توانمندی‌ها</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {activeProfile.bio || 'توضیحات تکمیلی توسط نقشه‌بردار ثبت نشده است.'}
              </p>
            </Card>

            {/* Service Areas & Contact Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card variant="default" className="p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  شهرهای تحت پوشش و امکان اعزام اکیپ
                </h4>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeProfile.serviceAreas && activeProfile.serviceAreas.map((area, i) => (
                    <span key={i} className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-lg">
                      {area}
                    </span>
                  ))}
                </div>
              </Card>

              <Card variant="default" className="p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-teal-600" />
                  راه‌های ارتباط مستقیم
                </h4>
                <div className="text-xs text-slate-600 space-y-2 pt-1">
                  {activeProfile.phone ? (
                    <div>شماره تماس مستقیم: <a href={`tel:${activeProfile.phone}`} className="font-mono font-bold text-[#0B1D35] hover:text-teal-700 hover:underline" dir="ltr">{formatPhoneNumber(activeProfile.phone)}</a></div>
                  ) : (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2 font-medium">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{activeProfile.phoneMaskedNotice || 'شماره تماس پس از ثبت درخواست استعلام نمایش داده می‌شود.'}</span>
                    </div>
                  )}
                  {activeProfile.email && <div>ایمیل: <span className="font-mono text-slate-800">{activeProfile.email}</span></div>}
                  {activeProfile.website && <div>وب‌سایت: <span className="font-mono text-slate-800">{activeProfile.website}</span></div>}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: Published Price Cards */}
        {activeTab === 'prices' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                تعرفه‌های شفاف و پکیج‌های خدمات ارائه‌شده
              </h3>
              <Badge variant="demo" size="sm">
                قیمت‌ها به تومان
              </Badge>
            </div>

            {prices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                تعرفه‌ای برای این نقشه‌بردار ثبت نشده است. برای استعلام قیمت می‌توانید مستقیماً درخواست استعلام ثبت نمایید.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prices.map((card) => (
                  <Card key={card.id} variant="default" className="p-4 flex flex-col justify-between hover:border-slate-300">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{card.title}</h4>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          دسته‌بندی: {card.serviceCategory} • واحد: {card.unit}
                        </span>
                      </div>

                      {/* Price Tag */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block">نرخ پایه:</span>
                          <span className="font-mono font-bold text-base text-[#0B1D35]">
                            {formatToman(card.basePrice)}
                          </span>
                        </div>
                        <div className="text-left text-[11px] text-teal-800 bg-teal-50 px-2 py-1 rounded-lg border border-teal-100 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-teal-600" />
                          <span>{card.estimatedTurnaround}</span>
                        </div>
                      </div>

                      {card.conditionsAndInclusions.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-700 block">شامل خدمات:</span>
                          <ul className="text-xs text-slate-600 space-y-1">
                            {card.conditionsAndInclusions.map((inc, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
                                <span>{inc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onOpenSelectionModal(activeProfile, card)}
                        rightIcon={<Send className="w-3.5 h-3.5" />}
                        className="w-full sm:w-auto text-xs"
                      >
                        درخواست استعلام این خدمت
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Credentials */}
        {activeTab === 'credentials' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              پروانه‌ها و گواهینامه‌های ثبت‌شده (بررسی نمایشی)
            </h3>

            {credentials.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                مدرکی در این بخش درج نشده است.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {credentials.map((cred) => (
                  <Card key={cred.id} variant="default" className="p-4 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{cred.title}</span>
                      {cred.isVerified && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          ثبت‌شده (بررسی نمایشی)
                        </span>
                      )}
                      {cred.gradeOrBase && <Badge variant="accent" size="sm">{cred.gradeOrBase}</Badge>}
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div>مرجع صادرکننده: <span className="font-semibold text-slate-800">{cred.issuer}</span></div>
                      <div className="font-mono text-slate-500 text-[11px]">
                        شماره پروانه: {cred.credentialNumber}
                        {cred.expiryDateJalali && ` • تاریخ اعتبار: ${cred.expiryDateJalali}`}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Portfolio */}
        {activeTab === 'portfolio' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              پروژه‌ها و نمونه کارهای شاخص انجام شده
            </h3>

            {portfolio.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                نمونه کاری ثبت نشده است.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolio.map((item) => (
                  <Card key={item.id} variant="default" className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                      <Badge variant="info" size="sm">{item.category}</Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{item.location}</span>
                      <span>•</span>
                      <span className="font-mono">سال {item.completionYearJalali}</span>
                      {item.scaleOrVolume && <span>• حجم: {item.scaleOrVolume}</span>}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed pt-1">
                      {item.description}
                    </p>

                    {item.deliverablesSummary && (
                      <div className="bg-teal-50/70 border border-teal-100 rounded-lg p-2 text-[11px] text-teal-900">
                        <strong>خروجی‌ها: </strong>{item.deliverablesSummary}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Resume */}
        {activeTab === 'resume' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              سوابق تحصیلی، مسئولیت‌های اجرایی و جوایز
            </h3>

            {resumes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                موردی ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-3">
                {resumes.map((item) => (
                  <Card key={item.id} variant="default" className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                      <span className="text-xs font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                        {item.startYearJalali} تا {item.endYearJalali || 'تاکنون'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      {item.organization} {item.location ? `- ${item.location}` : ''}
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {aggregate && (
              <Card variant="engineering" className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                  <div className="text-center sm:border-l sm:border-slate-200 sm:pl-6 space-y-2">
                    <span className="text-xs text-slate-500 font-semibold block">امتیاز کل کارفرمایان</span>
                    <div className="text-3xl font-black text-[#0B1D35] font-mono">
                      {aggregate.averageRating} <span className="text-xs text-slate-400 font-normal">/ ۵</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= Math.round(aggregate.averageRating)
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">دقت فنی نقشه و پیاده‌سازی:</span>
                      <span className="font-bold font-mono">{aggregate.categoryAverages.accuracy} / ۵</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">تعهد به زمان‌بندی:</span>
                      <span className="font-bold font-mono">{aggregate.categoryAverages.punctuality} / ۵</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">پاسخگویی و اخلاق حرفه‌ای:</span>
                      <span className="font-bold font-mono">{aggregate.categoryAverages.communication} / ۵</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">منصفانه بودن قیمت و تعرفه:</span>
                      <span className="font-bold font-mono">{aggregate.categoryAverages.pricingFairness} / ۵</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Reviews List & Add Review Button */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">
                  نظرات و تجربیات ثبت‌شده ({toPersianDigits(reviews.length)})
                </h4>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onOpenReviewModal(profile)}
                  rightIcon={<Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />}
                >
                  ثبت نظر و امتیاز برای این نقشه‌بردار
                </Button>
              </div>

              {reviews.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                  هنوز نظری ثبت نشده است. اولین نفری باشید که تجربه همکاری با این نقشه‌بردار را ثبت می‌کنید!
                </div>
              ) : (
                reviews.map((rev) => (
                  <Card key={rev.id} variant="default" className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{rev.clientName}</span>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= rev.overallRating ? 'fill-amber-400 text-amber-500' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{rev.createdAtJalali}</span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl">
                      {rev.comment}
                    </p>

                    {rev.surveyorReply && (
                      <div className="bg-teal-50/80 border border-teal-100 rounded-xl p-3 text-xs space-y-1 mr-4">
                        <div className="flex items-center justify-between text-teal-900 font-bold">
                          <span className="flex items-center gap-1">
                            <CornerDownLeft className="w-3 h-3 text-teal-700" />
                            پاسخ نقشه‌بردار:
                          </span>
                          <span className="font-mono text-[10px] text-teal-700">
                            {rev.surveyorReply.replyDateJalali}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          {rev.surveyorReply.text}
                        </p>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};
