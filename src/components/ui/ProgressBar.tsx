import React from 'react';
import { toPersianDigits } from '../../utils/formatters';

export interface ProgressBarProps {
  percentage: number;
  label?: string;
  showPercentText?: boolean;
  color?: 'primary' | 'accent' | 'emerald' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  label,
  showPercentText = true,
  color = 'accent',
  size = 'md',
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, percentage));

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  }[size];

  const colorStyles = {
    primary: 'bg-[#0B1D35]',
    accent: 'bg-teal-600',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-500',
  }[color];

  return (
    <div className={`w-full space-y-1.5 ${className}`} dir="rtl">
      {(label || showPercentText) && (
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
          {label && <span>{label}</span>}
          {showPercentText && (
            <span className="font-mono text-slate-900 font-bold">
              ٪{toPersianDigits(clamped)}
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 ${heightStyles}`}>
        <div
          className={`${heightStyles} ${colorStyles} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
