import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileSignature,
  FileSpreadsheet,
  Coins,
  Search,
  Building2,
  User as UserIcon,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FolderKanban,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
} from 'lucide-react';
import { SurveyProject, User } from '../../models';
import { projectRepository } from '../../repositories';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { ProjectFinanceView, FinanceTabType } from './ProjectFinanceView';
import { formatToman, toPersianDigits } from '../../utils/formatters';
import { getSubServiceLabel } from '../../data/servicesCatalog';

interface DocumentsHubViewProps {
  user: User;
  initialProjectId?: string;
  initialTab?: FinanceTabType;
}

export const DocumentsHubView: React.FC<DocumentsHubViewProps> = ({
  user,
  initialProjectId,
  initialTab = 'proforma',
}) => {
  const [projects, setProjects] = useState<SurveyProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<SurveyProject | null>(null);
  const [targetTab, setTargetTab] = useState<FinanceTabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await projectRepository.getProjects(user.id);
      setProjects(list);
      if (initialProjectId) {
        const found = list.find((p) => p.id === initialProjectId);
        if (found) {
          setSelectedProject(found);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت پروژه‌ها');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [user.id, initialProjectId]);

  if (isLoading) {
    return <LoadingState message="در حال بارگذاری مرکز اسناد، قراردادها و امور مالی..." className="py-16" />;
  }

  // If a project is selected, render the full 4-tab ProjectFinanceView
  if (selectedProject) {
    return (
      <ProjectFinanceView
        project={selectedProject}
        user={user}
        initialTab={targetTab}
        onBack={() => {
          setSelectedProject(null);
          loadProjects();
        }}
      />
    );
  }

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchTitle = p.title.toLowerCase().includes(q);
    const matchCode = p.projectCode.toLowerCase().includes(q);
    const matchClient = p.clientSnapshot.type === 'legal'
      ? p.clientSnapshot.companyName?.toLowerCase().includes(q)
      : p.clientSnapshot.fullName?.toLowerCase().includes(q);
    return matchTitle || matchCode || matchClient;
  });

  return (
    <div className="space-y-6 pb-12 text-right" dir="rtl">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-[#0B1D35] text-white shrink-0 shadow-xs">
            <FileSignature className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-slate-900 text-base sm:text-lg">
                مرکز قراردادها، اسناد و امور مالی پروژه‌ها
              </h2>
              <Badge variant="demo" size="sm">
                مرحله ۵ (فعال و کامل)
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              صدور پیش‌فاکتور، تنظیم قرارداد مهندسی، صورت‌وضعیت پیشرفت کار و ثبت اقساط دریافتی
            </p>
          </div>
        </div>
      </div>

      {/* Legal & Boundary Banner */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-bold text-slate-900">قواعد حقوقی و محدوده سامانه:</strong>
          <p className="text-slate-600">
            تمام اسناد و شماره‌های تولیدشده در این سامانه صرفاً برای هماهنگی و مدیریت داخلی عملیات مهندسی نقشه‌برداری هستند و هیچ اتصال مالیاتی ندارند. تأییدیه‌های کارفرما پس از هماهنگی تلفنی یا حضوری توسط نقشه‌بردار به‌صورت دستی ثبت می‌گردد.
          </p>
        </div>
      </div>

      {/* Module Navigation Shortcuts Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card variant="default" className="p-3.5 bg-white border-slate-200 space-y-1.5 text-center sm:text-right">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-xs">
            <FileText className="w-4 h-4" />
            <span>۱. پیش‌فاکتور</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            پیشنهاد قیمت قطعی به کارفرما بدون افشای نرخ‌های شخصی و هزینه‌ها
          </p>
        </Card>

        <Card variant="default" className="p-3.5 bg-white border-slate-200 space-y-1.5 text-center sm:text-right">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
            <FileSignature className="w-4 h-4" />
            <span>۲. قرارداد مهندسی</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            تنظیم مواد حقوقی، تعهدات فنی، تحویل‌دادنی‌ها و نگارش‌های نسخه
          </p>
        </Card>

        <Card variant="default" className="p-3.5 bg-white border-slate-200 space-y-1.5 text-center sm:text-right">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
            <FileSpreadsheet className="w-4 h-4" />
            <span>۳. صورت‌وضعیت</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            محاسبه پیشرفت کار، مبالغ مطالبه‌شده و صدور صورتحساب خدمات
          </p>
        </Card>

        <Card variant="default" className="p-3.5 bg-white border-slate-200 space-y-1.5 text-center sm:text-right">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
            <Coins className="w-4 h-4" />
            <span>۴. برنامه پرداخت</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            ثبت مراحل پرداخت، پیگیری دریافتی‌ها و محاسبه مانده حساب
          </p>
        </Card>
      </div>

      {/* Project Selector Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base">
              انتخاب پروژه جهت مدیریت اسناد و قراردادها
            </h3>
            <p className="text-xs text-slate-500">
              برای ورود به کارتابل پیش‌فاکتور، قرارداد یا پرداخت‌ها، پروژه مورد نظر را انتخاب فرمایید.
            </p>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در نام پروژه، کد یا کارفرما..."
              className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0B1D35]"
            />
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="w-8 h-8 text-teal-600" />}
            title="هیچ پروژه‌ای یافت نشد"
            description="ابتدا در بخش پروژه‌ها، یک پروژه ثبت فرمایید تا مدیریت اسناد آن فعال گردد."
            className="py-12"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((p) => {
              const isLegal = p.clientSnapshot.type === 'legal';
              const clientName = isLegal
                ? p.clientSnapshot.companyName || 'کارفرمای حقوقی'
                : p.clientSnapshot.fullName || 'کارفرمای حقیقی';

              const serviceTitle = getSubServiceLabel(
                p.services.mainCategoryId,
                p.services.primarySubServiceId
              );

              return (
                <Card
                  key={p.id}
                  variant="default"
                  className="p-4 sm:p-5 hover:border-slate-300 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#0B1D35] text-white rounded">
                          {p.projectCode}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm truncate">{p.title}</h4>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        {isLegal ? <Building2 className="w-3.5 h-3.5 text-slate-400" /> : <UserIcon className="w-3.5 h-3.5 text-slate-400" />}
                        <span className="text-slate-500">کارفرما:</span>
                        <strong className="text-slate-800">{clientName}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        <span>موضوع: </span>
                        <span className="text-slate-700 font-medium">{serviceTitle}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        <span>محل: </span>
                        <span>{p.location.province}، {p.location.city}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Direct Tab Quick Action Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedProject(p);
                        setTargetTab('proforma');
                      }}
                      className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100/80 text-teal-800 text-xs font-bold flex flex-col items-center gap-1 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>پیش‌فاکتور</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedProject(p);
                        setTargetTab('contract');
                      }}
                      className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 text-indigo-800 text-xs font-bold flex flex-col items-center gap-1 transition-colors"
                    >
                      <FileSignature className="w-3.5 h-3.5" />
                      <span>قرارداد</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedProject(p);
                        setTargetTab('statements');
                      }}
                      className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-800 text-xs font-bold flex flex-col items-center gap-1 transition-colors"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>صورت‌وضعیت</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedProject(p);
                        setTargetTab('payments');
                      }}
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 text-xs font-bold flex flex-col items-center gap-1 transition-colors"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>پرداخت‌ها</span>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
