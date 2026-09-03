import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  ShieldCheck,
  Star,
  Users,
  MapPin,
  Send,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Lock,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { User } from '../../models/User';
import { SurveyorPublicProfile, PublishedPriceCard } from '../../models/Stage6Models';
import { surveyorProfilesRepository } from '../../repositories';
import { SurveyorCard } from './SurveyorCard';
import { SurveyorPublicProfileModal } from './SurveyorPublicProfileModal';
import { SelectionInquiryModal } from './SelectionInquiryModal';
import { SubmitReviewModal } from './SubmitReviewModal';
import { ClientInquiriesView } from './ClientInquiriesView';
import { ClientReviewsHistoryView } from './ClientReviewsHistoryView';
import { toPersianDigits } from '../../utils/formatters';

export interface ClientPanelViewProps {
  clientUser: User;
  initialSection?: 'browse' | 'inquiries' | 'my_reviews';
}

type ClientTab = 'browse' | 'inquiries' | 'my_reviews';

export const ClientPanelView: React.FC<ClientPanelViewProps> = ({ clientUser, initialSection='browse' }) => {
  const [activeTab, setActiveTab] = useState<ClientTab>(initialSection);
  const [profiles, setProfiles] = useState<SurveyorPublicProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyVerified, setOnlyVerified] = useState(false);

  // Modals state
  const [viewingProfile, setViewingProfile] = useState<SurveyorPublicProfile | null>(null);
  const [selectingSurveyor, setSelectingSurveyor] = useState<SurveyorPublicProfile | null>(null);
  const [preselectedPrice, setPreselectedPrice] = useState<PublishedPriceCard | null>(null);
  const [reviewingSurveyor, setReviewingSurveyor] = useState<SurveyorPublicProfile | null>(null);

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const data = await surveyorProfilesRepository.getAllPublicProfiles(undefined, { userId: clientUser.id, role: 'client', environment: 'demo' });
      setProfiles(data);
    } catch (e) {
      console.error('Failed to load public profiles:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [clientUser.id, clientUser.role]);
  useEffect(()=>setActiveTab(initialSection),[initialSection]);

  // Distinct cities and specialties from data
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    profiles.forEach((p) => {
      if (p.city) cities.add(p.city);
    });
    return Array.from(cities);
  }, [profiles]);

  const availableSpecialties = useMemo(() => {
    const specs = new Set<string>();
    profiles.forEach((p) => {
      p.specialties?.forEach((s) => specs.add(s));
    });
    return Array.from(specs);
  }, [profiles]);

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (onlyVerified && !p.isVerified) return false;
      if (minRating > 0 && p.ratingAverage < minRating) return false;
      if (selectedCity !== 'all' && p.city !== selectedCity && !p.serviceAreas?.includes(selectedCity)) {
        return false;
      }
      if (selectedSpecialty !== 'all' && !p.specialties?.includes(selectedSpecialty)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const inName = p.fullName.toLowerCase().includes(q);
        const inTitle = p.title?.toLowerCase().includes(q);
        const inBio = p.bio?.toLowerCase().includes(q);
        const inSpecs = p.specialties?.some((s) => s.toLowerCase().includes(q));
        if (!inName && !inTitle && !inBio && !inSpecs) return false;
      }
      return true;
    });
  }, [profiles, searchQuery, selectedCity, selectedSpecialty, minRating, onlyVerified]);

  const handleOpenSelection = (profile: SurveyorPublicProfile, priceCard?: PublishedPriceCard) => {
    setPreselectedPrice(priceCard || null);
    setSelectingSurveyor(profile);
  };

  const handleOpenReview = (profile: SurveyorPublicProfile) => {
    setReviewingSurveyor(profile);
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Client Access Notice & Security Isolation Banner */}
      <div className="bg-gradient-to-r from-[#0B1D35] to-[#16335E] text-white p-5 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                پنل دسترسی کارفرما
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                سامانه استعلام تعرفه، بررسی رزومه و انتخاب مهندس نقشه‌بردار
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              خوش آمدید {clientUser.fullName}! در این پنل می‌توانید صلاحیت‌های حرفه‌ای، سوابق ثبتی، پروژه‌های اجرایی و تعرفه‌های شفاف مهندسان نقشه‌بردار را بررسی و استعلام قیمت ثبت نمایید.
            </p>
          </div>

          <div className="bg-white/10 border border-white/10 px-3.5 py-2 rounded-xl text-[11px] text-slate-300 shrink-0 flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-300 shrink-0" />
            <span>حریم خصوصی: اطلاعات مالی داخلی نقشه‌برداران کاملاً محرمانه است.</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/10 overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'browse'
                ? 'bg-white text-[#0B1D35] shadow-xs'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <Search className="w-4 h-4 text-teal-600" />
            بانک نقشه‌برداران و استعلام تعرفه
          </button>

          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'inquiries'
                ? 'bg-white text-[#0B1D35] shadow-xs'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <Send className="w-4 h-4 text-teal-600" />
            درخواست‌های استعلام من
          </button>

          <button
            onClick={() => setActiveTab('my_reviews')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'my_reviews'
                ? 'bg-white text-[#0B1D35] shadow-xs'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-teal-600" />
            نظرات و امتیازهای من
          </button>
        </div>
      </div>

      {/* Tab 1: Browse Surveyors */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          
          {/* Search & Filter Toolbar */}
          <Card variant="default" className="p-4 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Search Keyword */}
              <div className="sm:col-span-2 lg:col-span-1">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو با نام، کلمات کلیدی، تخصص..."
                  rightIcon={<Search className="w-4 h-4 text-slate-400" />}
                />
              </div>

              {/* City Filter */}
              <div>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1D35] outline-hidden text-slate-800"
                >
                  <option value="all">همه شهرها و مناطق</option>
                  {availableCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Specialty Filter */}
              <div>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1D35] outline-hidden text-slate-800"
                >
                  <option value="all">همه تخصص‌ها</option>
                  {availableSpecialties.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minimum Rating */}
              <div>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1D35] outline-hidden text-slate-800"
                >
                  <option value={0}>همه امتیازها</option>
                  <option value={4}>حداقل ۴ ستاره و بالاتر</option>
                  <option value={4.5}>حداقل ۴.۵ ستاره و بالاتر</option>
                </select>
              </div>

            </div>

            {/* Bottom Filter Options */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyVerified}
                    onChange={(e) => setOnlyVerified(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-slate-700 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    فقط نقشه‌برداران با مدارک ثبت‌شده (بررسی نمایشی)
                  </span>
                </label>
              </div>

              <div className="text-slate-500 font-medium">
                تعداد نتایج: <span className="font-bold text-[#0B1D35] font-mono">{toPersianDigits(filteredProfiles.length)}</span> کارشناس
              </div>
            </div>
          </Card>

          {/* Surveyors Grid */}
          {isLoading ? (
            <div className="p-12 text-center text-sm text-slate-500">در حال دریافت فهرست نقشه‌برداران...</div>
          ) : filteredProfiles.length === 0 ? (
            <EmptyState
              icon={<Users className="w-10 h-10 text-slate-400" />}
              title="نقشه‌برداری با مشخصات جستجو شده یافت نشد"
              description="می‌توانید فیلترهای جستجو، شهر یا امتیاز را تغییر داده و مجدداً تلاش نمایید."
              actionText="پاکسازی فیلترها"
              onAction={() => {
                setSearchQuery('');
                setSelectedCity('all');
                setSelectedSpecialty('all');
                setMinRating(0);
                setOnlyVerified(false);
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProfiles.map((p) => (
                <SurveyorCard
                  key={p.id}
                  profile={p}
                  onViewProfile={(profile) => setViewingProfile(profile)}
                  onSelectSurveyor={(profile) => handleOpenSelection(profile)}
                />
              ))}
            </div>
          )}

        </div>
      )}

      {/* Tab 2: Inquiries History */}
      {activeTab === 'inquiries' && (
        <ClientInquiriesView
          clientUser={clientUser}
          onBrowseSurveyors={() => setActiveTab('browse')}
        />
      )}

      {/* Tab 3: Reviews History */}
      {activeTab === 'my_reviews' && (
        <ClientReviewsHistoryView
          clientUser={clientUser}
          onBrowseSurveyors={() => setActiveTab('browse')}
        />
      )}

      {/* Profile Details Modal */}
      <SurveyorPublicProfileModal
        isOpen={!!viewingProfile}
        onClose={() => setViewingProfile(null)}
        profile={viewingProfile}
        clientUser={clientUser}
        onOpenSelectionModal={(p, card) => {
          setViewingProfile(null);
          handleOpenSelection(p, card);
        }}
        onOpenReviewModal={(p) => {
          setViewingProfile(null);
          handleOpenReview(p);
        }}
      />

      {/* Selection / Inquiry Modal */}
      <SelectionInquiryModal
        isOpen={!!selectingSurveyor}
        onClose={() => {
          setSelectingSurveyor(null);
          setPreselectedPrice(null);
        }}
        surveyor={selectingSurveyor}
        clientUser={clientUser}
        preselectedPriceCard={preselectedPrice}
        onSuccess={() => {
          loadProfiles();
        }}
      />

      {/* Review Submission Modal */}
      <SubmitReviewModal
        isOpen={!!reviewingSurveyor}
        onClose={() => setReviewingSurveyor(null)}
        surveyor={reviewingSurveyor}
        clientUser={clientUser}
        onSuccess={() => {
          loadProfiles();
        }}
      />

    </div>
  );
};
