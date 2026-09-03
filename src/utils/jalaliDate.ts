import { toEnglishDigits } from './formatters';
import {isValidJalaaliDate, jalaaliMonthLength, toGregorian} from 'jalaali-js';

/**
 * Jalali (Solar Hijri) Date Utility and Validator
 */

/**
 * Gets the approximate current Jalali date string in YYYY/MM/DD format
 */
export function getCurrentJalaliDate(): string {
  return toJalaliDate(new Date());
}

/**
 * Converts a Date object or ISO string to a Jalali YYYY/MM/DD format string
 */
export function toJalaliDate(dateInput?: Date | string | number): string {
  try {
    const d = dateInput ? (typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput) : new Date();
    if (isNaN(d.getTime())) return '1404/06/15';
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(d);
    const year = toEnglishDigits(parts.find((p) => p.type === 'year')?.value || '1404');
    const month = toEnglishDigits(parts.find((p) => p.type === 'month')?.value || '01').padStart(2, '0');
    const day = toEnglishDigits(parts.find((p) => p.type === 'day')?.value || '01').padStart(2, '0');
    return `${year}/${month}/${day}`;
  } catch {
    return '1404/06/15';
  }
}

/**
 * Extracts the Jalali year number from a YYYY/MM/DD date string (or current year)
 */
export function getJalaliYear(dateStr?: string): number {
  if (!dateStr) {
    const cur = getCurrentJalaliDate();
    return parseInt(cur.split('/')[0], 10) || 1404;
  }
  const clean = toEnglishDigits(dateStr).trim();
  const match = clean.match(/^(\d{4})/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 1404;
}

/**
 * Validates a Jalali date string strictly against YYYY/MM/DD and calendar boundaries
 * Months 1-6 have 31 days, 7-11 have 30 days, month 12 has 29 or 30 days.
 */
export function isValidJalaliDate(dateStr: string): { isValid: boolean; error?: string } {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isValid: false, error: 'تاریخ وارد نشده است.' };
  }

  const clean = toEnglishDigits(dateStr).trim();
  const regex = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/;
  const match = clean.match(regex);

  if (!match) {
    return { isValid: false, error: 'قالب تاریخ باید به‌صورت ۱۴۰۵/۰۶/۱۵ باشد.' };
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (year < 1300 || year > 1500) {
    return { isValid: false, error: 'سال شمسی باید بین ۱۳۰۰ تا ۱۵۰۰ باشد.' };
  }

  if (month < 1 || month > 12) {
    return { isValid: false, error: 'ماه باید عددی بین ۱ تا ۱۲ باشد.' };
  }

  if (day < 1) {
    return { isValid: false, error: 'روز باید حداقل ۱ باشد.' };
  }

  if (!isValidJalaaliDate(year, month, day)) return { isValid: false, error: `روز انتخاب‌شده برای این ماه معتبر نیست (حداکثر ${jalaaliMonthLength(year, month)} روز).` };

  return { isValid: true };
}

export function isCompleteJalaliInput(value: string): boolean {
  return /^\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2}$/.test(toEnglishDigits(value).trim());
}

export function jalaliWeekday(year: number, month: number, day = 1): number {
  const gregorian = toGregorian(year, month, day);
  return new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd).getDay();
}

/**
 * Normalizes a Jalali date string to standard YYYY/MM/DD with leading zeros
 */
export function normalizeJalaliDate(dateStr: string): string {
  if (!dateStr) return '';
  const clean = toEnglishDigits(dateStr).trim().replace(/-/g, '/').replace(/\./g, '/');
  const parts = clean.split('/');
  if (parts.length === 3) {
    const year = parts[0].padStart(4, '0');
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${year}/${month}/${day}`;
  }
  return clean;
}

/**
 * Compares two normalized Jalali dates.
 * Returns -1 if date1 < date2, 0 if date1 === date2, 1 if date1 > date2.
 */
export function compareJalaliDates(date1: string, date2: string): number {
  const norm1 = normalizeJalaliDate(date1);
  const norm2 = normalizeJalaliDate(date2);
  if (norm1 < norm2) return -1;
  if (norm1 > norm2) return 1;
  return 0;
}
