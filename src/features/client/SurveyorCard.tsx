import React from 'react';
import { Star, ShieldCheck, MapPin, Briefcase, Phone, ChevronLeft, Award, Coins } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SurveyorPublicProfile } from '../../models/Stage6Models';
import { toPersianDigits, formatPhoneNumber } from '../../utils/formatters';

export interface SurveyorCardProps {
  profile: SurveyorPublicProfile;
  onViewProfile: (profile: SurveyorPublicProfile) => void;
  onSelectSurveyor: (profile: SurveyorPublicProfile) => void;
}

export const SurveyorCard: React.FC<SurveyorCardProps> = ({
  profile,
  onViewProfile,
  onSelectSurveyor,
}) => {
  return (
    <Card
      variant="default"
      className="p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all group"
      dir="rtl"
    >
      <div className="space-y-3.5">
        
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0B1D35] to-[#1E3A8A] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              {profile.fullName.charAt(0)}
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-teal-700 transition-colors">
                  {profile.fullName}
                </h3>
                {profile.isVerified && (
                  <span
                    className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
                    title="مدارک و سوابق ثبت‌شده — بررسی نمایشی"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    مدارک ثبت‌شده — بررسی نمایشی
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                {profile.title}
              </p>
            </div>
          </div>

          {/* Rating Badge */}
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-900 px-2 py-1 rounded-xl text-xs font-bold shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span className="font-mono">{profile.ratingAverage.toFixed(1)}</span>
            <span className="text-[10px] font-normal text-amber-700">({toPersianDigits(profile.reviewCount)})</span>
          </div>
        </div>

        {/* Location & Experience */}
        <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {profile.province} - {profile.city}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            {toPersianDigits(profile.experienceYears)} سال سابقه
          </span>
        </div>

        {/* Bio Snippet */}
        {profile.bio && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {profile.bio}
          </p>
        )}

        {/* Specialties Tags */}
        {profile.specialties && profile.specialties.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {profile.specialties.slice(0, 3).map((spec, i) => (
              <span
                key={i}
                className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded-md font-medium"
              >
                {spec}
              </span>
            ))}
            {profile.specialties.length > 3 && (
              <span className="text-[10px] text-slate-400 font-medium">
                +{toPersianDigits(profile.specialties.length - 3)} تخصص دیگر
              </span>
            )}
          </div>
        )}

      </div>

      {/* Footer Action Buttons */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewProfile(profile)}
          className="flex-1 text-xs"
          leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
        >
          رزومه، تعرفه‌ها و نظرات
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={() => onSelectSurveyor(profile)}
          className="text-xs"
        >
          استعلام و انتخاب
        </Button>
      </div>

    </Card>
  );
};
