import { AccessLevel, CalibrationProposal, ComplexityLevel, ConfidenceLevel, FieldCondition, RegionClass, UrgencyLevel, ValidationAggregate, ValidationMetrics, ValidationReasonCode, ValidationScenario } from '../models';
import { money, PRICING_LIMITS, roundMoney } from './pricingValidation';
import { getJalaliYear } from './jalaliDate';

export const VALIDATION_LAB_LIMITS=Object.freeze({maxNotes:500,maxImportBytes:1_000_000,maxImportRecords:1_000,minAggregateSamples:10,minCalibrationSamples:20,minIndependentExperts:3,maxExpertShare:.5});
export const REGION_CLASSES:RegionClass[]=['metropolitan','provincial_capital','other_urban','rural'];
export const COMPLEXITY_LEVELS:ComplexityLevel[]=['low','standard','high','exceptional'];
export const URGENCY_LEVELS:UrgencyLevel[]=['normal','urgent','critical'];
export const ACCESS_LEVELS:AccessLevel[]=['easy','standard','difficult'];
export const FIELD_CONDITIONS:FieldCondition[]=['normal','difficult'];
export const UTM_PILOT_SERVICE=Object.freeze({id:'price-1',title:'تهیه نقشه یو‌تی‌ام (UTM) تک‌برگی سند ثبتی',unit:'مترمربع'});
export const REASON_CODES:ValidationReasonCode[]=['access_difficulty','equipment_requirement','documentation_complexity','field_conditions','schedule_pressure','expert_judgment','other_without_details'];
const NOTE_PII=/(?:\+98|0)?9\d{9}|\b\d{10}\b|IR\d{24}|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|https?:\/\/|www\.|(?:-?\d{1,3}\.\d{4,})\s*[,،]\s*(?:-?\d{1,3}\.\d{4,})|پلاک\s*(?:ثبتی)?\s*[:：]?\s*\d+/i;
const ALLOWED_KEYS=new Set(['scenarioId','schemaVersion','environment','ownerUserId','expertPseudonym','serviceId','serviceTitleSnapshot','quantity','unit','province','regionClass','complexityLevel','urgencyLevel','parcelAreaM2','boundaryVertexCount','accessLevel','fieldCondition','executionYear','environmentalFactors','equipmentFactors','reasonCodes','executionDate','calculationStatus','engineEstimatedPrice','expertMinimumPrice','expertExpectedPrice','expertMaximumPrice','actualAgreedPrice','expertCount','expertConfidence','notes','engineVersion','settingsVersion','tariffVersion','createdAt','sourceType','anonymized','currency']);

export function sanitizeScenarioNotes(value?:string):string|undefined{
 if(value===undefined||value.trim()==='') return undefined;
 const note=value.trim(); if(note.length>VALIDATION_LAB_LIMITS.maxNotes) throw new Error('یادداشت نباید بیشتر از ۵۰۰ نویسه باشد.');
 if(NOTE_PII.test(note)) throw new Error('یادداشت شامل اطلاعات حساس یا قابل انتساب است.');
 return note.replace(/[<>]/g,'');
}
const string=(v:unknown,label:string)=>{if(typeof v!=='string'||!v.trim())throw new Error(`${label} الزامی است.`);return v.trim();};
const enumValue=<T extends string>(v:unknown,allowed:T[],label:string)=>{if(typeof v!=='string'||!allowed.includes(v as T))throw new Error(`${label} معتبر نیست.`);return v as T;};
const safeStringArray=(v:unknown,label:string)=>{if(!Array.isArray(v)||v.some(x=>typeof x!=='string'||x.length>100))throw new Error(`${label} معتبر نیست.`);return [...new Set(v.map(x=>x.trim()).filter(Boolean))];};

export function validateScenario(input:unknown):ValidationScenario{
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('ساختار سناریو معتبر نیست.');
 const source=input as Record<string,unknown>; for(const key of Object.keys(source))if(!ALLOWED_KEYS.has(key))throw new Error('فیلد ناشناخته در سناریو مجاز نیست.');
 if(![1,2].includes(Number(source.schemaVersion))||source.anonymized!==true||source.currency!=='TOMAN')throw new Error('نسخه، ناشناس‌سازی یا واحد سناریو معتبر نیست.');
 const isLegacy=source.schemaVersion===1;
 const min=money(source.expertMinimumPrice,'حداقل قیمت کارشناسی',false); const expected=money(source.expertExpectedPrice,'قیمت مورد انتظار',false); const max=money(source.expertMaximumPrice,'حداکثر قیمت کارشناسی',false);
 if(min>expected||expected>max)throw new Error('بازه کارشناسی یا قیمت مورد انتظار معتبر نیست.');
 const quantity=Number(source.quantity); if(!Number.isFinite(quantity)||quantity<=0||quantity>PRICING_LIMITS.maxQuantity)throw new Error('مقدار خدمت معتبر نیست.');
 const parcelAreaM2=Number(isLegacy?source.quantity:source.parcelAreaM2); if(!Number.isFinite(parcelAreaM2)||parcelAreaM2<=0||parcelAreaM2>PRICING_LIMITS.maxQuantity)throw new Error('مساحت ملک باید عددی مثبت و در محدوده امن باشد.');
 const boundaryVertexCount=Number(isLegacy?1:source.boundaryVertexCount); if(!Number.isSafeInteger(boundaryVertexCount)||boundaryVertexCount<=0||boundaryVertexCount>PRICING_LIMITS.maxQuantity)throw new Error('تعداد تقریبی شکست‌ها باید عدد صحیح مثبت و در محدوده امن باشد.');
 const executionYear=Number(isLegacy?getJalaliYear(String(source.executionDate)):source.executionYear),currentYear=getJalaliYear(); if(!Number.isSafeInteger(executionYear)||executionYear<1300||executionYear>currentYear)throw new Error('سال انجام باید عدد صحیح معقول باشد و نمی‌تواند مربوط به آینده باشد.');
 const expertCount=Number(source.expertCount); if(!Number.isSafeInteger(expertCount)||expertCount<1||expertCount>10_000)throw new Error('تعداد کارشناس معتبر نیست.');
 const province=source.province===undefined?undefined:string(source.province,'استان'); if(province&&province.length>60)throw new Error('استان معتبر نیست.');
 const suppliedStatus=source.calculationStatus as ValidationScenario['calculationStatus']|undefined;
 const legacyInvalid=source.engineEstimatedPrice!==undefined&&(source.engineEstimatedPrice===source.expertExpectedPrice||!source.engineVersion||!source.settingsVersion||!source.tariffVersion||['stage9.1','pricing-settings.v1','snapshot-active'].includes(String(source.engineVersion))||['pricing-settings.v1','snapshot-active'].includes(String(source.settingsVersion))||source.tariffVersion==='snapshot-active');
 const calculationStatus=legacyInvalid?'invalid_legacy_calculation':suppliedStatus??(source.engineEstimatedPrice===undefined?'unavailable':'calculated');
 if(!['calculated','unavailable','invalid_legacy_calculation'].includes(calculationStatus))throw new Error('وضعیت محاسبه معتبر نیست.');
 const engineEstimatedPrice=calculationStatus==='calculated'?money(source.engineEstimatedPrice,'برآورد موتور',false):undefined;
 return {...source,scenarioId:string(source.scenarioId,'شناسه سناریو'),schemaVersion:2,environment:enumValue(source.environment,['demo','real'],'محیط'),ownerUserId:string(source.ownerUserId,'مالک'),expertPseudonym:string(source.expertPseudonym,'شناسه مستعار'),serviceId:string(source.serviceId,'خدمت'),serviceTitleSnapshot:string(source.serviceTitleSnapshot,'عنوان خدمت'),quantity,unit:string(source.unit,'واحد') as ValidationScenario['unit'],province,regionClass:enumValue(source.regionClass,REGION_CLASSES,'طبقه منطقه'),complexityLevel:enumValue(source.complexityLevel,COMPLEXITY_LEVELS,'پیچیدگی'),urgencyLevel:enumValue(source.urgencyLevel,URGENCY_LEVELS,'فوریت'),parcelAreaM2,boundaryVertexCount,accessLevel:isLegacy?'standard':enumValue(source.accessLevel,ACCESS_LEVELS,'دسترسی'),fieldCondition:isLegacy?'normal':enumValue(source.fieldCondition,FIELD_CONDITIONS,'شرایط برداشت'),executionYear,environmentalFactors:safeStringArray(source.environmentalFactors,'عوامل محیطی'),equipmentFactors:safeStringArray(source.equipmentFactors,'عوامل تجهیزات'),reasonCodes:safeStringArray(source.reasonCodes,'کدهای دلیل').map(x=>enumValue(x,REASON_CODES,'کد دلیل')),executionDate:string(source.executionDate,'تاریخ اجرا'),calculationStatus,engineEstimatedPrice,expertMinimumPrice:min,expertExpectedPrice:expected,expertMaximumPrice:max,actualAgreedPrice:source.actualAgreedPrice===undefined?undefined:money(source.actualAgreedPrice,'قیمت توافق‌شده',false),expertCount,expertConfidence:enumValue(source.expertConfidence,['low','medium','high'] as ConfidenceLevel[],'اطمینان کارشناس'),notes:sanitizeScenarioNotes(source.notes as string|undefined),engineVersion:calculationStatus==='calculated'?string(source.engineVersion,'نسخه موتور'):undefined,settingsVersion:calculationStatus==='calculated'?string(source.settingsVersion,'نسخه تنظیمات'):undefined,tariffVersion:calculationStatus==='calculated'?string(source.tariffVersion,'نسخه تعرفه'):undefined,createdAt:string(source.createdAt,'زمان ایجاد'),sourceType:enumValue(source.sourceType,['expert_panel','completed_work','controlled_demo'],'نوع منبع'),anonymized:true,currency:'TOMAN'} as ValidationScenario;
}

export function calculateValidationMetrics(s:ValidationScenario,levels?:{economic:number;standard:number;specialized:number}):ValidationMetrics{
 if(s.calculationStatus!=='calculated'||s.engineEstimatedPrice===undefined)throw new Error('برآورد موتور برای این سناریو در دسترس نیست.');
 const signed=s.engineEstimatedPrice-s.expertExpectedPrice, absolute=Math.abs(signed), pct=absolute/s.expertExpectedPrice*100;
 const expectedConfidence=s.expertConfidence==='high'?10:s.expertConfidence==='medium'?20:35;
 return {scenarioId:s.scenarioId,absoluteError:roundMoney(absolute),signedError:Math.round(signed),percentageError:Number(pct.toFixed(4)),deviationFromExpected:Number((signed/s.expertExpectedPrice*100).toFixed(4)),withinExpertRange:s.engineEstimatedPrice>=s.expertMinimumPrice&&s.engineEstimatedPrice<=s.expertMaximumPrice,underpricingFlag:s.engineEstimatedPrice<s.expertMinimumPrice,overpricingFlag:s.engineEstimatedPrice>s.expertMaximumPrice,priceLevelOrdering:!levels||(levels.economic<=levels.standard&&levels.standard<=levels.specialized),confidenceCalibration:pct<=expectedConfidence?'aligned':s.expertConfidence==='high'?'optimistic':'conservative'};
}
const median=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b),m=Math.floor(sorted.length/2);return sorted.length%2?sorted[m]:(sorted[m-1]+sorted[m])/2;};
export function aggregateValidationScenarios(groupKey:string,scenarios:ValidationScenario[]):ValidationAggregate{
 const eligible=scenarios.filter(s=>s.calculationStatus==='calculated'&&s.engineEstimatedPrice!==undefined);
 if(eligible.length<VALIDATION_LAB_LIMITS.minAggregateSamples)return{groupKey,sampleCount:eligible.length,suppressed:true,suppressionReason:'insufficient_sample'};
 const metrics=eligible.map(s=>calculateValidationMetrics(s)); const pct=(n:number)=>Number((n/eligible.length*100).toFixed(2));
 return{groupKey,sampleCount:eligible.length,suppressed:false,medianAbsolutePercentageError:Number(median(metrics.map(m=>m.percentageError)).toFixed(2)),withinExpertRangePercent:pct(metrics.filter(m=>m.withinExpertRange).length),underpricingPercent:pct(metrics.filter(m=>m.underpricingFlag).length),overpricingPercent:pct(metrics.filter(m=>m.overpricingFlag).length),distinctExperts:new Set(eligible.map(s=>s.expertPseudonym)).size};
}
export function createCalibrationProposal(groupKey:string,scenarios:ValidationScenario[],createdBy:string,parent?:CalibrationProposal):CalibrationProposal|null{
 const eligible=scenarios.filter(s=>s.calculationStatus==='calculated'&&s.engineEstimatedPrice!==undefined);const experts=new Map<string,number>(); eligible.forEach(s=>experts.set(s.expertPseudonym,(experts.get(s.expertPseudonym)||0)+1)); const maxShare=eligible.length?Math.max(...experts.values())/eligible.length:1;
 if(eligible.length<20||experts.size<3||maxShare>.5)return null;
 return{id:`cal_${Date.now()}`,schemaVersion:1,environment:eligible[0].environment,groupKey,status:'reviewable',reason:'الگوی پایدار خطای برآورد در نمونه‌های ناشناس نیازمند بررسی مدیر است.',sampleCount:eligible.length,distinctExperts:experts.size,maximumExpertShare:maxShare,confidence:eligible.length>=40?'high':'medium',beforeEffect:'وضعیت فعلی موتور',afterEffect:'اثر شبیه‌سازی‌شده؛ بدون اعمال خودکار',createdAt:new Date().toISOString(),createdBy,parentVersionId:parent?.id,version:(parent?.version||0)+1};
}
