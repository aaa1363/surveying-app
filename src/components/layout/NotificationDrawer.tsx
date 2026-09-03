import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { Notification } from '../../models/Notification';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
}) => {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-600 shrink-0" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="اعلان‌ها و پیام‌های سامانه"
      description="پیام‌های سیستمی و هشدارهای پروژه (داده‌های Demo)"
      maxWidth="md"
    >
      <div className="space-y-2.5 text-right" dir="rtl">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            اعلان جدیدی وجود ندارد.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3.5 rounded-xl border transition-colors ${
                notif.read
                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                  : 'bg-white border-slate-300 shadow-xs text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  {getIcon(notif.type)}
                  <span>{notif.title}</span>
                </div>
                <Badge variant="neutral" size="sm">
                  {notif.date}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pr-5">
                {notif.message}
              </p>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};
