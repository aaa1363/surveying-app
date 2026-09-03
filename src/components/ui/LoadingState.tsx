import React from 'react';

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'در حال بارگذاری اطلاعات...',
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center ${className}`}
      dir="rtl"
    >
      <div className="relative mb-4">
        <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-[#0B1D35] animate-spin" />
      </div>
      <p className="text-xs font-semibold text-slate-600 animate-pulse">{message}</p>
    </div>
  );
};
