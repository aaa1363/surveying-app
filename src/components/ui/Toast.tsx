import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastProps {
  id?: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  onClose,
}) => {
  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-white border-emerald-200 text-slate-800 shadow-lg',
    error: 'bg-white border-rose-200 text-slate-800 shadow-lg',
    info: 'bg-white border-blue-200 text-slate-800 shadow-lg',
  }[type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border max-w-md w-full select-none ${bgStyles}`}
      dir="rtl"
    >
      {iconMap[type]}
      <p className="text-xs font-semibold flex-1 leading-snug">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="بستن پیام"
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
