import React from 'react';
import { Compass, Sparkles } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  return (
    <div
      className="bg-[#0B1D35] text-slate-100 px-4 py-1.5 text-[11px] font-medium border-b border-slate-700/60 shadow-inner flex items-center justify-between z-40 select-none"
      dir="rtl"
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3" />
            نسخه آزمایشی
          </span>
          <span className="text-slate-300 truncate text-[11px]">
            حساب آزمایشی محلی — اطلاعات فقط روی این دستگاه ذخیره می‌شود.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-medium shrink-0">
          <Compass className="w-3.5 h-3.5 text-teal-400" />
          <span>فاز ۸ • نسخه نمایشی پایدار و بهینه</span>
        </div>
      </div>
    </div>
  );
};
