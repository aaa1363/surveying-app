import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Flag,
  UserCheck,
  History,
  AlertTriangle,
  FileText,
  Search,
  Lock,
  Database,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { User } from '../../models/User';
import {
  SurveyorReview,
  ModerationReport,
  ModerationAuditLog,
  DelegatedAdminPermission,
} from '../../models/Stage6Models';
import {
  moderationRepository,
  surveyorReviewsRepository,
  delegatedPermissionsRepository,
} from '../../repositories';
import { toPersianDigits } from '../../utils/formatters';
import { toJalaliDate } from '../../utils/jalaliDate';
import { DemoDataAdminPanel } from './DemoDataAdminPanel';

export interface ModerationHubViewProps {
  currentUser: User;
}

type ModTab = 'reported_reviews' | 'audit_logs' | 'permissions' | 'demo_data';

export const ModerationHubView: React.FC<ModerationHubViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<ModTab>('reported_reviews');
  const [reportedReviews, setReportedReviews] = useState<SurveyorReview[]>([]);
  const [auditLogs, setAuditLogs] = useState<ModerationAuditLog[]>([]);
  const [userPermission, setUserPermission] = useState<DelegatedAdminPermission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allReviews, logs, perm] = await Promise.all([
        surveyorReviewsRepository.getReviewsForSurveyor('demo-user-123', { userId: currentUser.id, role: currentUser.role, environment: 'demo' }, true),
        moderationRepository.getAuditLogs(),
        delegatedPermissionsRepository.getPermissionsForUser(currentUser.id),
      ]);
      const flagReviews = allReviews.filter((r) => r.isReported || !r.isApproved);
      setReportedReviews(flagReviews);
      setAuditLogs(logs);
      setUserPermission(perm);
    } catch (e) {
      console.error('Failed to load moderation data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  const handleApproveReview = async (review: SurveyorReview) => {
    try {
      await surveyorReviewsRepository.moderateReview({ userId: currentUser.id, role: currentUser.role, environment: 'demo' }, review.id, true, 'بررسی نمایشی محتوا');
      await moderationRepository.logAction({
        action: 'APPROVE_REVIEW',
        targetType: 'review',
        targetId: review.id,
        performedByUserId: currentUser.id,
        details: `نمایش نظر پس از بررسی نمایشی کاربر ${review.clientName}`,
      });
      setActionMessage('نظر بررسی و مورد تأیید قرار گرفت.');
      await loadData();
    } catch (e) {
      console.error('Failed to approve review:', e);
    }
  };

  const handleRejectReview = async (review: SurveyorReview) => {
    try {
      await surveyorReviewsRepository.moderateReview({ userId: currentUser.id, role: currentUser.role, environment: 'demo' }, review.id, false, 'عدم انطباق با ضوابط سامانه');
      await moderationRepository.logAction({
        action: 'HIDE_REVIEW',
        targetType: 'review',
        targetId: review.id,
        performedByUserId: currentUser.id,
        details: `رد و عدم انتشار نظر کاربر ${review.clientName}`,
      });
      setActionMessage('نظر از پروفایل عمومی مخفی شد.');
      await loadData();
    } catch (e) {
      console.error('Failed to reject review:', e);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                مرکز نظارت و انضباطی سامانه
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                پایش نظرات، ممیزی شفافیت و کنترل دسترسی‌ها
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              بررسی گزارش‌های تخلف، تأیید اصالت نظرات کارفرمایان و مدیریت لاگ‌های تغییرات برای تضمین سلامت اکوسیستم.
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/10 overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab('reported_reviews')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'reported_reviews'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <Flag className="w-4 h-4 text-rose-500" />
            نظرات گزارش‌شده ({toPersianDigits(reportedReviews.length)})
          </button>

          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'audit_logs'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <History className="w-4 h-4 text-teal-400" />
            لاگ‌های ممیزی ({toPersianDigits(auditLogs.length)})
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'permissions'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <Lock className="w-4 h-4 text-indigo-400" />
            دسترسی‌ها و تفویض اختیارات
          </button>
          <button
            onClick={() => setActiveTab('demo_data')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${activeTab === 'demo_data' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:bg-white/10'}`}
          >
            <Database className="w-4 h-4 text-sky-400" /> داده Demo
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {activeTab === 'demo_data' && <DemoDataAdminPanel currentUser={currentUser} />}

      {/* Tab 1: Reported Reviews */}
      {activeTab === 'reported_reviews' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              صف بررسی نظرات گزارش‌شده یا معلق ({toPersianDigits(reportedReviews.length)})
            </h3>
            <Badge variant="warning" size="sm">
              نیاز به اقدام مدیر
            </Badge>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">در حال بارگذاری گزارش‌ها...</div>
          ) : reportedReviews.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="w-10 h-10 text-emerald-500" />}
              title="تمام نظرات بررسی شده‌اند"
              description="در حال حاضر هیچ گزارش تخلف یا نظر معلقی در صف رسیدگی وجود ندارد."
            />
          ) : (
            <div className="space-y-3">
              {reportedReviews.map((rev) => (
                <Card key={rev.id} variant="default" className="p-5 space-y-3 border-amber-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">ارسال‌کننده: {rev.clientName}</span>
                        {rev.isReported && (
                          <Badge variant="danger" size="sm">
                            گزارش تخلف ثبت شده
                          </Badge>
                        )}
                        {!rev.isApproved && (
                          <Badge variant="warning" size="sm">
                            در انتظار تأیید
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        نوع خدمت: {rev.projectType} • تاریخ ثبت: <span className="font-mono">{rev.createdAtJalali}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApproveReview(rev)}
                        rightIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                      >
                        نمایش نظر پس از بررسی نمایشی
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRejectReview(rev)}
                        rightIcon={<XCircle className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        رد و مخفی‌سازی نظر
                      </Button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed">
                    «{rev.comment}»
                  </div>

                  {rev.reportReason && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 space-y-0.5">
                      <strong className="block">شرح دلیل گزارش:</strong>
                      <p>{rev.reportReason}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Audit Logs */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              دفترچه ثبت رویدادها و ممیزی سیستم ({toPersianDigits(auditLogs.length)})
            </h3>
            <Badge variant="demo" size="sm">
              Non-repudiation Log
            </Badge>
          </div>

          <Card variant="default" className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3">زمان ثبت</th>
                    <th className="p-3">اقدام نظارتی</th>
                    <th className="p-3">هدف / منبع</th>
                    <th className="p-3">شناسه کاربر اقدام‌کننده</th>
                    <th className="p-3">شرح اقدام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {toJalaliDate(log.timestamp)}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900">{log.action}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        {log.targetType}:{log.targetId.slice(-6)}
                      </td>
                      <td className="p-3 font-mono text-slate-800 text-[11px]">{log.performedByUserId}</td>
                      <td className="p-3 text-slate-600 max-w-xs">{log.details || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Permissions */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              تفویض اختیارات و مجوزهای سامانه
            </h3>
            <Badge variant="accent" size="sm">
              Role-Based Access Control
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card variant="default" className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">مجوزهای نقش مدیر (Admin)</span>
                <Badge variant="success" size="sm">
                  فعال
                </Badge>
              </div>
              <div className="text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>تأیید یا رد گزارش‌های تخلف نظرات</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>بررسی نمایشی مدارک ثبت‌شده</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>مشاهده دفترچه وقایع و لاگ‌های بازرسی</span>
                </div>
              </div>
            </Card>

            <Card variant="default" className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">مجوزهای تفویض‌شده به نقشه‌بردار</span>
                <Badge variant="accent" size="sm">
                  مستقل
                </Badge>
              </div>
              <div className="text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>پاسخ مستقیم به نظرات کارفرمایان</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>ثبت گزارش تخلف روی نظرات غیرواقعی</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>مدیریت کارت‌های تعرفه و خدمات منتشرشده</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

    </div>
  );
};
