import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'engineering' | 'muted' | 'accent';
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  noPadding = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-2xl border transition-all duration-150 relative overflow-hidden';

  const variantStyles = {
    default: 'bg-white border-slate-200/90 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05)]',
    engineering: 'bg-white border-slate-300/80 shadow-[0_2px_12px_-3px_rgba(11,29,53,0.07)] before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#0B1D35] before:to-transparent',
    muted: 'bg-slate-50 border-slate-200',
    accent: 'bg-gradient-to-br from-slate-900 to-[#0B1D35] border-slate-800 text-white shadow-md',
  }[variant];

  const paddingStyle = noPadding ? '' : 'p-4 sm:p-5';

  return (
    <div className={`${baseStyles} ${variantStyles} ${paddingStyle} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`flex items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`font-bold text-slate-900 text-sm sm:text-base leading-snug ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-xs text-slate-500 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={className} {...props}>
    {children}
  </div>
);
