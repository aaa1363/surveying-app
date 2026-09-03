/**
 * Market Price Record & Statistical Analysis Model
 * Stage 4 - Pricing Engine
 */

import { SurveyingUnit } from './SurveyingService';
import { ConfidenceLevel } from './PricingSettings';

export interface MarketPriceRecord {
  id: string;
  serviceId: string;
  serviceTitle: string;
  projectId: string;
  userId: string;
  unit: SurveyingUnit;
  unitPrice: number; // Unit price in Toman
  totalPrice: number; // Total price in Toman
  quantity: number;
  projectStatus: 'completed' | 'active' | 'proposal' | 'cancelled';
  reliabilityWeight: number; // e.g. 1.2 for completed, 0.8 for proposal
  isOutlier: boolean; // Tagged via IQR, kept in DB but excluded from median calculation
  isDemo: boolean; // Demo flag to isolate demo samples from real market statistics
  createdAt: string;
  updatedAt: string;
  schemaVersion?: 1;
  sourceEstimateId?: string;
}

export interface ExcludedMarketRecord { record: MarketPriceRecord; reason: 'invalid_schema' | 'invalid_price' | 'current_estimate' | 'cancelled' | 'outlier'; }

export interface MarketStatistics {
  serviceId: string;
  totalSamples: number;
  validSamples: number;
  outliersCount: number;
  medianPrice: number; // Toman per unit
  minPrice: number;
  maxPrice: number;
  q1Price: number;
  q3Price: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
  confidenceLevel: ConfidenceLevel;
  confidenceMessage: string;
  excludedRecords?: ExcludedMarketRecord[];
}

/**
 * Seed demo market records for testing 5 services with realistic values and outlier samples
 */
export const SEED_DEMO_MARKET_RECORDS: MarketPriceRecord[] = [
  // sur_1: برداشت مسطحاتی بلوک شهری (Unit: بلوک, Base: ~4,500,000)
  {
    id: 'mkt_sur1_1',
    serviceId: 'sur_1',
    serviceTitle: 'برداشت مسطحاتی بلوک شهری تا عمق یک پلاک',
    projectId: 'demo_proj_101',
    userId: 'user_surveyor_1',
    unit: 'بلوک',
    unitPrice: 4200000,
    totalPrice: 4200000,
    quantity: 1,
    projectStatus: 'completed',
    reliabilityWeight: 1.2,
    isOutlier: false,
    isDemo: true,
    createdAt: '2026-02-10T10:00:00.000Z',
    updatedAt: '2026-02-10T10:00:00.000Z',
  },
  {
    id: 'mkt_sur1_2',
    serviceId: 'sur_1',
    serviceTitle: 'برداشت مسطحاتی بلوک شهری تا عمق یک پلاک',
    projectId: 'demo_proj_102',
    userId: 'user_surveyor_2',
    unit: 'بلوک',
    unitPrice: 4600000,
    totalPrice: 9200000,
    quantity: 2,
    projectStatus: 'completed',
    reliabilityWeight: 1.2,
    isOutlier: false,
    isDemo: true,
    createdAt: '2026-02-12T11:00:00.000Z',
    updatedAt: '2026-02-12T11:00:00.000Z',
  },
  {
    id: 'mkt_sur1_3',
    serviceId: 'sur_1',
    serviceTitle: 'برداشت مسطحاتی بلوک شهری تا عمق یک پلاک',
    projectId: 'demo_proj_103',
    userId: 'user_surveyor_3',
    unit: 'بلوک',
    unitPrice: 4500000,
    totalPrice: 4500000,
    quantity: 1,
    projectStatus: 'active',
    reliabilityWeight: 1.0,
    isOutlier: false,
    isDemo: true,
    createdAt: '2026-02-15T09:00:00.000Z',
    updatedAt: '2026-02-15T09:00:00.000Z',
  },
  {
    id: 'mkt_sur1_4',
    serviceId: 'sur_1',
    serviceTitle: 'برداشت مسطحاتی بلوک شهری تا عمق یک پلاک',
    projectId: 'demo_proj_104',
    userId: 'user_surveyor_4',
    unit: 'بلوک',
    unitPrice: 4800000,
    totalPrice: 14400000,
    quantity: 3,
    projectStatus: 'completed',
    reliabilityWeight: 1.2,
    isOutlier: false,
    isDemo: true,
    createdAt: '2026-02-18T14:00:00.000Z',
    updatedAt: '2026-02-18T14:00:00.000Z',
  },
  {
    id: 'mkt_sur1_5',
    serviceId: 'sur_1',
    serviceTitle: 'برداشت مسطحاتی بلوک شهری تا عمق یک پلاک',
    projectId: 'demo_proj_105',
    userId: 'user_surveyor_5',
    unit: 'بلوک',
    unitPrice: 4400000,
    totalPrice: 4400000,
    quantity: 1,
    projectStatus: 'proposal',
    reliabilityWeight: 0.8,
    isOutlier: false,
    isDemo: true,
    createdAt: '2026-02-20T16:00:00.000Z',
    updatedAt: '2026-02-20T16:00:00.000Z',
  },
  {
    id: 'mkt_sur1_6',
    serviceId: 'sur_1',
    serviceTitle: 'برداشت مسطحاتی بلوک شهری تا عمق یک پلاک',
    projectId: 'demo_proj_106',
    userId: 'user_surveyor_6',
    unit: 'بلوک',
    unitPrice: 4700000,
    totalPrice: 9400000,
    quantity: 2,
    projectStatus: 'completed',
    reliabilityWeight: 1.2,
    isOutlier: false,
    isDemo: true,
    createdAt: '2026-02-22T08:30:00.000Z',
    updatedAt: '2026-02-22T08:30:00.000Z',
  },
  {
    id: 'mkt_sur1_outlier',
    serviceId: 'sur_1',
    serviceTitle: 'برداشت مسطحاتی بلوک شهری تا عمق یک پلاک',
    projectId: 'demo_proj_107',
    userId: 'user_surveyor_7',
    unit: 'بلوک',
    unitPrice: 18000000, // Outlier sample for IQR test
    totalPrice: 18000000,
    quantity: 1,
    projectStatus: 'proposal',
    reliabilityWeight: 0.8,
    isOutlier: true,
    isDemo: true,
    createdAt: '2026-02-25T12:00:00.000Z',
    updatedAt: '2026-02-25T12:00:00.000Z',
  },

  // sur_3: برداشت نما (Unit: مترمربع, Base: ~38,000)
  {
    id: 'mkt_sur3_1',
    serviceId: 'sur_3',
    serviceTitle: 'برداشت نما',
    projectId: 'demo_proj_301',
    userId: 'user_surveyor_1',
    unit: 'مترمربع',
    unitPrice: 36000,
    totalPrice: 18000000,
    quantity: 500,
    projectStatus: 'completed',
    reliabilityWeight: 1.2,
    isOutlier: false,
    isDemo: true,
    createdAt: '2026-02-10T10:00:00.000Z',
    updatedAt: '2026-02-10T10:00:00.000Z',
  },
  {
    id: 'mkt_sur3_2',
    serviceId: 'sur_3',
    serviceTitle: 'برداشت نما',
    projectId: 'demo_proj_302',
    userId: 'user_surveyor_2',
    unit: 'مترمربع',
    unitPrice: 40000,
    totalPrice: 12000000,
    quantity: 300,
    projectStatus: 'completed',
    reliabilityWeight: 1.2,
    isOutlier: false,
    isDemo: true,
    createdAt: '2026-02-14T15:00:00.000Z',
    updatedAt: '2026-02-14T15:00:00.000Z',
  },
  {
    id: 'mkt_sur3_3',
    serviceId: 'sur_3',
    serviceTitle: 'برداشت نما',
    projectId: 'demo_proj_303',
    userId: 'user_surveyor_3',
    unit: 'مترمربع',
    unitPrice: 38000,
    totalPrice: 30400000,
    quantity: 800,
    projectStatus: 'completed',
    reliabilityWeight: 1.2,
    isOutlier: false,
    isDemo: true,
    createdAt: '2026-02-18T11:00:00.000Z',
    updatedAt: '2026-02-18T11:00:00.000Z',
  },
  {
    id: 'mkt_sur3_4',
    serviceId: 'sur_3',
    serviceTitle: 'برداشت نما',
    projectId: 'demo_proj_304',
    userId: 'user_surveyor_4',
    unit: 'مترمربع',
    unitPrice: 37000,
    totalPrice: 14800000,
    quantity: 400,
    projectStatus: 'active',
    reliabilityWeight: 1.0,
    isOutlier: false,
    isDemo: true,
    createdAt: '2026-02-21T09:00:00.000Z',
    updatedAt: '2026-02-21T09:00:00.000Z',
  },
  {
    id: 'mkt_sur3_5',
    serviceId: 'sur_3',
    serviceTitle: 'برداشت نما',
    projectId: 'demo_proj_305',
    userId: 'user_surveyor_5',
    unit: 'مترمربع',
    unitPrice: 39000,
    totalPrice: 23400000,
    quantity: 600,
    projectStatus: 'completed',
    reliabilityWeight: 1.2,
    isOutlier: false,
    isDemo: true,
    createdAt: '2026-02-24T14:00:00.000Z',
    updatedAt: '2026-02-24T14:00:00.000Z',
  },
];

