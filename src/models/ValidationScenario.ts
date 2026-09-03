import { ConfidenceLevel, SurveyingUnit } from '.';
import { Stage6Environment } from './Stage6Models';

export type RegionClass='metropolitan'|'provincial_capital'|'other_urban'|'rural';
export type ComplexityLevel='low'|'standard'|'high'|'exceptional';
export type UrgencyLevel='normal'|'urgent'|'critical';
export type AccessLevel='easy'|'standard'|'difficult';
export type FieldCondition='normal'|'difficult';
export type ValidationReasonCode='access_difficulty'|'equipment_requirement'|'documentation_complexity'|'field_conditions'|'schedule_pressure'|'expert_judgment'|'other_without_details';
export type ValidationSourceType='expert_panel'|'completed_work'|'controlled_demo';
export type ValidationCalculationStatus='calculated'|'unavailable'|'invalid_legacy_calculation';

export interface ValidationScenario {
  scenarioId:string; schemaVersion:1|2; environment:Stage6Environment;
  ownerUserId:string; expertPseudonym:string;
  serviceId:string; serviceTitleSnapshot:string; quantity:number; unit:SurveyingUnit;
  province?:string; regionClass:RegionClass; complexityLevel:ComplexityLevel; urgencyLevel:UrgencyLevel;
  parcelAreaM2?:number; boundaryVertexCount?:number; accessLevel?:AccessLevel; fieldCondition?:FieldCondition; executionYear?:number;
  environmentalFactors:string[]; equipmentFactors:string[]; reasonCodes:ValidationReasonCode[];
  executionDate:string; calculationStatus:ValidationCalculationStatus; engineEstimatedPrice?:number; expertMinimumPrice:number; expertExpectedPrice:number; expertMaximumPrice:number;
  actualAgreedPrice?:number; expertCount:number; expertConfidence:ConfidenceLevel; notes?:string;
  engineVersion?:string; settingsVersion?:string; tariffVersion?:string;
  createdAt:string; sourceType:ValidationSourceType; anonymized:true; currency:'TOMAN';
}

export interface ValidationMetrics {
  scenarioId:string; absoluteError:number; signedError:number; percentageError:number;
  deviationFromExpected:number; withinExpertRange:boolean; underpricingFlag:boolean; overpricingFlag:boolean;
  priceLevelOrdering:boolean; confidenceCalibration:'aligned'|'optimistic'|'conservative'|'unavailable';
}

export interface ValidationAggregate {
  groupKey:string; sampleCount:number; suppressed:boolean; suppressionReason?:'insufficient_sample';
  medianAbsolutePercentageError?:number; withinExpertRangePercent?:number; underpricingPercent?:number; overpricingPercent?:number;
  distinctExperts?:number;
}

export interface CalibrationProposal {
  id:string; schemaVersion:1; environment:Stage6Environment; groupKey:string; status:'draft'|'reviewable'|'versioned';
  reason:string; sampleCount:number; distinctExperts:number; maximumExpertShare:number; confidence:ConfidenceLevel;
  beforeEffect:string; afterEffect:string; createdAt:string; createdBy:string; parentVersionId?:string; version:number;
}

export interface ValidationLabExport {
  schemaVersion:1|2; environment:'demo'; exportedAt:string;
  scenarios:Array<Omit<ValidationScenario,'ownerUserId'|'expertPseudonym'|'notes'|'engineEstimatedPrice'|'calculationStatus'|'engineVersion'|'settingsVersion'|'tariffVersion'>>;
}
