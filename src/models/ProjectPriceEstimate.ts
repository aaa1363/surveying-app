/**
 * Project Price Estimation & Employer Preview Model
 * Stage 4 - Pricing Engine
 */

import { SurveyingUnit } from './SurveyingService';
import { PriceLevel, PriceComparisonLabel, ConfidenceLevel } from './PricingSettings';

export interface ProjectPriceEstimate {
  id: string;
  userId: string;
  projectId: string;
  serviceId: string;
  serviceTitle?: string;
  quantity: number;
  unit: SurveyingUnit;
  
  // Coefficients
  locationCoefficient: number;
  difficultyCoefficient: number;
  riskCoefficient: number;
  qualityCoefficient: number;
  
  // Profit & Optional Additions
  profitPercent: number; // e.g. 20 (20%)
  taxesAndDeductions: number; // Toman (Optional)
  
  // Calculated Components
  actualCost: number; // from Stage 3 ProjectCostEstimate
  costBasedPrice: number; // actualCost * (1 + profit%) + taxes
  baseRate: number; // Base rate from Admin tariff
  minAmount: number; // Minimum service amount from Admin tariff
  calculatedTariff: number; // baseRate * quantity * location * difficulty * risk * quality
  adjustedTariff: number; // Math.max(minAmount, calculatedTariff)
  
  // Market Statistical Components
  marketMedian: number; // Unit median price from valid market records
  marketTotalMedian: number; // marketMedian * quantity
  referencePrice: number; // Weighted combination or tariff
  sampleCount: number; // Number of valid market samples
  confidenceLevel: ConfidenceLevel;
  
  // 3 Pricing Levels
  economicPrice: number; // max(costBasedPrice, standardPrice * 0.90)
  standardPrice: number; // max(costBasedPrice, referencePrice)
  specializedPrice: number; // max(costBasedPrice, standardPrice * 1.15)
  
  // Selected Level & Final Price
  selectedLevel: PriceLevel; // 'economic' | 'standard' | 'specialized' | 'custom'
  finalPrice: number; // Actual selected or entered amount in Toman
  customPriceAmount?: number; // If selectedLevel === 'custom'
  
  // Intelligence & Feedback
  comparisonLabel: PriceComparisonLabel;
  notes?: string; // Optional description / note by surveyor
  warnings: string[];
  
  // Meta
  currency: 'TOMAN';
  schemaVersion: 1;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployerPriceSummary {
  projectId: string;
  serviceTitle: string;
  quantity: number;
  unit: SurveyingUnit;
  finalPrice: number;
  finalPriceInWords: string;
  currency: 'TOMAN';
  selectedLevel: PriceLevel;
  selectedLevelLabel: string;
  comparisonLabel: PriceComparisonLabel;
  comparisonLabelText: string;
  confidenceLevel: ConfidenceLevel;
  confidenceLevelLabel: string;
  surveyorNotes?: string;
  issueDateJalali: string;
  schemaVersion: 1;
}

