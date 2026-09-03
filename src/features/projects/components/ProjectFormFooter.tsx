import React from 'react';
import { Save, CheckCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'dirty';

interface ProjectFormFooterProps {
  autoSaveStatus: AutoSaveStatus;
  lastSavedTime: string | null;
  isSubmitting: boolean;
  onManualSaveDraft: () => void;
  onFinalizeProject: () => void;
  onBack: () => void;
}

export const ProjectFormFooter: React.FC<ProjectFormFooterProps> = ({
  autoSaveStatus,
  lastSavedTime,
  isSubmitting,
  onManualSaveDraft,
  onFinalizeProject,
  onBack,
}) => {
  const getAutoSaveBadge = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
            <span>در حال ذخیره خودکار پیش‌نویس...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>پیش‌نویس ذخیره شد {lastSavedTime ? `(${lastSavedTime})` : ''}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>خطا در ذخیره خودکار</span>
          </div>
        );
      case 'dirty':
        return (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>تغییرات ذخیره‌نشده</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-6 shadow-lg">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3" dir="rtl">
        
        {/* Right side: Auto-save status and Back button */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            بازگشت به فهرست
          </Button>

          <div className="hidden sm:block">
            {getAutoSaveBadge()}
          </div>
        </div>

        {/* Mobile auto-save badge */}
        <div className="sm:hidden w-full text-center py-0.5">
          {getAutoSaveBadge()}
        </div>

        {/* Left side: Draft save and Finalize buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onManualSaveDraft}
            disabled={isSubmitting}
            rightIcon={<Save className="w-4 h-4" />}
            className="flex-1 sm:flex-none"
          >
            ذخیره پیش‌نویس
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onFinalizeProject}
            disabled={isSubmitting}
            rightIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            className="flex-1 sm:flex-none bg-[#0B1D35] hover:bg-[#0B1D35]/90 text-white font-bold"
          >
            {isSubmitting ? 'در حال ثبت پروژه…' : 'ثبت نهایی پروژه'}
          </Button>
        </div>

      </div>
    </div>
  );
};
