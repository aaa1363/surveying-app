import { DEFAULT_SERVICE_TARIFFS, ServiceTariff } from '../../models';
import { ITariffsRepository, RepositoryActor, TariffUpdateInput } from '../interfaces/ITariffsRepository';
import { storage } from '../../utils/storage';
import { DemoTariffAuditRepository } from './DemoTariffAuditRepository';
import { getCurrentJalaliDate } from '../../utils/jalaliDate';
import { money } from '../../utils/pricingValidation';
const STORAGE_KEY='surveying.tariffs.v1';
const audit=new DemoTariffAuditRepository();
const requireAdmin=(actor:RepositoryActor)=>{if(actor.role!=='admin') throw new Error('دسترسی غیرمجاز: فقط مدیر می‌تواند تعرفه را تغییر دهد.');};
export class DemoTariffsRepository implements ITariffsRepository {
  async getTariffs(){ const data=storage.get<ServiceTariff[]>(STORAGE_KEY,DEFAULT_SERVICE_TARIFFS); const source=data.length?data:DEFAULT_SERVICE_TARIFFS; return source.map(t=>({...t,createdBy:t.createdBy??'system_admin'})); }
  async getActiveTariff(serviceId:string){return (await this.getTariffs()).find(t=>t.serviceId===serviceId&&t.isActive)??null;}
  async getTariffVersions(){return [...new Set((await this.getTariffs()).map(t=>t.version))];}
  async getTariffsByVersion(version:string){return (await this.getTariffs()).filter(t=>t.version===version);}
  async updateTariff(serviceId:string,input:TariffUpdateInput,actor:RepositoryActor){
    requireAdmin(actor); const baseRate=money(input.baseRate,'نرخ پایه',false); const minAmount=money(input.minAmount,'حداقل مبلغ',false);
    const list=await this.getTariffs(); if(list.some(t=>t.serviceId===serviceId&&t.version===input.version)) throw new Error('این نسخه تعرفه قبلاً ثبت شده و قابل بازنویسی نیست.');
    const parent=list.find(t=>t.serviceId===serviceId&&t.isActive)??list.filter(t=>t.serviceId===serviceId).at(-1); const now=new Date().toISOString();
    const next:ServiceTariff={id:`tariff_${serviceId}_${Date.now()}`,serviceId,version:input.version.trim(),baseRate,minAmount,validFrom:input.validFrom,sourceTitle:input.sourceTitle,sourceUrl:input.sourceUrl,notes:input.notes,isActive:input.isActive??true,isDemo:parent?.isDemo??true,currency:'TOMAN',createdAt:now,createdBy:actor.id,parentVersionId:parent?.id,updatedAt:now,schemaVersion:1};
    const updated=[...list.map(t=>next.isActive&&t.serviceId===serviceId?{...t,isActive:false}:t),next]; storage.set(STORAGE_KEY,updated);
    await audit.logChange({serviceId,action:'create',fieldChanged:'نسخه تعرفه',oldValue:parent?.version,newValue:next.version,performedBy:actor.name,performedAtJalali:getCurrentJalaliDate(),note:'ایجاد نسخه جدید و غیرقابل‌بازنویسی تعرفه'}); return next;
  }
  async setTariffActive(serviceId:string,active:boolean,actor:RepositoryActor){requireAdmin(actor); const list=await this.getTariffs(); const current=list.find(t=>t.serviceId===serviceId&&t.isActive)??list.find(t=>t.serviceId===serviceId); if(!current) throw new Error('تعرفه یافت نشد.'); const next={...current,isActive:active,updatedAt:new Date().toISOString()}; storage.set(STORAGE_KEY,list.map(t=>t.id===current.id?next:t)); await audit.logChange({serviceId,action:'toggle_active',fieldChanged:'وضعیت تعرفه',oldValue:!active,newValue:active,performedBy:actor.name,performedAtJalali:getCurrentJalaliDate()}); return next;}
}
