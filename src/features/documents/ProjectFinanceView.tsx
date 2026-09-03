import React, { lazy, Suspense, useState } from 'react';
import {
  FileText,
  FileSignature,
  FileSpreadsheet,
  Coins,
  ArrowRight,
  Building2,
  User as UserIcon,
  Phone,
  Layers,
} from 'lucide-react';
import { SurveyProject, User } from '../../models';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { toPersianDigits } from '../../utils/formatters';
import { LoadingState } from '../../components/ui/LoadingState';

const ProformaTab = lazy(() => import('./components/ProformaTab').then((module) => ({ default: module.ProformaTab })));
const ContractTab = lazy(() => import('./components/ContractTab').then((module) => ({ default: module.ContractTab })));
const StatementsTab = lazy(() => import('./components/StatementsTab').then((module) => ({ default: module.StatementsTab })));
const PaymentsTab = lazy(() => import('./components/PaymentsTab').then((module) => ({ default: module.PaymentsTab })));

export type FinanceTabType = 'proforma' | 'contract' | 'statements' | 'payments';

interface ProjectFinanceViewProps {
  project: SurveyProject;
  user: User;
  onBack: () => void;
  initialTab?: FinanceTabType;
}

export const ProjectFinanceView: React.FC<ProjectFinanceViewProps> = ({
  project,
  user,
  onBack,
  initialTab = 'proforma',
}) => {
  const [activeTab, setActiveTab] = useState<FinanceTabType>(initialTab);

  const isLegal = project.clientSnapshot.type === 'legal';
  const clientName = isLegal
    ? project.clientSnapshot.companyName || 'کارفرمای حقوقی'
    : project.clientSnapshot.fullName || 'کارفرمای حقیقی';

  const tabs: { id: FinanceTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'proforma', label: 'پیش‌فاکتور', icon: <FileText className="w-4 h-4" /> },
    { id: 'contract', label: 'قرارداد', icon: <FileSignature className="w-4 h-4" /> },
    { id: 'statements', label: 'صورت‌وضعیت و صورتحساب', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'payments', label: 'پرداخت‌ها و اقساط', icon: <Coins className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 text-right pb-16" dir="rtl">
      
      {/* Top Project Breadcrumb & Summary Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="text-slate-600 hover:bg-slate-100"
          >
            بازگشت
          </Button>

          <div className="h-6 w-px bg-slate-200" />

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <bdi dir="ltr" className="font-mono text-xs font-bold px-2 py-0.5 bg-[#0B1D35] text-white rounded">{project.projectCode}</bdi>
              <h2 className="font-black text-slate-900 text-base sm:text-lg">
                {project.title}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                {isLegal ? <Building2 className="w-3.5 h-3.5 text-slate-400" /> : <UserIcon className="w-3.5 h-3.5 text-slate-400" />}
                {clientName}
              </span>
              {project.clientSnapshot.phone && (
                <span>• تماس: <bdi dir="ltr" className="font-mono font-bold text-slate-700">{toPersianDigits(project.clientSnapshot.phone)}</bdi></span>
              )}
              <span>• محل: {project.location.province}، {project.location.city}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern High-Contrast Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-white text-[#0B1D35] shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span className={isActive ? 'text-teal-600' : 'text-slate-400'}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div>
        <Suspense fallback={<LoadingState message="در حال بارگذاری اطلاعات مالی پروژه..." className="py-12" />}>
        {activeTab === 'proforma' && (
          <ProformaTab project={project} user={user} />
        )}
        {activeTab === 'contract' && (
          <ContractTab project={project} user={user} />
        )}
        {activeTab === 'statements' && (
          <StatementsTab project={project} user={user} />
        )}
        {activeTab === 'payments' && (
          <PaymentsTab project={project} user={user} />
        )}
        </Suspense>
      </div>

    </div>
  );
};
