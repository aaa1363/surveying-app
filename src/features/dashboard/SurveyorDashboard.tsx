import React, { useEffect, useState } from 'react';
import { BriefcaseBusiness, CalendarClock, CheckCircle2, FileCheck2, FileClock, WalletCards, TrendingUp } from 'lucide-react';
import { toGregorian } from 'jalaali-js';
import { SurveyorDashboardProps } from './types';
import { invoicesRepository, projectRepository } from '../../repositories';
import { LoadingState } from '../../components/ui/LoadingState';
import { getErrorMessage } from '../../utils/errors';
import { formatToman } from '../../utils/formatters';
import { isValidJalaliDate } from '../../utils/jalaliDate';

export interface SurveyorDashboardMetrics {
  activeProjects: number; dueSoonProjects: number; completedProjects: number;
  paidInvoices: number; paidInvoiceAmount: number; unpaidInvoices: number;
  unpaidInvoiceAmount: number; confirmedReceipts: number; remainingReceivables: number; collectionRate: number;
}

const daysUntil = (jalali?: string): number | null => {
  if (!jalali || !isValidJalaliDate(jalali).isValid) return null;
  const [jy, jm, jd] = jalali.split('/').map(Number);
  const g = toGregorian(jy, jm, jd);
  return Math.ceil((new Date(g.gy, g.gm - 1, g.gd).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
};

export const calculateCollectionRate = (received: number, receivable: number) =>
  receivable > 0 ? Math.min(100, Math.max(0, (received / receivable) * 100)) : 0;

export const SurveyorDashboard: React.FC<SurveyorDashboardProps> = ({ user, onNavigateToProjects, onNavigateToDocuments }) => {
  const [metrics, setMetrics] = useState<SurveyorDashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    setError(null);
    try {
      const projects = (await projectRepository.getProjects(user.id)).filter(p => !p.deletedAt && p.status !== 'draft' && p.status !== 'archived');
      const invoices = (await Promise.all(projects.map(p => invoicesRepository.getInvoices(user.id, p.id)))).flat().filter(i => i.status !== 'draft' && i.status !== 'cancelled');
      const confirmedReceipts = invoices.reduce((sum, i) => sum + Math.max(0, Math.min(i.paidAmount, i.totalAmount)), 0);
      const remainingReceivables = invoices.reduce((sum, i) => sum + Math.max(0, i.remainingBalance), 0);
      const paid = invoices.filter(i => i.status === 'settled' || i.remainingBalance === 0);
      const unpaid = invoices.filter(i => i.remainingBalance > 0);
      setMetrics({
        activeProjects: projects.filter(p => ['active', 'planned', 'paused'].includes(p.status)).length,
        dueSoonProjects: projects.filter(p => { const d = daysUntil(p.agreedDeliveryDateJalali); return p.status !== 'completed' && d !== null && d >= 0 && d <= 14; }).length,
        completedProjects: projects.filter(p => p.status === 'completed').length,
        paidInvoices: paid.length, paidInvoiceAmount: paid.reduce((sum, i) => sum + i.totalAmount, 0),
        unpaidInvoices: unpaid.length, unpaidInvoiceAmount: remainingReceivables,
        confirmedReceipts, remainingReceivables,
        collectionRate: calculateCollectionRate(confirmedReceipts, confirmedReceipts + remainingReceivables),
      });
    } catch (cause) { setError(getErrorMessage(cause, 'خطا در بارگذاری اطلاعات داشبورد')); }
  };
  useEffect(() => { void load(); }, [user.id]);
  if (!metrics && !error) return <LoadingState message="در حال محاسبه شاخص‌های واقعی داشبورد..." className="py-20" />;
  if (error || !metrics) return <div className="dashboard-error" role="alert"><p>{error}</p><button onClick={load}>تلاش مجدد</button></div>;
  const Metric = ({ icon: Icon, title, children, onClick }: { icon: typeof BriefcaseBusiness; title: string; children: React.ReactNode; onClick: () => void }) => <button type="button" className="dashboard-metric-card" onClick={onClick}><span className="dashboard-metric-icon"><Icon aria-hidden="true" /></span><span className="min-w-0 flex-1"><strong>{title}</strong><span className="dashboard-metric-content">{children}</span></span></button>;
  return <section className="dashboard-modern" aria-label="داشبورد نقشه‌بردار">
    <header className="page-header"><div><h2 className="text-xl font-black">داشبورد نقشه‌بردار</h2><p>نمای یکپارچه پروژه‌ها و وضعیت وصول</p></div></header>
    <div className="dashboard-grid">
      <Metric icon={BriefcaseBusiness} title="خلاصه پروژه‌ها" onClick={onNavigateToProjects}><span><bdi>{metrics.activeProjects.toLocaleString('fa-IR')}</bdi> فعال</span><span><CalendarClock /> <bdi>{metrics.dueSoonProjects.toLocaleString('fa-IR')}</bdi> نزدیک موعد</span><span><CheckCircle2 /> <bdi>{metrics.completedProjects.toLocaleString('fa-IR')}</bdi> تکمیل‌شده</span></Metric>
      <Metric icon={FileCheck2} title="فاکتورها" onClick={() => onNavigateToDocuments()}><span><FileCheck2 /> پرداخت‌شده: <bdi dir="ltr">{metrics.paidInvoices.toLocaleString('fa-IR')} · {formatToman(metrics.paidInvoiceAmount)}</bdi></span><span><FileClock /> پرداخت‌نشده: <bdi dir="ltr">{metrics.unpaidInvoices.toLocaleString('fa-IR')} · {formatToman(metrics.unpaidInvoiceAmount)}</bdi></span></Metric>
      <Metric icon={WalletCards} title="خلاصه مالی" onClick={() => onNavigateToDocuments()}><span>دریافتی تأییدشده <bdi dir="ltr">{formatToman(metrics.confirmedReceipts)}</bdi></span><span>مطالبات باقی‌مانده <bdi dir="ltr">{formatToman(metrics.remainingReceivables)}</bdi></span></Metric>
      <Metric icon={TrendingUp} title="نرخ وصول" onClick={() => onNavigateToDocuments()}><span className="dashboard-rate"><bdi dir="ltr">{metrics.collectionRate.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}٪</bdi></span><span className="dashboard-progress"><i style={{ width: `${metrics.collectionRate}%` }} /></span><small>دریافتی تقسیم بر کل مبلغ قابل دریافت</small></Metric>
    </div>
  </section>;
};
