import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card';
import { PersianDateInput } from '../../../components/ui/PersianDateInput';
import { Badge } from '../../../components/ui/Badge';
import { ProjectStatus } from '../../../models/Project';
import { isValidJalaliDate, compareJalaliDates } from '../../../utils/jalaliDate';

interface ProjectCard5DatesProps {
  registrationDateJalali: string;
  startDateJalali: string;
  agreedDeliveryDateJalali?: string;
  actualEndDateJalali?: string;
  status: ProjectStatus;
  errors: Record<string, string>;
  onChange: (dates: {
    registrationDateJalali?: string;
    startDateJalali?: string;
    agreedDeliveryDateJalali?: string;
    actualEndDateJalali?: string;
  }) => void;
}

export const ProjectCard5Dates: React.FC<ProjectCard5DatesProps> = ({
  registrationDateJalali,
  startDateJalali,
  agreedDeliveryDateJalali = '',
  actualEndDateJalali = '',
  status,
  errors,
  onChange,
}) => {
  // Check timeline ordering
  const isStartBeforeReg =
    registrationDateJalali &&
    startDateJalali &&
    isValidJalaliDate(registrationDateJalali).isValid &&
    isValidJalaliDate(startDateJalali).isValid &&
    compareJalaliDates(startDateJalali, registrationDateJalali) < 0;

  return (
    <Card variant="default" id="card-dates-timeline" className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#0B1D35]" />
          <span>کارت ۵: زمان‌بندی و تاریخ‌های شمسی</span>
        </CardTitle>
        <Badge variant="neutral" size="sm">تقویم هجری شمسی (قالب ۱۴۰۵/۰۶/۱۵)</Badge>
      </CardHeader>

      <div className="space-y-4 pt-1">
        
        {isStartBeforeReg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>تاریخ شروع عملیات نمی‌تواند قبل از تاریخ ثبت اولیه پروژه باشد.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 [&_input]:min-w-[11rem] [&_input]:font-mono" dir="rtl">
          
          {/* Registration Date (Mandatory) */}
          <PersianDateInput id="project-registration-date"
            label="تاریخ ثبت پرونده در سامانه"
            value={registrationDateJalali}
            onChange={(value) => onChange({ registrationDateJalali: value })}
            error={errors.registrationDateJalali}
            required
            helperText="قالب: سال/ماه/روز (مثال: ۱۴۰۴/۰۶/۰۱)"
          />

          {/* Start Date (Mandatory) */}
          <PersianDateInput id="project-start-date"
            label="تاریخ شروع عملیات نقشه‌برداری"
            value={startDateJalali}
            onChange={(value) => onChange({ startDateJalali: value })}
            error={errors.startDateJalali}
            required
            helperText="باید مساوی یا بعد از تاریخ ثبت باشد"
          />

          {/* Agreed Delivery Date (Optional) */}
          <PersianDateInput id="project-delivery-date"
            label="تاریخ تحویل توافق‌شده با کارفرما (اختیاری)"
            value={agreedDeliveryDateJalali}
            onChange={(value) => onChange({ agreedDeliveryDateJalali: value })}
            error={errors.agreedDeliveryDateJalali}
            helperText="موعد مقرر تحویل خروجی‌ها و نقشه‌ها"
          />

          {/* Actual End Date (Only visible when completed) */}
          {status === 'completed' && (
            <PersianDateInput id="project-end-date"
              label="تاریخ پایان و تحویل قطعی (پروژه تکمیل‌شده)"
              value={actualEndDateJalali}
              onChange={(value) => onChange({ actualEndDateJalali: value })}
              error={errors.actualEndDateJalali}
              helperText="تاریخ خاتمه قطعی پروژه و تحویل مدارک"
            />
          )}

        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-2">
          <span>
            کلیه تاریخ‌ها به‌صورت هجری شمسی معتبر محاسبه شده و در خروجی قراردادهای داخلی و پیش‌فاکتورها ثبت می‌گردند.
          </span>
        </div>

      </div>
    </Card>
  );
};
