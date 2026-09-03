import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'info' | 'danger' | 'demo' | 'accent';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }[size];

  const variantStyles = {
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200/80',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    info: 'bg-blue-50 text-blue-800 border border-blue-200/80',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200/80',
    demo: 'bg-indigo-50 text-indigo-900 border border-indigo-200/80 font-bold',
    accent: 'bg-teal-50 text-teal-900 border border-teal-200/80 font-semibold',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full select-none whitespace-nowrap leading-none ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
