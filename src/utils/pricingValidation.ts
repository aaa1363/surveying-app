import { PricingSettings } from '../models';

export type CurrencyUnit = 'TOMAN';

export const PRICING_LIMITS = Object.freeze({
  maxMoney: 9_000_000_000_000,
  maxQuantity: 1_000_000_000,
  minCoefficient: 0.5,
  maxCoefficient: 3,
  maxProfitPercent: 500,
  maxConfidenceThreshold: 1_000_000,
  minIqrMultiplier: 0.1,
  maxIqrMultiplier: 10,
  minEconomicFactor: 0.01,
  maxSpecializedFactor: 5,
});

export class PricingValidationError extends Error {
  constructor(message: string) { super(message); this.name = 'PricingValidationError'; }
}

export function finiteNumber(value: unknown, label: string): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) throw new PricingValidationError(`${label} باید یک عدد معتبر باشد.`);
  return number;
}

export function boundedNumber(value: unknown, label: string, min: number, max: number): number {
  const number = finiteNumber(value, label);
  if (number < min || number > max) throw new PricingValidationError(`${label} باید بین ${min} و ${max} باشد.`);
  return number;
}

export function money(value: unknown, label: string, allowZero = true): number {
  const number = boundedNumber(value, label, allowZero ? 0 : Number.EPSILON, PRICING_LIMITS.maxMoney);
  if (!Number.isSafeInteger(Math.round(number))) throw new PricingValidationError(`${label} از محدوده امن محاسبه خارج است.`);
  return number;
}

export function safeAdd(label: string, ...values: number[]): number {
  const result = values.reduce((sum, value) => sum + finiteNumber(value, label), 0);
  if (!Number.isFinite(result) || Math.abs(result) > Number.MAX_SAFE_INTEGER) throw new PricingValidationError(`${label} از محدوده امن محاسبه خارج است.`);
  return result;
}

export function safeMultiply(label: string, ...values: number[]): number {
  const result = values.reduce((product, value) => product * finiteNumber(value, label), 1);
  if (!Number.isFinite(result) || Math.abs(result) > Number.MAX_SAFE_INTEGER) throw new PricingValidationError(`${label} از محدوده امن محاسبه خارج است.`);
  return result;
}

export function roundMoney(value: number, label = 'مبلغ نهایی'): number {
  const rounded = Math.round(finiteNumber(value, label));
  if (rounded < 0 || !Number.isSafeInteger(rounded) || rounded > PRICING_LIMITS.maxMoney) throw new PricingValidationError(`${label} معتبر نیست.`);
  return rounded;
}

export function validatePricingSettings(settings: PricingSettings): PricingSettings {
  const tariffWeight = boundedNumber(settings.tariffWeight, 'وزن تعرفه', 0, 1);
  const marketWeight = boundedNumber(settings.marketWeight, 'وزن بازار', 0, 1);
  const sum = safeAdd('مجموع وزن‌ها', tariffWeight, marketWeight);
  if (sum <= 0) throw new PricingValidationError('مجموع وزن تعرفه و بازار باید بیشتر از صفر باشد.');
  const low = boundedNumber(settings.confidenceThresholdLow, 'حد اطمینان پایین', 1, PRICING_LIMITS.maxConfidenceThreshold);
  const medium = boundedNumber(settings.confidenceThresholdMedium, 'حد اطمینان بالا', 1, PRICING_LIMITS.maxConfidenceThreshold);
  if (!Number.isInteger(low) || !Number.isInteger(medium) || medium <= low) throw new PricingValidationError('حدود اطمینان باید عدد صحیح و حد بالا بزرگ‌تر از حد پایین باشد.');
  return {
    ...settings,
    tariffWeight: tariffWeight / sum,
    marketWeight: marketWeight / sum,
    economicFactor: boundedNumber(settings.economicFactor, 'ضریب اقتصادی', PRICING_LIMITS.minEconomicFactor, 1),
    specializedFactor: boundedNumber(settings.specializedFactor, 'ضریب تخصصی', 1, PRICING_LIMITS.maxSpecializedFactor),
    confidenceThresholdLow: low,
    confidenceThresholdMedium: medium,
    outlierIqrMultiplier: boundedNumber(settings.outlierIqrMultiplier, 'ضریب IQR', PRICING_LIMITS.minIqrMultiplier, PRICING_LIMITS.maxIqrMultiplier),
  };
}
