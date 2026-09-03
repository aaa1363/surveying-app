import React from 'react';
import { Lock, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface IncompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProfile: () => void;
  featureName?: string;
  missingItems?: string[];
}

export const IncompleteProfileModal: React.FC<IncompleteProfileModalProps> = ({
  isOpen,
  onClose,
  onNavigateToProfile,
  featureName = 'قرارداد داخلی و فاکتور داخلی',
  missingItems = [
    'استان و شهر محل فعالیت',
    'استان و شهر محل فعالیت'
  ],
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="محدودیت پرونده ناقص"
      maxWidth="md"
    >
      <div className="space-y-4 text-right" dir="rtl">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-2">
          <Lock className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1">
          <h4 className="font-bold text-slate-900 text-sm sm:text-base">
            دسترسی به بخش «{featureName}» نیازمند تکمیل اطلاعات پرونده است
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            جهت تنظیم قراردادهای داخلی و صدور صورت‌حساب، تکمیل تمامی فیلدهای اجباری پایه الزامی می‌باشد.
          </p>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>موارد تکمیل‌نشده جهت فعال‌سازی:</span>
          </div>
          <ul className="space-y-1.5 pr-2 text-slate-700 font-medium">
            {missingItems.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2 text-amber-950">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              onClose();
              onNavigateToProfile();
            }}
            rightIcon={<CheckCircle className="w-4 h-4 text-teal-400" />}
          >
            تکمیل اطلاعات پرونده
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            انصراف و بازگشت
          </Button>
        </div>
      </div>
    </Modal>
  );
};
