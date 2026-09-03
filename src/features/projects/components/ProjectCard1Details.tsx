import React, { useEffect, useState } from 'react';
import { FolderKanban, Hash, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { ProjectStatus } from '../../../models/Project';

interface ProjectCard1DetailsProps {
  projectCode: string;
  internalCode: string;
  title: string;
  description: string;
  status: ProjectStatus;
  errors: Record<string, string>;
  onChange: (fields: { internalCode?: string; title?: string; description?: string }) => void;
}

export const ProjectCard1Details: React.FC<ProjectCard1DetailsProps> = ({
  projectCode,
  internalCode,
  title,
  description,
  status,
  errors,
  onChange,
}) => {
  const [rawTitle, setRawTitle] = useState(title);
  const [isComposing, setIsComposing] = useState(false);
  useEffect(() => { if (!isComposing) setRawTitle(title); }, [title, isComposing]);
  const getStatusBadge = (st: ProjectStatus) => {
    switch (st) {
      case 'draft':
        return <Badge variant="neutral" size="sm">پیش‌نویس اولیه</Badge>;
      case 'planned':
        return <Badge variant="info" size="sm">برنامه‌ریزی‌شده</Badge>;
      case 'active':
        return <Badge variant="success" size="sm">در حال اجرا</Badge>;
      case 'paused':
        return <Badge variant="warning" size="sm">متوقف‌شده</Badge>;
      case 'completed':
        return <Badge variant="success" size="sm">تکمیل‌شده</Badge>;
      case 'archived':
        return <Badge variant="neutral" size="sm">بایگانی‌شده</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card variant="default" id="card-project-details" className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-[#0B1D35]" />
          <span>کارت ۱: مشخصات پایه پروژه</span>
        </CardTitle>
        <div className="flex items-center gap-2">
          {getStatusBadge(status)}
        </div>
      </CardHeader>

      <div className="space-y-4 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Project Code (Auto-generated & Readonly) */}
          <Input
            label="کد یکتای سامانه (خودکار و سیستمی)"
            value={projectCode || '— (پس از اولین ذخیره تعیین می‌گردد)'}
            readOnly
            disabled
            className="font-mono text-center bg-slate-100 text-slate-700 font-bold"
            rightIcon={<Hash className="w-4 h-4 text-slate-500" />}
            helperText={projectCode ? "تولید شده براساس سال شمسی تاریخ ثبت و شمارنده مستقل کاربر" : "کد یکتا پس از اولین ذخیره براساس سال تاریخ ثبت پروژه تولید خواهد شد."}
          />

          {/* Internal Project Code (Optional & Editable) */}
          <Input
            label="کد پرونده / پروژه داخلی کارگاه (اختیاری)"
            value={internalCode}
            onChange={(e) => onChange({ internalCode: e.target.value })}
            placeholder="مثال: YZD-PARS-104"
            dir="ltr"
            className="font-mono text-center"
            rightIcon={<FileText className="w-4 h-4 text-slate-400" />}
            helperText="کد پرونده طبق بایگانی دفتری مهندس نقشه‌بردار"
          />

          {/* Project Title (Mandatory) */}
          <div className="sm:col-span-2">
            <Input
              label="نام / عنوان کامل پروژه نقشه‌برداری *"
              value={rawTitle}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={(e) => { setIsComposing(false); const value = e.currentTarget.value; setRawTitle(value); onChange({ title: value }); }}
              onChange={(e) => { const value = e.target.value; setRawTitle(value); if (!isComposing) onChange({ title: value }); }}
              onBlur={() => onChange({ title: rawTitle })}
              placeholder="مثال: تفکیک و پیاده‌سازی پلاک ثبتی ۱۲۴۸ مجتمع پارسیان"
              error={errors.title}
              helperText="عنوان رسمی پروژه جهت درج در کارتابل و اسناد داخلی"
            />
          </div>

          {/* Project Description (Optional) */}
          <div className="sm:col-span-2 space-y-1.5 text-right" dir="rtl">
            <label className="block text-xs font-bold text-slate-700">
              توضیحات و اهداف فنی عملیات (اختیاری)
            </label>
            <textarea
              value={description}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={3}
              placeholder="شرح نیازمندی‌های کارفرما، شرایط خاص زمین، الزامات دقت یا نکات ویژه اجرایی..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-[#0B1D35] focus:ring-2 focus:ring-[#0B1D35]/15 resize-y transition-colors"
            />
          </div>

        </div>
      </div>
    </Card>
  );
};
