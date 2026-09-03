/**
 * Pure Mathematical & Statistical Pricing Engine for Surveying Services
 * Stage 4 - Pure Functions without Side Effects
 */

import {
  SurveyingUnit,
  PricingSettings,
  PriceLevel,
  PriceComparisonLabel,
  ConfidenceLevel,
  MarketPriceRecord,
  MarketStatistics,
  EmployerPriceSummary,
} from '../models';
import { getCurrentJalaliDate } from './jalaliDate';
import { numberToPersianWords } from './formatters';
import { boundedNumber, money, PRICING_LIMITS, roundMoney, safeAdd, safeMultiply, validatePricingSettings } from './pricingValidation';

export interface PricingCalculationInputs {
  actualCost: number; // Toman
  quantity: number;
  unit: SurveyingUnit;
  baseRate: number; // Toman
  minAmount: number; // Toman
  locationCoefficient: number;
  difficultyCoefficient: number;
  riskCoefficient: number;
  qualityCoefficient: number;
  profitPercent: number; // e.g. 20 for 20%
  taxesAndDeductions?: number; // Toman
  selectedLevel: PriceLevel;
  customPriceAmount?: number;
}

export interface PricingCalculationResult {
  actualCost: number;
  costBasedPrice: number;
  baseRate: number;
  minAmount: number;
  calculatedTariff: number;
  adjustedTariff: number;
  marketMedian: number;
  marketTotalMedian: number;
  referencePrice: number;
  sampleCount: number;
  confidenceLevel: ConfidenceLevel;
  confidenceMessage: string;
  economicPrice: number;
  standardPrice: number;
  specializedPrice: number;
  selectedLevel: PriceLevel;
  finalPrice: number;
  customPriceAmount?: number;
  comparisonLabel: PriceComparisonLabel;
  comparisonLabelText: string;
  warnings: string[];
}

/**
 * Calculates median and quartiles using Interquartile Range (IQR) method
 * Tagging outliers without deleting records from database.
 */
export function analyzeMarketRecordsIQR(
  records: MarketPriceRecord[],
  multiplier = 1.5
): {
  validRecords: MarketPriceRecord[];
  outlierRecords: MarketPriceRecord[];
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
  median: number;
} {
  if (!records || records.length === 0) {
    return {
      validRecords: [],
      outlierRecords: [],
      q1: 0,
      q3: 0,
      iqr: 0,
      lowerBound: 0,
      upperBound: 0,
      median: 0,
    };
  }

  const structurallyValid = records.filter((r) =>
    (r.schemaVersion === undefined || r.schemaVersion === 1) && Number.isFinite(r.unitPrice) && r.unitPrice > 0
  );
  const invalidRecords = records.filter((r) => !structurallyValid.includes(r));
  const cleanPrices = structurallyValid
    .map((r) => r.unitPrice)
    .sort((a, b) => a - b);

  if (cleanPrices.length === 0) {
    return {
      validRecords: [],
      outlierRecords: [],
      q1: 0,
      q3: 0,
      iqr: 0,
      lowerBound: 0,
      upperBound: 0,
      median: 0,
    };
  }

  const getPercentile = (arr: number[], q: number): number => {
    const pos = (arr.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (arr[base + 1] !== undefined) {
      return arr[base] + rest * (arr[base + 1] - arr[base]);
    }
    return arr[base];
  };

  const median = getPercentile(cleanPrices, 0.5);
  const q1 = getPercentile(cleanPrices, 0.25);
  const q3 = getPercentile(cleanPrices, 0.75);
  const iqr = Math.max(0, q3 - q1);

  // If sample size is small (< 4), fences don't aggressively tag outliers
  const lowerBound = cleanPrices.length >= 4 ? Math.max(0, q1 - multiplier * iqr) : 0;
  const upperBound = cleanPrices.length >= 4 ? q3 + multiplier * iqr : Infinity;

  const validRecords: MarketPriceRecord[] = [];
  const outlierRecords: MarketPriceRecord[] = [];

  for (const record of structurallyValid) {
    const price = record.unitPrice;
    if (price >= lowerBound && price <= upperBound) {
      validRecords.push({ ...record, isOutlier: false });
    } else {
      outlierRecords.push({ ...record, isOutlier: true });
    }
  }
  outlierRecords.push(...invalidRecords.map((record) => ({ ...record, isOutlier: true })));

  const validPrices = validRecords.map((record) => record.unitPrice).sort((a, b) => a - b);
  const validMedian = validPrices.length ? getPercentile(validPrices, 0.5) : 0;

  return {
    validRecords,
    outlierRecords,
    q1: Math.round(q1),
    q3: Math.round(q3),
    iqr: Math.round(iqr),
    lowerBound: Math.round(lowerBound),
    upperBound: Math.round(upperBound),
    median: Math.round(validMedian),
  };
}

/**
 * Computes statistical metrics for a specific surveying service
 */
export function getMarketStatisticsForService(
  records: MarketPriceRecord[],
  serviceId: string,
  settings: PricingSettings,
  exclude?: { projectId?: string; estimateId?: string; sourceRecordId?: string }
): MarketStatistics {
  const excludedRecords: NonNullable<MarketStatistics['excludedRecords']> = [];
  const serviceRecords = records.filter((r) => {
    if (r.serviceId !== serviceId) return false;
    if (r.projectStatus === 'cancelled') { excludedRecords.push({ record:r, reason:'cancelled' }); return false; }
    if ((exclude?.projectId && r.projectId === exclude.projectId) || (exclude?.estimateId && r.sourceEstimateId === exclude.estimateId) || (exclude?.sourceRecordId && r.id === exclude.sourceRecordId)) {
      excludedRecords.push({ record:r, reason:'current_estimate' }); return false;
    }
    if ((r.schemaVersion !== undefined && r.schemaVersion !== 1)) { excludedRecords.push({ record:r, reason:'invalid_schema' }); return false; }
    if (!Number.isFinite(r.unitPrice) || r.unitPrice <= 0) { excludedRecords.push({ record:r, reason:'invalid_price' }); return false; }
    return true;
  });

  const { validRecords, outlierRecords, q1, q3, iqr, lowerBound, upperBound, median } =
    analyzeMarketRecordsIQR(serviceRecords, settings.outlierIqrMultiplier);

  const validCount = validRecords.length;

  let confidenceLevel: ConfidenceLevel = 'low';
  let confidenceMessage = 'این برآورد به‌دلیل کمبود داده بازار، اطمینان محدودی دارد.';

  if (validCount >= settings.confidenceThresholdMedium) {
    confidenceLevel = 'high';
    confidenceMessage = `سطح اطمینان بالا بر مبنای ${validCount} نمونه معتبر بازار`;
  } else if (validCount >= settings.confidenceThresholdLow) {
    confidenceLevel = 'medium';
    confidenceMessage = `سطح اطمینان متوسط بر مبنای ${validCount} نمونه معتبر بازار`;
  }

  const prices = validRecords.map((r) => r.unitPrice);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  return {
    serviceId,
    totalSamples: serviceRecords.length,
    validSamples: validCount,
    outliersCount: outlierRecords.length,
    medianPrice: median,
    minPrice,
    maxPrice,
    q1Price: q1,
    q3Price: q3,
    iqr,
    lowerBound,
    upperBound,
    confidenceLevel,
    confidenceMessage,
    excludedRecords: [...excludedRecords, ...outlierRecords.map((record) => ({ record, reason:'outlier' as const }))],
  };
}

/**
 * Pure function: calculates the full price estimation breakdown
 */
export function calculateProjectPricing(
  inputs: PricingCalculationInputs,
  marketStats: MarketStatistics,
  settings: PricingSettings
): PricingCalculationResult {
  const warnings: string[] = [];
  const normalizedSettings = validatePricingSettings(settings);
  const actualCost = money(inputs.actualCost, 'هزینه واقعی');
  const quantity = boundedNumber(inputs.quantity, 'مقدار یا حجم کار', Number.EPSILON, PRICING_LIMITS.maxQuantity);
  const baseRate = money(inputs.baseRate, 'نرخ پایه');
  const minAmount = money(inputs.minAmount, 'حداقل مبلغ');
  const locCoeff = boundedNumber(inputs.locationCoefficient, 'ضریب موقعیت', PRICING_LIMITS.minCoefficient, PRICING_LIMITS.maxCoefficient);
  const diffCoeff = boundedNumber(inputs.difficultyCoefficient, 'ضریب سختی', PRICING_LIMITS.minCoefficient, PRICING_LIMITS.maxCoefficient);
  const riskCoeff = boundedNumber(inputs.riskCoefficient, 'ضریب ریسک', PRICING_LIMITS.minCoefficient, PRICING_LIMITS.maxCoefficient);
  const qualCoeff = boundedNumber(inputs.qualityCoefficient, 'ضریب کیفیت', PRICING_LIMITS.minCoefficient, PRICING_LIMITS.maxCoefficient);
  const profitPercent = boundedNumber(inputs.profitPercent, 'درصد سود', 0, PRICING_LIMITS.maxProfitPercent);
  const taxesAndDeductions = money(inputs.taxesAndDeductions ?? 0, 'مالیات و کسورات');

  // 1. Cost-Based Price
  // costBasedPrice = actualCost * (1 + profitPercent / 100) + taxesAndDeductions
  const costBasedRaw = safeAdd('قیمت مبتنی بر هزینه', safeMultiply('قیمت مبتنی بر هزینه', actualCost, 1 + profitPercent / 100), taxesAndDeductions);

  if (actualCost === 0) {
    warnings.push('هزینه واقعی برای این پروژه ثبت نشده است (مبنای بهای تمام‌شده ۰ تومان لحاظ شد).');
  }

  // 2. Adjusted Tariff
  // calculatedTariff = baseRate * quantity * location * difficulty * risk * quality
  const rawTariff = safeMultiply('تعرفه تعدیل‌شده', baseRate, quantity, locCoeff, diffCoeff, riskCoeff, qualCoeff);
  const adjustedTariffRaw = Math.max(minAmount, rawTariff);

  if (minAmount > 0 && rawTariff < minAmount) {
    warnings.push(
      `حداقل مبلغ خدمت (${minAmount.toLocaleString('fa-IR')} تومان) به‌دلیل کمتر بودن مبلغ محاسبه‌شده از کف تعرفه اعمال گردید.`
    );
  }

  // 3. Market Statistical Component
  const sampleCount = boundedNumber(marketStats.validSamples, 'تعداد نمونه معتبر', 0, PRICING_LIMITS.maxConfidenceThreshold);
  const marketMedian = money(marketStats.medianPrice, 'میانه واحد بازار');
  const marketTotalMedianRaw = safeMultiply('میانه کل بازار', marketMedian, quantity);

  // 4. Reference Price (Reference combination)
  let referencePriceRaw = adjustedTariffRaw;

  if (sampleCount >= normalizedSettings.confidenceThresholdLow && marketMedian > 0) {
    referencePriceRaw = safeAdd('قیمت مرجع', safeMultiply('سهم تعرفه', normalizedSettings.tariffWeight, adjustedTariffRaw), safeMultiply('سهم بازار', normalizedSettings.marketWeight, marketTotalMedianRaw));
  } else {
    // Insufficient market data
    if (adjustedTariffRaw > 0) {
      referencePriceRaw = adjustedTariffRaw;
    } else {
      referencePriceRaw = costBasedRaw;
    }
  }

  if (sampleCount < normalizedSettings.confidenceThresholdLow) {
    warnings.push('این برآورد به‌دلیل کمبود داده بازار، اطمینان محدودی دارد.');
  }

  // 5. Standard, Economic, and Specialized Levels
  // standardPrice = max(costBasedPrice, referencePrice)
  const floorRaw = Math.max(costBasedRaw, adjustedTariffRaw);
  const standardRaw = Math.max(floorRaw, referencePriceRaw);

  // economicPrice = max(costBasedPrice, standardPrice * economicFactor)
  const economicRaw = Math.min(standardRaw, Math.max(floorRaw, safeMultiply('قیمت اقتصادی', standardRaw, normalizedSettings.economicFactor)));

  // specializedPrice = max(costBasedPrice, standardPrice * specializedFactor)
  const specializedRaw = Math.max(standardRaw, floorRaw, safeMultiply('قیمت تخصصی', standardRaw, normalizedSettings.specializedFactor));

  const costBasedPrice = roundMoney(costBasedRaw, 'قیمت مبتنی بر هزینه');
  const calculatedTariff = roundMoney(rawTariff, 'تعرفه محاسبه‌شده');
  const adjustedTariff = roundMoney(adjustedTariffRaw, 'تعرفه تعدیل‌شده');
  const marketTotalMedian = roundMoney(marketTotalMedianRaw, 'میانه کل بازار');
  const referencePrice = roundMoney(referencePriceRaw, 'قیمت مرجع');
  const standardPrice = roundMoney(standardRaw, 'قیمت استاندارد');
  const economicPrice = roundMoney(economicRaw, 'قیمت اقتصادی');
  const specializedPrice = roundMoney(specializedRaw, 'قیمت تخصصی');

  // 6. Selected Level and Final Price
  let finalPrice = standardPrice;
  const customPriceAmount = inputs.customPriceAmount !== undefined ? money(inputs.customPriceAmount, 'مبلغ سفارشی', false) : undefined;

  switch (inputs.selectedLevel) {
    case 'economic':
      finalPrice = economicPrice;
      break;
    case 'standard':
      finalPrice = standardPrice;
      break;
    case 'specialized':
      finalPrice = specializedPrice;
      break;
    case 'custom':
      if (customPriceAmount === undefined) throw new Error('مبلغ سفارشی باید وارد شود.');
      if (customPriceAmount < floorRaw) throw new Error('مبلغ سفارشی نمی‌تواند کمتر از کف هزینه یا حداقل تعرفه باشد.');
      finalPrice = roundMoney(customPriceAmount, 'مبلغ سفارشی');
      break;
    default:
      finalPrice = standardPrice;
  }

  // Check if finalPrice is below actual cost or costBasedPrice
  if (finalPrice < costBasedPrice && costBasedPrice > 0) {
    warnings.push('مبلغ نهایی انتخاب‌شده از بهای تمام‌شده بر مبنای هزینه کمتر است و ممکن است باعث زیان شود.');
  }

  // 7. Market Comparison Label
  let comparisonLabel: PriceComparisonLabel = 'insufficient_data';
  let comparisonLabelText = 'اطلاعات بازار هنوز کافی نیست';

  if (sampleCount >= normalizedSettings.confidenceThresholdLow && marketTotalMedian > 0) {
    const marketLowerThreshold = marketTotalMedian * 0.85;
    const marketUpperThreshold = marketTotalMedian * 1.15;

    if (finalPrice < marketLowerThreshold) {
      comparisonLabel = 'lower_than_market';
      comparisonLabelText = 'کمتر از بازه متعارف بازار';
    } else if (finalPrice > marketUpperThreshold) {
      comparisonLabel = 'higher_than_market';
      comparisonLabelText = 'بالاتر از بازه متعارف بازار';
    } else {
      comparisonLabel = 'within_market';
      comparisonLabelText = 'در محدوده متعارف بازار';
    }
  }

  return {
    actualCost,
    costBasedPrice,
    baseRate,
    minAmount,
    calculatedTariff,
    adjustedTariff,
    marketMedian,
    marketTotalMedian,
    referencePrice,
    sampleCount,
    confidenceLevel: marketStats.confidenceLevel,
    confidenceMessage: marketStats.confidenceMessage,
    economicPrice,
    standardPrice,
    specializedPrice,
    selectedLevel: inputs.selectedLevel,
    finalPrice,
    customPriceAmount,
    comparisonLabel,
    comparisonLabelText,
    warnings,
  };
}

/**
 * Creates an Employer Price Summary containing strictly public/deliverable fields
 * Hiding all internal costs, personal rates, profit, depreciation, and raw equations.
 */
export function buildEmployerPriceSummary(
  projectId: string,
  serviceTitle: string,
  result: PricingCalculationResult,
  surveyorNotes?: string,
  quantity = 1,
  unit: SurveyingUnit = 'مورد'
): EmployerPriceSummary {
  const levelLabels: Record<PriceLevel, string> = {
    economic: 'سطح اقتصادی',
    standard: 'سطح استاندارد',
    specialized: 'سطح تخصصی و ویژه',
    custom: 'تعرفه سفارشی توافقی',
  };

  const confidenceLabels: Record<ConfidenceLevel, string> = {
    low: 'اطمینان محدود (داده‌های بازار ناکافی)',
    medium: 'اطمینان متوسط',
    high: 'اطمینان بالا',
  };

  return {
    projectId,
    serviceTitle,
    quantity,
    unit,
    finalPrice: result.finalPrice,
    finalPriceInWords: numberToPersianWords(result.finalPrice),
    currency: 'TOMAN',
    selectedLevel: result.selectedLevel,
    selectedLevelLabel: levelLabels[result.selectedLevel] || 'استاندارد',
    comparisonLabel: result.comparisonLabel,
    comparisonLabelText: result.comparisonLabelText,
    confidenceLevel: result.confidenceLevel,
    confidenceLevelLabel: confidenceLabels[result.confidenceLevel] || 'متوسط',
    surveyorNotes: surveyorNotes?.trim() || undefined,
    issueDateJalali: getCurrentJalaliDate(),
    schemaVersion: 1,
  };
}

