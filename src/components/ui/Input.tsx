import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  rightIcon,
  leftIcon,
  className = '',
  id,
  disabled,
  type,
  ...props
}, ref) => {
  const inputId = id || (label ? `input-${label.replace(/\s+/g, '-')}` : undefined);
  const inferredInputMode = props.inputMode || (/موبایل|تلفن/.test(label || '') ? 'tel' : /مبلغ|نرخ|مساحت|تعداد|سال|مختصات|عرض|طول/.test(label || '') ? 'decimal' : undefined);
  const isNumericInput = inferredInputMode === 'numeric' || inferredInputMode === 'decimal';

  return (
    <div className="w-full space-y-1.5 text-right" dir="rtl">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-slate-700">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
            {rightIcon}
          </div>
        )}

        <input
          id={inputId}
          ref={ref}
          disabled={disabled}
          type={isNumericInput ? 'text' : type}
          inputMode={inferredInputMode}
          pattern={props.pattern || (isNumericInput ? '[0-9۰-۹٠-٩.,٫٬-]*' : undefined)}
          enterKeyHint={props.enterKeyHint || (isNumericInput ? 'next' : undefined)}
          className={`w-full bg-slate-50 border rounded-xl py-2.5 text-sm text-slate-800 transition-colors duration-150 focus:bg-white focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
            rightIcon ? 'pr-10' : 'pr-3.5'
          } ${leftIcon ? 'pl-10' : 'pl-3.5'} ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900 bg-rose-50/20'
              : 'border-slate-300 focus:border-[#0B1D35] focus:ring-[#0B1D35]/15'
          } ${className}`}
          {...props}
        />

        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-rose-600 leading-tight flex items-center gap-1">
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500 leading-tight">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
