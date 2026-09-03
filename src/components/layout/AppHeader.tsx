import React from 'react';
import { Bell, LogOut, User as UserIcon, Building2 } from 'lucide-react';
import { User } from '../../models/User';
import { Badge } from '../ui/Badge';
import { toPersianDigits } from '../../utils/formatters';

export interface AppHeaderProps {
  user: User;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onLogout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  user,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs" dir="rtl">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-3 flex items-center justify-between gap-2 min-w-0">

        {/* Brand & User Info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Avatar with fallback */}
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B1D35] to-[#1E3A8A] text-white flex items-center justify-center font-bold text-sm shadow-sm border border-slate-300">
              {user.entityType === 'legal' ? (
                <Building2 className="w-5 h-5 text-teal-300" />
              ) : (
                <UserIcon className="w-5 h-5 text-teal-300" />
              )}
            </div>
            <span className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" title="آنلاین" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate max-w-[160px] sm:max-w-xs">
                {user.fullName || 'کاربر گرامی'}
              </h1>

              <span className="hidden min-[390px]:inline-flex"><Badge variant={user.role === 'admin' ? 'warning' : user.role === 'surveyor' ? 'accent' : 'info'} size="sm">
                {user.role === 'admin' ? 'مدیر · ورود نمایشی' : user.role === 'surveyor' ? 'نقشه‌بردار' : 'کارفرما'}
              </Badge></span>
              <span className="demo-header-badge">نسخه آزمایشی</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {user.entityType === 'legal' ? `نماینده: ${user.representativeName || 'ثبت نشده'}` : 'عضو حقیقی سامانه'}
            </p>
          </div>
        </div>

        {/* Actions (Notifications & Logout) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            aria-label="اعلان‌ها"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white font-mono">
                {toPersianDigits(unreadNotificationsCount)}
              </span>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            title="خروج از حساب کاربری"
            aria-label="خروج از حساب کاربری"
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>

      </div>
    </header>
  );
};
