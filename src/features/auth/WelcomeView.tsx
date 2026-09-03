import React from 'react';
import { Compass, ArrowLeft, UserPlus, LogIn, ShieldCheck, FileSpreadsheet, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export interface WelcomeViewProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onGoToLogin,
  onGoToRegister,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6" dir="rtl">
      {/* Top Banner */}
      <div className="flex justify-center pt-2">
        <Badge variant="demo" size="md">
          سامانه یکپارچه مدیریت پروژه‌های مهندسی نقشه‌برداری (نسخه آزمایشی)
        </Badge>
      </div>

      {/* Hero Content */}
      <div className="max-w-md w-full mx-auto my-auto space-y-6 text-center py-8">
        
        {/* Engineering Emblem */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-[#0B1D35] flex items-center justify-center text-white shadow-xl shadow-[#0B1D35]/15 border border-slate-700/50">
          <Compass className="w-10 h-10 text-teal-400 animate-pulse" />
          <div className="absolute -bottom-2 -right-2 bg-teal-600 text-white p-1.5 rounded-xl shadow-md">
            <MapPin className="w-4 h-4" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            سامانه مدیریت پروژه‌های نقشه‌برداری
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            بستر مدرن و استاندارد جهت مدیریت کارکرد، برآورد هزینه‌ها، کنترل پیشرفت پروژه‌ها و ارتباط بین نقشه‌برداران و کارفرمایان
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-3 text-right">
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
              <span>مدیریت کارکرد و پروژه</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              پیگیری پیشرفت فیزیکی، مالی و اسناد
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>تسهیل قرارداد و اسناد</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              تنظیم برآورد مطابق ضوابط و تعرفه صنف
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onGoToLogin}
            rightIcon={<LogIn className="w-5 h-5 text-teal-400" />}
          >
            ورود به حساب کاربری
          </Button>

          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={onGoToRegister}
            rightIcon={<UserPlus className="w-5 h-5 text-slate-500" />}
          >
            ثبت‌نام سریع (حقیقی / حقوقی)
          </Button>
        </div>

      </div>

      {/* Footer Info */}
      <footer className="text-center text-[11px] text-slate-400 pb-2">
        <span>مرحله صفر و یک معماری محصول • نسخه React/TypeScript</span>
      </footer>
    </div>
  );
};
