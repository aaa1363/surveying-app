import React from 'react';
import { Calculator, FileSignature, Lock, Coins } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export interface QuickActionsProps {
  isProfileComplete: boolean;
  onNavigateToRates?: () => void;
  onNavigateToPricing: () => void;
  onAttemptContract: () => void;
  onAttemptInvoice: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  isProfileComplete,
  onNavigateToRates,
  onNavigateToPricing,
  onAttemptContract,
}) => {
  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>دسترسی و اقدامات سریع مهندسی</span>
        </CardTitle>
        <Badge variant="neutral" size="sm">
          کلیدهای میانبر
        </Badge>
      </CardHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" dir="rtl">
        <button
          onClick={onNavigateToRates}
          className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-600 hover:bg-teal-50/40 transition-all text-right group cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-teal-900">نرخ‌های شخصی من</span>
            </div>
            <p className="text-[11px] text-slate-500 pr-10">تعریف نرخ نیروی انسانی، تجهیزات و مصالح</p>
          </div>
        </button>

        {/* 1. New Pricing */}
        <button
          onClick={onNavigateToPricing}
          className="p-3.5 rounded-xl border border-slate-200 hover:border-[#0B1D35] hover:bg-slate-50 transition-all text-right group cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#0B1D35] flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#0B1D35]">
                قیمت‌گذاری جدید
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pr-10">
              محاسبه بهای تمام‌شده و تعرفه مرجع
            </p>
          </div>
        </button>

        {/* 2. Create Contract (Disabled if profile is incomplete) */}
        <button
          onClick={onAttemptContract}
          className={`p-3.5 rounded-xl border transition-all text-right flex items-center justify-between cursor-pointer ${
            isProfileComplete
              ? 'border-slate-200 hover:border-teal-600 hover:bg-teal-50/30'
              : 'border-slate-200/80 bg-slate-50 opacity-80 hover:bg-amber-50/50 hover:border-amber-300'
          }`}
        >
          <div className="space-y-1 w-full">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isProfileComplete ? 'bg-teal-50 text-teal-700' : 'bg-slate-200 text-slate-500'
                }`}>
                  <FileSignature className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs sm:text-sm text-slate-900">
                  ساخت قرارداد
                </span>
              </div>
              {!isProfileComplete && (
                <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full font-bold">
                  <Lock className="w-3 h-3" />
                  قفل
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 pr-10">
              {isProfileComplete ? 'تنظیم پیش‌نویس قرارداد داخلی' : 'نیازمند تکمیل مشخصات پایه'}
            </p>
          </div>
        </button>

      </div>
    </Card>
  );
};
