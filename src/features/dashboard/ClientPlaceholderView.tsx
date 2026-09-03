import React from 'react';
import { Building2, ArrowLeft, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { User } from '../../models/User';

export interface ClientPlaceholderViewProps {
  user: User;
  onSwitchToSurveyor: () => void;
  onLogout: () => void;
}

export const ClientPlaceholderView: React.FC<ClientPlaceholderViewProps> = ({
  user,
  onSwitchToSurveyor,
  onLogout,
}) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 px-4" dir="rtl">
      <Card variant="engineering" className="text-center p-8 space-y-6">
        
        {/* Icon & Badge */}
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center mx-auto shadow-sm">
            <Building2 className="w-8 h-8" />
          </div>
          <Badge variant="info" size="md">
            نقش کاربری: کارفرما / متقاضی خدمات نقشه‌برداری
          </Badge>
        </div>

        {/* Core Message */}
        <div className="space-y-2 max-w-lg mx-auto">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            پنل کارفرما در مرحله بعد تکمیل می‌شود
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            کاربر گرامی ({user.fullName})، ماژول اختصاصی کارفرمایان شامل «استعلام فوری تعرفه»، «مشاهده پیشرفت پروژه‌های ثبت‌شده»، «تأییدیه الکترونیک نقشه‌ها» و «درگاه پرداخت صورت‌وضعیت» در مرحله بعدی برنامه توسعه محصول پیاده‌سازی خواهد شد.
          </p>
        </div>

        {/* Feature Roadmap for Clients */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-right space-y-2.5 text-xs text-slate-700">
          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            امکانات آتی پنل کارفرمایان:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-[11px] pt-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              درخواست آنلاین نقشه‌برداری ملک و ثبتی
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              رهگیری زنده پیشرفت عملیات کارشناسی
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              دانلود خروجی‌های CAD و PDF ممهور
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              پرداخت اقساطی فاکتورها و تسویه حساب
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            variant="primary"
            onClick={onSwitchToSurveyor}
            rightIcon={<RefreshCw className="w-4 h-4 text-teal-400" />}
          >
            تغییر نقش به نقشه‌بردار (جهت تست داشبورد)
          </Button>

          <Button
            variant="outline"
            onClick={onLogout}
            rightIcon={<LogOut className="w-4 h-4 text-slate-500" />}
          >
            خروج از حساب
          </Button>
        </div>

      </Card>
    </div>
  );
};
