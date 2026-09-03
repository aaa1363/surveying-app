const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toPersianDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return str.replace(/[0-9]/g, (w) => PERSIAN_DIGITS[+w]);
}

export function toEnglishDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  let str = String(input);
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(PERSIAN_DIGITS[i], 'g'), String(i));
    str = str.replace(new RegExp(ARABIC_DIGITS[i], 'g'), String(i));
  }
  return str;
}

export function formatToman(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '۰ تومان';
  const num = typeof amount === 'number' ? amount : parseFloat(toEnglishDigits(amount));
  if (isNaN(num)) return '۰ تومان';
  
  const formatted = Math.round(num).toLocaleString('fa-IR');
  return `${formatted} تومان`;
}

export function formatNumberWithCommas(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '۰';
  const num = typeof amount === 'number' ? amount : parseFloat(toEnglishDigits(amount));
  if (isNaN(num)) return '۰';
  return Math.round(num).toLocaleString('fa-IR');
}

export function formatPhoneNumber(phone: string): string {
  const clean = toEnglishDigits(phone).replace(/\D/g, '');
  if (clean.length === 11 && clean.startsWith('09')) {
    return toPersianDigits(`${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`);
  }
  return toPersianDigits(phone);
}

/** Converts a non-fractional Toman amount to Persian words. */
export function numberToPersianWords(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return 'صفر تومان';
  const parsed = typeof amount === 'number' ? amount : Number(toEnglishDigits(amount));
  const num = Math.round(parsed);
  if (!Number.isFinite(num) || num === 0) return 'صفر تومان';
  if (num < 0) return `منفی ${numberToPersianWords(Math.abs(num))}`;

  const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
  const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  const hundreds = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
  const scales = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

  const convertChunk = (chunk: number): string => {
    const parts: string[] = [];
    const hundred = Math.floor(chunk / 100);
    const remainder = chunk % 100;
    const ten = Math.floor(remainder / 10);
    const one = remainder % 10;
    if (hundred > 0) parts.push(hundreds[hundred]);
    if (remainder >= 10 && remainder < 20) parts.push(teens[remainder - 10]);
    else {
      if (ten > 0) parts.push(tens[ten]);
      if (one > 0) parts.push(ones[one]);
    }
    return parts.join(' و ');
  };

  const chunks: number[] = [];
  let remaining = num;
  while (remaining > 0) {
    chunks.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }
  const words = chunks
    .map((chunk, index) => chunk > 0 ? `${convertChunk(chunk)}${scales[index] ? ` ${scales[index]}` : ''}` : '')
    .filter(Boolean)
    .reverse();
  return `${words.join(' و ')} تومان`;
}
