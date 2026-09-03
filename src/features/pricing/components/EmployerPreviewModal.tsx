import React from 'react';
import { Eye, ShieldCheck, CheckCircle2, FileText, Calendar, Building, Sparkles } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmployerPriceSummary } from '../../../models';
import { formatToman } from '../../../utils/formatters';

interface EmployerPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: EmployerPriceSummary | null;
  projectTitle?: string;
  clientName?: string;
}

export const EmployerPreviewModal: React.FC<EmployerPreviewModalProps> = ({
  isOpen,
  onClose,
  summary,
  projectTitle,
  clientName,
}) => {
  if (!summary) return null;

  const getComparisonBadge = () => {
    switch (summary.comparisonLabel) {
      case 'within_market':
        return <Badge variant="success" size="sm">در محدوده متعارف بازار</Badge>;
      case 'lower_than_market':
        return <Badge variant="warning" size="sm">کمتر از میانه بازار</Badge>;
      case 'higher_than_market':
        return <Badge variant="neutral" size="sm">سطح ویژه / بالاتر از میانه بازار</Badge>;
      default:
        return <Badge variant="neutral" size="sm">در حال ارزیابی آماری</Badge>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="پیش‌نمایش استعلام و برآورد قیمت کارفرما"
      description="این پیش‌نمایش صرفاً اقلام تحویل‌دادنی نهایی را نمایش می‌دهد و هزینه‌های داخلی، نرخ‌های شخصی و فرمول‌ها مخفی هستند."
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            حفظ محرمانگی داده‌های مالی و استهلاک
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            بستن پیش‌نمایش
          </Button>
        </div>
      }
    >
      <div className="space-y-5 py-1" dir="rtl">
        
        {/* Header Summary Box */}
        <div className="p-4 bg-gradient-to-l from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
            <div>
              <span className="text-[11px] text-slate-300 font-medium">پروژه نقشه‌برداری</span>
              <h4 className="text-base font-bold text-white mt-0.5">
                {projectTitle || 'پروژه جاری'}
              </h4>
            </div>
            {clientName && (
              <div className="text-right sm:text-left">
                <span className="text-[11px] text-slate-300 font-medium">کارفرما</span>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">{clientName}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1">
            <div>
              <span className="text-xs text-teal-300 font-semibold block">مبلغ کل پیشنهادی خدمات</span>
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1 block">
                {formatToman(summary.finalPrice)}
              </span>
              <span className="text-xs text-slate-200 mt-1 block">{summary.finalPriceInWords}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-white/10 px-3 py-1 rounded-lg text-slate-200 border border-white/10">
                {summary.selectedLevelLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Deliverable Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] text-slate-500 font-medium block">عنوان خدمت درخواستی</span>
            <p className="text-xs font-bold text-slate-800">{summary.serviceTitle}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] text-slate-500 font-medium block">مقدار و واحد خدمت</span>
            <p className="text-xs font-bold text-slate-800"><bdi dir="ltr">{summary.quantity}</bdi> {summary.unit}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] text-slate-500 font-medium block">وضعیت نسبت به متعارف بازار</span>
            <div className="mt-0.5">{getComparisonBadge()}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] text-slate-500 font-medium block">سطح اطمینان برآورد</span>
            <p className="text-xs font-bold text-slate-800">{summary.confidenceLevelLabel}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] text-slate-500 font-medium block">تاریخ صدور برآورد</span>
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{summary.issueDateJalali}</span>
            </p>
          </div>
        </div>

        {/* Optional Surveyor Notes */}
        {summary.surveyorNotes && (
          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80 space-y-1.5">
            <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              توضیحات و مشخصات اجرایی نقشه‌بردار:
            </span>
            <p className="text-xs text-teal-900 leading-relaxed whitespace-pre-wrap">
              {summary.surveyorNotes}
            </p>
          </div>
        )}

        {/* Confidentiality Guarantee Notice */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>تضمین عدم افشای جزئیات داخلی:</strong> نرخ‌های شخصی، هزینه‌های استهلاک تجهیزات، دستمزد کارشناسان و ضرایب حاشیه سود در این خروجی قرار نمی‌گیرند.
          </span>
        </div>

      </div>
    </Modal>
  );
};

