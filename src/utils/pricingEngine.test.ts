/**
 * Automated Verification Suite for Pricing Engine (Stage 4)
 * Covers all 20 mandatory test scenarios
 */

import {
  analyzeMarketRecordsIQR,
  getMarketStatisticsForService,
  calculateProjectPricing,
  buildEmployerPriceSummary,
} from './pricingEngine';
import {
  DEFAULT_PRICING_SETTINGS,
  MarketPriceRecord,
  SurveyingService,
} from '../models';

export function runAllPricingEngineTests(): {
  total: number;
  passed: number;
  failed: number;
  results: { testNumber: number; title: string; passed: boolean; message?: string }[];
} {
  const results: { testNumber: number; title: string; passed: boolean; message?: string }[] = [];

  function assert(testNumber: number, title: string, condition: boolean, message = '') {
    results.push({
      testNumber,
      title,
      passed: condition,
      message: condition ? 'موفق' : `ناموفق: ${message}`,
    });
  }

  const defaultSettings = DEFAULT_PRICING_SETTINGS;

  // Mock records (10 standard + 2 outliers)
  const sampleRecords: MarketPriceRecord[] = [
    { id: '1', serviceId: 'sur_1', serviceTitle: 'برداشت', projectId: 'p1', userId: 'u1', unit: 'بلوک', unitPrice: 3800000, totalPrice: 3800000, quantity: 1, reliabilityWeight: 1, isDemo: true, isOutlier: false, projectStatus: 'completed', createdAt: '', updatedAt: '' },
    { id: '2', serviceId: 'sur_1', serviceTitle: 'برداشت', projectId: 'p2', userId: 'u1', unit: 'بلوک', unitPrice: 4000000, totalPrice: 4000000, quantity: 1, reliabilityWeight: 1, isDemo: true, isOutlier: false, projectStatus: 'completed', createdAt: '', updatedAt: '' },
    { id: '3', serviceId: 'sur_1', serviceTitle: 'برداشت', projectId: 'p3', userId: 'u1', unit: 'بلوک', unitPrice: 4100000, totalPrice: 4100000, quantity: 1, reliabilityWeight: 1, isDemo: true, isOutlier: false, projectStatus: 'completed', createdAt: '', updatedAt: '' },
    { id: '4', serviceId: 'sur_1', serviceTitle: 'برداشت', projectId: 'p4', userId: 'u1', unit: 'بلوک', unitPrice: 4200000, totalPrice: 4200000, quantity: 1, reliabilityWeight: 1, isDemo: true, isOutlier: false, projectStatus: 'completed', createdAt: '', updatedAt: '' },
    { id: '5', serviceId: 'sur_1', serviceTitle: 'برداشت', projectId: 'p5', userId: 'u1', unit: 'بلوک', unitPrice: 4300000, totalPrice: 4300000, quantity: 1, reliabilityWeight: 1, isDemo: true, isOutlier: false, projectStatus: 'completed', createdAt: '', updatedAt: '' },
    { id: '6', serviceId: 'sur_1', serviceTitle: 'برداشت', projectId: 'p6', userId: 'u1', unit: 'بلوک', unitPrice: 4400000, totalPrice: 4400000, quantity: 1, reliabilityWeight: 1, isDemo: true, isOutlier: false, projectStatus: 'completed', createdAt: '', updatedAt: '' },
    { id: '7', serviceId: 'sur_1', serviceTitle: 'برداشت', projectId: 'p7', userId: 'u1', unit: 'بلوک', unitPrice: 4500000, totalPrice: 4500000, quantity: 1, reliabilityWeight: 1, isDemo: true, isOutlier: false, projectStatus: 'completed', createdAt: '', updatedAt: '' },
    { id: '8', serviceId: 'sur_1', serviceTitle: 'برداشت', projectId: 'p8', userId: 'u1', unit: 'بلوک', unitPrice: 4600000, totalPrice: 4600000, quantity: 1, reliabilityWeight: 1, isDemo: true, isOutlier: false, projectStatus: 'completed', createdAt: '', updatedAt: '' },
    { id: '9', serviceId: 'sur_1', serviceTitle: 'برداشت', projectId: 'p9', userId: 'u1', unit: 'بلوک', unitPrice: 4700000, totalPrice: 4700000, quantity: 1, reliabilityWeight: 1, isDemo: true, isOutlier: false, projectStatus: 'completed', createdAt: '', updatedAt: '' },
    { id: '10', serviceId: 'sur_1', serviceTitle: 'برداشت', projectId: 'p10', userId: 'u1', unit: 'بلوک', unitPrice: 4900000, totalPrice: 4900000, quantity: 1, reliabilityWeight: 1, isDemo: true, isOutlier: false, projectStatus: 'completed', createdAt: '', updatedAt: '' },
    // Outliers
    { id: '11', serviceId: 'sur_1', serviceTitle: 'برداشت', projectId: 'p11', userId: 'u1', unit: 'بلوک', unitPrice: 100000, totalPrice: 100000, quantity: 1, reliabilityWeight: 1, isDemo: true, isOutlier: false, projectStatus: 'completed', createdAt: '', updatedAt: '' },
    { id: '12', serviceId: 'sur_1', serviceTitle: 'برداشت', projectId: 'p12', userId: 'u1', unit: 'بلوک', unitPrice: 25000000, totalPrice: 25000000, quantity: 1, reliabilityWeight: 1, isDemo: true, isOutlier: false, projectStatus: 'completed', createdAt: '', updatedAt: '' },
  ];

  const marketStats = getMarketStatisticsForService(sampleRecords, 'sur_1', defaultSettings);

  // Test 1: Pure function idempotency
  const input1 = {
    actualCost: 2000000,
    quantity: 2,
    unit: 'بلوک' as any,
    baseRate: 3500000,
    minAmount: 3000000,
    locationCoefficient: 1.1,
    difficultyCoefficient: 1.2,
    riskCoefficient: 1.0,
    qualityCoefficient: 1.0,
    profitPercent: 20,
    taxesAndDeductions: 100000,
    selectedLevel: 'standard' as const,
  };
  const res1A = calculateProjectPricing(input1, marketStats, defaultSettings);
  const res1B = calculateProjectPricing(input1, marketStats, defaultSettings);
  assert(1, 'توابع خالص و قطعی (Pure Functions Idempotency)', JSON.stringify(res1A) === JSON.stringify(res1B));

  // Test 2: Actual cost zero handling
  const res2 = calculateProjectPricing({ ...input1, actualCost: 0 }, marketStats, defaultSettings);
  assert(2, 'مدیریت هزینه واقعی صفر', res2.actualCost === 0 && res2.warnings.some((w) => w.includes('هزینه واقعی')));

  // Test 3: Negative inputs are rejected instead of silently clamped
  let negativeRejected = false;
  try { calculateProjectPricing({ ...input1, actualCost: -500000 }, marketStats, defaultSettings); } catch { negativeRejected = true; }
  assert(3, 'رد صریح مقادیر منفی ورودی', negativeRejected);

  // Test 4: Base rate zero
  const res4 = calculateProjectPricing({ ...input1, baseRate: 0 }, marketStats, defaultSettings);
  assert(4, 'نرخ پایه تعرفه صفر', res4.calculatedTariff === 0);

  // Test 5: Minimum amount enforcement
  const res5 = calculateProjectPricing({ ...input1, baseRate: 1000, quantity: 1, minAmount: 3000000 }, marketStats, defaultSettings);
  assert(5, 'اعمال کف حداقل مبلغ خدمت (Min Amount)', res5.adjustedTariff === 3000000 && res5.warnings.some((w) => w.includes('حداقل مبلغ')));

  // Test 6: Environmental coefficients multiplication
  const res6 = calculateProjectPricing(
    { ...input1, baseRate: 1000000, quantity: 2, locationCoefficient: 1.5, difficultyCoefficient: 2.0, riskCoefficient: 1.0, qualityCoefficient: 1.0, minAmount: 0 },
    marketStats,
    defaultSettings
  );
  // 1000000 * 2 * 1.5 * 2.0 = 6000000
  assert(6, 'ضرب ضرایب محیطی و سختی در حجم', res6.calculatedTariff === 6000000);

  // Test 7: Outlier detection using IQR
  const iqrRes = analyzeMarketRecordsIQR(sampleRecords, 1.5);
  assert(7, 'تشخیص داده‌های پرت با روش IQR بدون حذف فیزیکی', iqrRes.outlierRecords.length === 2 && iqrRes.validRecords.length === 10);

  // Test 8: Small sample size (< 5) -> Low confidence
  const smallRecords = sampleRecords.slice(0, 3);
  const smallStats = getMarketStatisticsForService(smallRecords, 'sur_1', defaultSettings);
  const res8 = calculateProjectPricing(input1, smallStats, defaultSettings);
  assert(8, 'اطمینان محدود در نمونه‌های کم (< ۵)', smallStats.confidenceLevel === 'low' && res8.warnings.some((w) => w.includes('اطمینان محدودی')));

  // Test 9: Medium sample size (5-19) -> Medium confidence
  const medStats = getMarketStatisticsForService(sampleRecords.slice(0, 8), 'sur_1', defaultSettings);
  assert(9, 'اطمینان متوسط در نمونه‌های ۵ تا ۱۹', medStats.confidenceLevel === 'medium');

  // Test 10: High sample size (>= 20) -> High confidence
  const highRecords = Array(22).fill(sampleRecords[0]).map((r, i) => ({ ...r, id: `h_${i}` }));
  const highStats = getMarketStatisticsForService(highRecords, 'sur_1', defaultSettings);
  assert(10, 'اطمینان بالا در نمونه‌های بالای ۲۰', highStats.confidenceLevel === 'high');

  // Test 11: Profit % and taxes addition
  // actualCost = 2,000,000, profit = 20% -> 2,400,000 + 100,000 taxes = 2,500,000
  assert(11, 'محاسبه دقیق سود و مالیات در بهای تمام‌شده', res1A.costBasedPrice === 2500000);

  // Test 12: 3 Price levels
  assert(12, 'محاسبه سطوح ۳ گانه (اقتصادی، استاندارد، تخصصی)',
    res1A.economicPrice >= res1A.costBasedPrice &&
    res1A.specializedPrice >= res1A.standardPrice &&
    res1A.standardPrice >= res1A.costBasedPrice
  );

  // Test 13: Custom price level
  const res13 = calculateProjectPricing(
    { ...input1, selectedLevel: 'custom', customPriceAmount: 9900000 },
    marketStats,
    defaultSettings
  );
  assert(13, 'سطح قیمت سفارشی/توافقی', res13.finalPrice === 9900000 && res13.selectedLevel === 'custom');

  // Test 14: Custom under-pricing is rejected
  let underPricingRejected = false;
  try { calculateProjectPricing({ ...input1, actualCost: 10000000, selectedLevel: 'custom', customPriceAmount: 5000000 }, marketStats, defaultSettings); } catch { underPricingRejected = true; }
  assert(14, 'رد مبلغ سفارشی کمتر از کف هزینه', underPricingRejected);

  // Test 15: Comparison labels
  assert(15, 'محاسبه برچسب انطباق با بازار', ['within_market', 'lower_than_market', 'higher_than_market', 'insufficient_data'].includes(res1A.comparisonLabel));

  // Test 16: Employer preview confidentiality
  const employerSummary = buildEmployerPriceSummary('proj_1', 'برداشت بلوک', res1A, 'توضیحات تست');
  const summaryKeys = Object.keys(employerSummary);
  const containsInternalDetails = summaryKeys.some((k) =>
    ['actualCost', 'profitPercent', 'depreciation', 'costItems', 'personalRates'].includes(k)
  );
  assert(16, 'حفظ کامل محرمانگی در پیش‌نمایش کارفرما', !containsInternalDetails && employerSummary.finalPrice === res1A.finalPrice);

  // Test 17: Reference Price Weighted Formula
  // referencePrice = tariffWeight * adjustedTariff + marketWeight * marketTotalMedian
  const expectedRef = Math.round(0.6 * res1A.adjustedTariff + 0.4 * res1A.marketTotalMedian);
  assert(17, 'فرمول وزنی تلفیق تعرفه و میانه بازار', res1A.referencePrice === expectedRef);

  // Test 18: Non-empty valid sample count
  assert(18, 'تعداد نمونه‌های معتبر بدون ناهنجاری', marketStats.validSamples > 0);

  // Test 19: IQR bounds mathematical validity
  assert(19, 'صحت روابط آماری چارک‌ها (Q1 <= Median <= Q3)', marketStats.q1Price <= marketStats.medianPrice && marketStats.medianPrice <= marketStats.q3Price);

  // Test 20: Toman currency consistency
  assert(20, 'واحد رسمی قیمت تومان و یکپارچگی مدل', employerSummary.currency === 'TOMAN');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    results,
  };
}

