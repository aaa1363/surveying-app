import { DEFAULT_SURVEYING_SERVICES, SurveyingService } from '../../models';
import { IServicesRepository } from '../interfaces/IServicesRepository';
import { storage } from '../../utils/storage';
import { RepositoryActor } from '../interfaces/ITariffsRepository';
const STORAGE_KEY = 'surveying.services.v1';
const requireAdmin=(actor:RepositoryActor)=>{if(actor.role!=='admin') throw new Error('این عملیات فقط برای مدیر مجاز است.');};
export class DemoServicesRepository implements IServicesRepository {
  async getServices(): Promise<SurveyingService[]> { const data=storage.get<SurveyingService[]>(STORAGE_KEY, DEFAULT_SURVEYING_SERVICES); const source=data.length?data:DEFAULT_SURVEYING_SERVICES; const normalized=source.map((s:any)=>({id:s.id,categoryId:s.categoryId||'cat_mapping',title:s.title,unit:s.unit,description:s.description||s.notes,isActive:s.isActive!==false,isDemo:s.isDemo!==false,createdAt:s.createdAt||new Date().toISOString(),updatedAt:s.updatedAt||new Date().toISOString(),schemaVersion:1 as const})); storage.set(STORAGE_KEY,normalized); return normalized; }
  async getServiceById(id:string):Promise<SurveyingService|null>{ return (await this.getServices()).find(s=>s.id===id) ?? null; }
  async saveService(service:SurveyingService,actor:RepositoryActor):Promise<SurveyingService>{ requireAdmin(actor); const list=await this.getServices(); const next={...service,updatedAt:new Date().toISOString()}; const index=list.findIndex(s=>s.id===service.id); if(index>=0) list[index]=next; else list.push(next); storage.set(STORAGE_KEY,list); return next; }
  async toggleServiceActive(id:string,isActive:boolean,actor:RepositoryActor):Promise<void>{ requireAdmin(actor); const list=await this.getServices(); storage.set(STORAGE_KEY,list.map(s=>s.id===id?{...s,isActive,updatedAt:new Date().toISOString()}:s)); }
  async resetToDemo(actor:RepositoryActor):Promise<void>{ requireAdmin(actor); storage.set(STORAGE_KEY,DEFAULT_SURVEYING_SERVICES); }
  async clearDemoData(actor:RepositoryActor):Promise<void>{ requireAdmin(actor); storage.set(STORAGE_KEY,(await this.getServices()).filter(s=>!s.isDemo)); }
}
