import { toEnglishDigits } from './formatters';
export { toEnglishDigits };

export function normalizeIranianMobile(phone: string): string {
  let clean = toEnglishDigits(phone).replace(/\s+/g, '').replace(/-/g, '');
  
  // Format +989... or 00989... to 09...
  if (clean.startsWith('+98')) {
    clean = '0' + clean.slice(3);
  } else if (clean.startsWith('0098')) {
    clean = '0' + clean.slice(4);
  } else if (clean.startsWith('98') && clean.length === 12) {
    clean = '0' + clean.slice(2);
  } else if (clean.length === 10 && clean.startsWith('9')) {
    clean = '0' + clean;
  }
  
  return clean;
}

export function isValidIranianMobile(phone: string): boolean {
  const normalized = normalizeIranianMobile(phone);
  // Valid Iranian mobile number format: 09 followed by 9 digits
  const regex = /^09[0-9]{9}$/;
  return regex.test(normalized);
}

export function cleanPersianText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

export function isValidLatitude(lat: number | null | undefined): boolean {
  return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
}

export function isValidLongitude(lng: number | null | undefined): boolean {
  return typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;
}

export function isIranianLatitude(lat: number | null | undefined): boolean {
  return typeof lat === 'number' && !isNaN(lat) && lat >= 24 && lat <= 40;
}

export function isIranianLongitude(lng: number | null | undefined): boolean {
  return typeof lng === 'number' && !isNaN(lng) && lng >= 44 && lng <= 64;
}

export function isValidIranianNationalId(code: string): boolean {
  const clean = toEnglishDigits(code).trim();
  if (!/^\d{10}$/.test(clean)) return false;
  if (/^(\d)\1{9}$/.test(clean)) return false;

  const check = parseInt(clean[9], 10);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * (10 - i);
  }
  const rem = sum % 11;
  return (rem < 2 && check === rem) || (rem >= 2 && check === 11 - rem);
}

