import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Input } from './Input';
import { getCurrentJalaliDate, isCompleteJalaliInput, isValidJalaliDate, jalaliWeekday, normalizeJalaliDate } from '../../utils/jalaliDate';
import { toEnglishDigits, toPersianDigits } from '../../utils/formatters';
import { jalaaliMonthLength } from 'jalaali-js';

interface PersianDateInputProps { id: string; label: string; value: string; onChange: (value: string) => void; error?: string; helperText?: string; required?: boolean; }
const months = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

export const PersianDateInput: React.FC<PersianDateInputProps> = ({ id, label, value, onChange, error, helperText, required }) => {
  const initial = normalizeJalaliDate(isValidJalaliDate(value).isValid ? value : getCurrentJalaliDate()).split('/').map(Number);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(initial[0]);
  const [month, setMonth] = useState(initial[1]);
  const [pending, setPending] = useState(normalizeJalaliDate(value));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const close = () => { setOpen(false); requestAnimationFrame(() => triggerRef.current?.focus()); };
  useEffect(() => {
    if (!open) return;
    setPending(normalizeJalaliDate(value));
    dialogRef.current?.querySelector<HTMLButtonElement>('[data-selected="true"],button[data-day]')?.focus();
    const onPop = () => close();
    history.pushState({ calendar: id }, '');
    addEventListener('popstate', onPop, { once: true });
    return () => removeEventListener('popstate', onPop);
  }, [open]);
  const onText = (raw: string) => onChange(toEnglishDigits(raw).replace(/[^0-9/.-]/g, '').replace(/[.-]/g, '/'));
  const onBlur = () => { if (value.trim() && isCompleteJalaliInput(value) && isValidJalaliDate(value).isValid) onChange(normalizeJalaliDate(value)); };
  const changeMonth = (delta: number) => { const index = year * 12 + month - 1 + delta; setYear(Math.floor(index / 12)); setMonth(index % 12 + 1); };
  const selected = normalizeJalaliDate(pending);
  const today = getCurrentJalaliDate();
  const offset = (jalaliWeekday(year, month) + 1) % 7;
  const days = Array.from({ length: jalaaliMonthLength(year, month) }, (_, i) => i + 1);
  const panel = open ? <div className="persian-calendar-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={`${id}-calendar-title`} className="persian-calendar-sheet" dir="rtl" onKeyDown={e => { if (e.key === 'Escape') close(); }}>
      <div className="persian-calendar-header"><button type="button" aria-label="بستن تقویم" onClick={close}><X /></button><strong id={`${id}-calendar-title`}>انتخاب {label}</strong><span /></div>
      <div className="persian-calendar-month"><button type="button" aria-label="ماه بعد" onClick={() => changeMonth(1)}><ChevronRight /></button><strong>{months[month - 1]} {toPersianDigits(year)}</strong><button type="button" aria-label="ماه قبل" onClick={() => changeMonth(-1)}><ChevronLeft /></button></div>
      <div className="persian-calendar-scroll"><div className="persian-calendar-week">{['ش','ی','د','س','چ','پ','ج'].map(d => <span key={d}>{d}</span>)}</div><div className="persian-calendar-days">{Array.from({ length: offset }, (_, i) => <span key={`e${i}`} />)}{days.map(day => { const canonical = `${year}/${String(month).padStart(2,'0')}/${String(day).padStart(2,'0')}`; return <button key={day} data-day data-selected={canonical === selected} data-today={canonical === today} type="button" onClick={() => setPending(canonical)}>{toPersianDigits(day)}</button>; })}</div></div>
      <div className="persian-calendar-actions"><button type="button" onClick={() => { const parts = today.split('/').map(Number); setYear(parts[0]); setMonth(parts[1]); setPending(today); }}>امروز</button>{!required && <button type="button" onClick={() => setPending('')}>پاک‌کردن</button>}<button type="button" onClick={close}>انصراف</button><button type="button" className="calendar-confirm" onClick={() => { onChange(pending); close(); }}>تأیید تاریخ</button></div>
    </div>
  </div> : null;
  return <div className="relative"><Input id={id} label={`${label}${required ? ' *' : ''}`} value={toPersianDigits(value)} onChange={e => onText(e.target.value)} onBlur={onBlur} inputMode="numeric" pattern="[0-9۰-۹٠-٩/.-]*" autoComplete="off" dir="ltr" className="font-mono text-center min-h-11" error={error} helperText={helperText} leftIcon={<button ref={triggerRef} type="button" aria-label={`بازکردن تقویم ${label}`} className="pointer-events-auto min-w-11 min-h-11 flex items-center justify-center" onMouseDown={e => e.preventDefault()} onClick={() => setOpen(true)}><Calendar className="w-5 h-5" /></button>} />{typeof document !== 'undefined' && panel ? createPortal(panel, document.body) : null}</div>;
};
