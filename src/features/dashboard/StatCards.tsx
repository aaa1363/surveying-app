import React from 'react';
import { FolderKanban, Clock, AlertCircle, Coins } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { DashboardStats } from '../../models/DashboardStats';
import { toPersianDigits, formatToman } from '../../utils/formatters';

export interface StatCardsProps {
  stats: DashboardStats;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  const statItems = [
    {
      id: 'active',
      title: 'پروژه‌های فعال',
      value: toPersianDigits(stats.activeProjectsCount),
      unit: 'پروژه',
      icon: FolderKanban,
      iconBg: 'bg-teal-50 text-teal-700 border-teal-200',
      badgeText: 'در حال برداشت/طراحی',
    },
    {
      id: 'pending',
      title: 'در انتظار تأیید',
      value: toPersianDigits(stats.pendingApprovalCount),
      unit: 'مورد',
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
      badgeText: 'بررسی ناظر / کارفرما',
    },
    {
      id: 'unpaid',
      title: 'فاکتورهای پرداخت‌نشده',
      value: toPersianDigits(stats.unpaidInvoicesCount),
      unit: 'فاکتور',
      icon: AlertCircle,
      iconBg: 'bg-rose-50 text-rose-700 border-rose-200',
      badgeText: 'مطالبات معوق',
    },
    {
      id: 'earnings',
      title: 'مجموع دریافتی ثبت‌شده',
      value: formatToman(stats.totalEarningsToman),
      unit: '',
      icon: Coins,
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeText: 'تراز مالی سال جاری',
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" dir="rtl">
      {statItems.map((item) => {
        const Icon = item.icon;

        return (
          <Card
            key={item.id}
            variant="default"
            className={`p-3.5 sm:p-4.5 flex flex-col justify-between ${
              item.highlight ? 'border-emerald-300/80 bg-gradient-to-b from-white to-emerald-50/20' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-700 truncate">{item.title}</span>
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${item.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className={`font-mono font-black text-lg sm:text-xl text-slate-900 ${
                  item.highlight ? 'text-emerald-950' : ''
                }`}>
                  {item.value}
                </span>
                {item.unit && (
                  <span className="text-[11px] font-semibold text-slate-500">{item.unit}</span>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                <span>{item.badgeText}</span>
                <span className="text-slate-400 font-mono">Demo</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
