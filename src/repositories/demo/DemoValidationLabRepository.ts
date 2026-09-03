import { CalibrationProposal, ValidationLabExport, ValidationScenario } from '../../models';
import { RepositoryActor } from '../../models/Stage6Models';
import { aggregateValidationScenarios, createCalibrationProposal, UTM_PILOT_SERVICE, VALIDATION_LAB_LIMITS, validateScenario } from '../../utils/validationLab';
import { storage } from '../../utils/storage';
import { IValidationLabRepository, ValidationScenarioInput } from '../interfaces/IValidationLabRepository';
import { isValidationLabEnabled, setValidationLabEnabled } from '../../utils/validationLabFeature';
import { DemoServicesRepository } from './DemoServicesRepository';
import { DemoTariffsRepository } from './DemoTariffsRepository';

const BLOCKED=new Set(['__proto__','prototype','constructor']);
const EXPORT_KEYS=new Set(['scenarioId','schemaVersion','environment','serviceId','serviceTitleSnapshot','quantity','unit','province','regionClass','complexityLevel','urgencyLevel','parcelAreaM2','boundaryVertexCount','accessLevel','fieldCondition','executionYear','environmentalFactors','equipmentFactors','reasonCodes','executionDate','expertMinimumPrice','expertExpectedPrice','expertMaximumPrice','actualAgreedPrice','expertCount','expertConfidence','createdAt','sourceType','anonymized','currency']);
const INPUT_KEYS=new Set(['serviceId','serviceTitleSnapshot','quantity','unit','province','regionClass','complexityLevel','urgencyLevel','parcelAreaM2','boundaryVertexCount','accessLevel','fieldCondition','executionYear','environmentalFactors','equipmentFactors','reasonCodes','executionDate','expertMinimumPrice','expertExpectedPrice','expertMaximumPrice','actualAgreedPrice','expertCount','expertConfidence','notes','sourceType']);
const key=(environment:'demo'|'real')=>`surveying.validationLab.v2.${environment}`;
const legacyKey=(environment:'demo'|'real')=>`surveying.validationLab.v1.${environment}`;
const proposalKey=(environment:'demo'|'real')=>`surveying.validationLabProposals.v1.${environment}`;
const assertEnvironment=(actor:RepositoryActor,environment:'demo'|'real')=>{if(actor.environment!==environment)throw new Error('دسترسی بین محیط Demo و Real مجاز نیست.');};
const assertAdmin=(actor:RepositoryActor)=>{if(actor.role!=='admin')throw new Error('این عملیات فقط برای مدیر مجاز است.');};
const assertEnabled=(actor:RepositoryActor)=>{assertAdmin(actor);if(!isValidationLabEnabled(actor))throw new Error('آزمایشگاه اعتبارسنجی غیرفعال است.');};
const pseudonym=(userId:string)=>`expert_${Array.from(userId).reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7).toString(36)}`;
const match=(s:ValidationScenario,filter:Partial<ValidationScenario>)=>Object.entries(filter).every(([k,v])=>v===undefined||s[k as keyof ValidationScenario]===v);

export class DemoValidationLabRepository implements IValidationLabRepository{
 private list(environment:'demo'|'real'){const current=storage.get<ValidationScenario[]>(key(environment),[]);if(current.length)return current.map(validateScenario);return storage.get<ValidationScenario[]>(legacyKey(environment),[]).map(validateScenario);}
 async isEnabled(actor:RepositoryActor){assertAdmin(actor);return isValidationLabEnabled(actor);}
 async setEnabled(actor:RepositoryActor,enabled:boolean){return setValidationLabEnabled(actor,enabled);}
 async createScenario(actor:RepositoryActor,input:ValidationScenarioInput){
  assertEnabled(actor);for(const field of Object.keys(input))if(!INPUT_KEYS.has(field))throw new Error('payload شامل خروجی موتور یا snapshot غیرمجاز است.');
  if(input.parcelAreaM2!==undefined&&(input.serviceId!==UTM_PILOT_SERVICE.id||input.serviceTitleSnapshot!==UTM_PILOT_SERVICE.title))throw new Error('سناریوی پایلوت باید به خدمت موجود نقشه UTM تک‌برگی متصل باشد.');
  const service=await new DemoServicesRepository().getServiceById(input.serviceId),tariff=await new DemoTariffsRepository().getActiveTariff(input.serviceId);
  const calculationStatus=service&&service.isActive&&tariff?'unavailable':'unavailable';
  const scenario=validateScenario({...input,scenarioId:`val_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,schemaVersion:input.parcelAreaM2===undefined?1:2,environment:actor.environment,ownerUserId:actor.userId,expertPseudonym:pseudonym(actor.userId),createdAt:new Date().toISOString(),calculationStatus,anonymized:true,currency:'TOMAN'});
  storage.set(key(actor.environment),[scenario,...this.list(actor.environment)]); return scenario;
 }
 async getScenarios(actor:RepositoryActor){assertEnabled(actor);return this.list(actor.environment);}
 async getMyScenarios(actor:RepositoryActor){return this.getScenarios(actor);}
 async getScenario(actor:RepositoryActor,id:string){assertEnabled(actor);return this.list(actor.environment).find(s=>s.scenarioId===id)??null;}
 async getAggregate(actor:RepositoryActor,filter:Partial<ValidationScenario>){assertEnabled(actor);const scenarios=this.list(actor.environment).filter(s=>match(s,filter));const groupKey=Object.entries(filter).map(([k,v])=>`${k}:${String(v)}`).join('|')||'all';return aggregateValidationScenarios(groupKey,scenarios);}
 async createCalibrationSuggestion(actor:RepositoryActor,groupKey:string,filter:Partial<ValidationScenario>){assertEnabled(actor);const scenarios=this.list(actor.environment).filter(s=>match(s,filter));const proposal=createCalibrationProposal(groupKey,scenarios,actor.userId);if(proposal){const list=storage.get<CalibrationProposal[]>(proposalKey(actor.environment),[]);storage.set(proposalKey(actor.environment),[proposal,...list]);}return proposal;}
 async versionProposal(actor:RepositoryActor,proposalId:string){assertEnabled(actor);const list=storage.get<CalibrationProposal[]>(proposalKey(actor.environment),[]),parent=list.find(p=>p.id===proposalId);if(!parent)throw new Error('پیشنهاد یافت نشد.');if(parent.status==='versioned')throw new Error('نسخه قبلی قابل بازنویسی نیست.');const scenarios=this.list(actor.environment).filter(s=>s.environment===parent.environment);const next=createCalibrationProposal(parent.groupKey,scenarios,actor.userId,parent);if(!next)throw new Error('شرایط تنوع و تعداد نمونه برای نسخه جدید برقرار نیست.');next.status='versioned';storage.set(proposalKey(actor.environment),[next,...list]);return next;}
 async exportDemo(actor:RepositoryActor):Promise<ValidationLabExport>{assertEnabled(actor);assertEnvironment(actor,'demo');const scenarios=this.list('demo').map(s=>{const clean:Record<string,unknown>=Object.create(null);for(const field of EXPORT_KEYS)if(s[field as keyof ValidationScenario]!==undefined)clean[field]=s[field as keyof ValidationScenario];return clean as unknown as ValidationLabExport['scenarios'][number];});return{schemaVersion:2,environment:'demo',exportedAt:new Date().toISOString(),scenarios};}
 async importDemo(actor:RepositoryActor,source:string){assertEnabled(actor);assertEnvironment(actor,'demo');if(new TextEncoder().encode(source).byteLength>VALIDATION_LAB_LIMITS.maxImportBytes)throw new Error('حجم فایل بیشتر از حد مجاز است.');const parsed=JSON.parse(source,(k,v)=>{if(BLOCKED.has(k))throw new Error('ساختار فایل ناامن است.');return v;}) as ValidationLabExport;if(!parsed||![1,2].includes(parsed.schemaVersion)||parsed.environment!=='demo'||!Array.isArray(parsed.scenarios)||parsed.scenarios.length>VALIDATION_LAB_LIMITS.maxImportRecords)throw new Error('ساختار، محیط یا تعداد رکورد فایل معتبر نیست.');
  const importBatchPseudonym=`import_batch_${pseudonym(actor.userId)}_${Date.now()}`;
  const validated=parsed.scenarios.map(raw=>{for(const k of Object.keys(raw as object))if(!EXPORT_KEYS.has(k))throw new Error('Import شامل خروجی موتور، snapshot یا فیلد ناشناخته است.');return validateScenario({...raw,ownerUserId:actor.userId,expertPseudonym:importBatchPseudonym,calculationStatus:'unavailable'});});
  const previous=this.list('demo');try{storage.set(key('demo'),validated);}catch(error){storage.set(key('demo'),previous);throw error;}return validated.length;
 }
}
