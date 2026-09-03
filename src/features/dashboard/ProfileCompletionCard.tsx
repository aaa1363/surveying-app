import React from 'react';
import { UserCheck, ShieldAlert, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Profile } from '../../models/Profile';

export interface ProfileCompletionCardProps {
  profile: Profile;
  isComplete?: boolean;
  completionPercentage?: number;
  onCompleteProfile: () => void;
}

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  profile,
  isComplete = profile.isComplete,
  completionPercentage = profile.completionPercentage,
  onCompleteProfile,
}) => {

  return (
    <Card variant="engineering" className="bg-gradient-to-r from-white via-slate-50 to-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" dir="rtl">

        {/* Left/Main info */}
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-3 rounded-2xl shrink-0 ${
            isComplete ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
          }`}>
            {isComplete ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {isComplete ? 'پروفایل صنفی و هویتی تکمیل است' : 'تکمیل اطلاعات پرونده مهندسی'}
              </h3>
              <Badge variant={isComplete ? 'success' : 'warning'} size="sm">
                {isComplete ? 'تکمیل‌شده' : 'نیازمند تکمیل'}
              </Badge>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isComplete
                ? 'امکانات صدور قراردادهای داخلی و پیش‌فاکتور برای حساب شما فعال می‌باشد.'
                : 'جهت فعال‌سازی اسناد داخلی، نام، تلفن و شهر محل فعالیت را تکمیل کنید.'}
            </p>

            {/* Progress bar */}
            <div className="pt-1 max-w-md">
              <ProgressBar
                percentage={completionPercentage}
                color={isComplete ? 'emerald' : 'amber'}
                size="sm"
                label="درصد تکمیل پرونده"
              />
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="sm:self-center shrink-0">
          <Button
            variant={isComplete ? 'outline' : 'accent'}
            size="sm"
            onClick={onCompleteProfile}
            rightIcon={isComplete ? <UserCheck className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          >
            {isComplete ? 'مشاهده و ویرایش مدارک' : 'تکمیل مدارک پرونده'}
          </Button>
        </div>

      </div>
    </Card>
  );
};
