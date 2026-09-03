import React from 'react';
import { PlusCircle, Sparkles, FolderPlus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export interface PrimaryActionBannerProps {
  onNewProject: () => void;
}

export const PrimaryActionBanner: React.FC<PrimaryActionBannerProps> = ({
  onNewProject,
}) => {
  return (
    <Card variant="accent" className="p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" dir="rtl">
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-teal-500/20 text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              اقدام اصلی
            </span>
            <h3 className="font-bold text-white text-base sm:text-lg">
              ثبت و سازماندهی پروژه جدید نقشه‌برداری
            </h3>
          </div>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            ثبت اطلاعات کارفرما، محدوده پلاک ثبتی یا مختصات UTM، تعیین خدمات و تخصیص اکیپ میدانی
          </p>
        </div>

        <div className="shrink-0">
          <Button
            variant="accent"
            size="md"
            onClick={onNewProject}
            rightIcon={<FolderPlus className="w-5 h-5 text-white" />}
            className="w-full sm:w-auto shadow-lg shadow-teal-950/40"
          >
            ثبت پروژه جدید
          </Button>
        </div>

      </div>
    </Card>
  );
};
