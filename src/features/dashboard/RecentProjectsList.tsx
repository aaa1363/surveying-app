import React from 'react';
import { FolderKanban, ArrowLeft, Building, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { RecentProject, RecentProjectStatus } from '../../models/RecentProject';
import { formatToman } from '../../utils/formatters';

export interface RecentProjectsListProps {
  projects: RecentProject[];
  onViewAllProjects: () => void;
}

export const RecentProjectsList: React.FC<RecentProjectsListProps> = ({
  projects,
  onViewAllProjects,
}) => {
  const getStatusBadge = (status: RecentProjectStatus, label: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="sm">{label}</Badge>;
      case 'pending_approval':
        return <Badge variant="warning" size="sm">{label}</Badge>;
      case 'in_progress':
        return <Badge variant="accent" size="sm">{label}</Badge>;
      default:
        return <Badge variant="info" size="sm">{label}</Badge>;
    }
  };

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>پروژه‌های اخیر مهندسی</CardTitle>
          <Badge variant="demo" size="sm">
            داده‌های نمونه Demo
          </Badge>
        </div>
        <button
          onClick={onViewAllProjects}
          className="text-xs font-bold text-[#0B1D35] hover:text-teal-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>مشاهده لیست کامل</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      </CardHeader>

      <div className="space-y-3" dir="rtl">
        {projects.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            پروژه‌ای برای نمایش وجود ندارد.
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all space-y-3"
            >
              {/* Top Row: Title, Service & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-[#0B1D35] shrink-0" />
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                      {project.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 pr-6">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-400" />
                      {project.serviceType}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-400" />
                      {project.clientName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {getStatusBadge(project.status, project.statusLabel)}
                  <span className="text-[10px] text-slate-400 font-mono">{project.date}</span>
                </div>
              </div>

              {/* Bottom Row: Progress & Financial Amount in Toman */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-2 border-t border-slate-100">
                <div className="sm:col-span-7">
                  <ProgressBar
                    percentage={project.progressPercentage}
                    size="sm"
                    label="پیشرفت فیزیکی عملیات:"
                    color={project.progressPercentage === 100 ? 'emerald' : 'accent'}
                  />
                </div>

                <div className="sm:col-span-5 flex items-center justify-between sm:justify-end gap-2 text-xs">
                  <span className="text-slate-500 text-[11px]">مبلغ قرارداد:</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {formatToman(project.amountToman)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
