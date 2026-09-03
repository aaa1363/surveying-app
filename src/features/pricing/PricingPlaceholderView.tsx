import React from 'react';
import { Calculator, Coins, TrendingUp, Layers, Scale, CheckSquare2, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface PricingPlaceholderViewProps {
  onNavigateToRates?: () => void;
}

export const PricingPlaceholderView: React.FC<PricingPlaceholderViewProps> = ({ onNavigateToRates }) => {
  const costItems = [
    'سرپرست اکیپ',
    'کارشناس نقشه‌برداری',
    'کمک‌نقشه‌بردار',
    'تجهیزات ملکی یا اجاره‌ای',
    'مواد مصرفی',
    'رفت‌وآمد',
    'اقامت و تغذیه',
    'مبلغ کلی عملیات دفتری',
    'سایر هزینه‌ها',
  ];

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#0B1D35]" />
            <h2 className="font-black text-slate-900 text-base sm:text-lg">
              موتور محاسبات قیمت‌گذاری و استعلام تعرفه مرجع
            </h2>
            <Badge variant="demo" size="sm">
              مرحله سوم فعال
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ثبت هزینه واقعی براساس نرخ‌های شخصی؛ برآورد پیشنهادی و تحلیل بازار در بخش قیمت‌گذاری ارائه می‌شوند
          </p>
        </div>

        {onNavigateToRates && (
          <Button variant="primary" size="sm" onClick={onNavigateToRates} rightIcon={<Coins className="w-3.5 h-3.5" />}>
            مدیریت نرخ‌های شخصی من
          </Button>
        )}
      </div>

      <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-teal-950 text-sm">ثبت نرخ‌های شخصی و هزینه واقعی پروژه فعال است</h3>
          <p className="text-xs text-teal-800 mt-1">نرخ‌های پایه را جداگانه مدیریت و هزینه واقعی را از کارت هر پروژه ثبت کنید.</p>
        </div>
        {onNavigateToRates && <Button variant="outline" size="sm" onClick={onNavigateToRates} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>مشاهده نرخ‌ها</Button>}
      </div>

      {/* Cost Structure Checklist */}
      <Card variant="default">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-teal-600" />
            <span>آیتم‌های استاندارد بهای تمام‌شده در ساختار قیمت‌گذاری</span>
          </CardTitle>
          <Badge variant="neutral" size="sm">۹ سرفصل هزینه</Badge>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {costItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800"
            >
              <CheckSquare2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="default" className="space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
            <Scale className="w-4 h-4 text-teal-600" />
            <span>محاسبه هزینه‌های واقعی</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            محاسبه هزینه روزانه اکیپ، میر، تجهیزات ملکی/اجاره‌ای و سربار اجرایی
          </p>
        </Card>

        <Card variant="default" className="space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>پیشنهاد تحلیلی و متناسب</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            پیشنهاد تحلیلی نرخ بر مبنای برآورد هزینه واقعی، ضرایب سختی و حاشیه سود
          </p>
        </Card>

        <Card variant="default" className="space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>تبدیل مستقیم به قرارداد</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            انتقال مبالغ برآورد شده به پیش‌نویس قرارداد داخلی و صورت‌حساب
          </p>
        </Card>
      </div>

    </div>
  );
};
