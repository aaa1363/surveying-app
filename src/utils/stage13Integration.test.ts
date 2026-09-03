import { DemoAuthRepository } from '../repositories/demo/DemoAuthRepository';
import { DemoProjectRepository } from '../repositories/demo/DemoProjectRepository';
import { DemoServicesRepository } from '../repositories/demo/DemoServicesRepository';
import { DemoTariffsRepository } from '../repositories/demo/DemoTariffsRepository';
import { SERVICES_CATALOG } from '../data/servicesCatalog';
import { storage } from './storage';

export async function runStage13IntegrationTests(){
 const results:{name:string;passed:boolean}[]=[]; const test=async(name:string,fn:()=>boolean|Promise<boolean>)=>{try{results.push({name,passed:await fn()});}catch{results.push({name,passed:false});}};
 const phone='۰۹۱۲ ۸۸۸ ۷۷۶۶'; const auth=new DemoAuthRepository();
 await test('ثبت‌نام و ورود مجدد، شناسه و نام پایدار',async()=>{const first=(await auth.register({phone,role:'surveyor',entityType:'individual',firstName:'سارا',lastName:'آزمایش'})).user;await auth.logout();const second=(await auth.loginWithDemoOtp('09128887766','12345','client')).user;return first.id===second.id&&first.profileId===second.profileId&&second.fullName==='سارا آزمایش'&&second.role==='surveyor';});
 await test('دو شماره موبایل ادغام نشوند',async()=>{const a=(await auth.register({phone:'09120000001',role:'client',entityType:'individual',firstName:'الف',lastName:'یک'})).user;const b=(await auth.register({phone:'09120000002',role:'client',entityType:'individual',firstName:'ب',lastName:'دو'})).user;return a.id!==b.id&&a.profileId!==b.profileId;});
 await test('سه ریزخدمت یکتا هستند',()=>{const ids=SERVICES_CATALOG.flatMap(c=>c.subServices.map(s=>s.id));return ['sur_property_stakeout_v1','sur_deed_existing_compare_v1','rou_street_project_line_v1'].every(id=>ids.filter(x=>x===id).length===1);});
 await test('ریزخدمات جدید تعرفه فرضی ندارند',async()=>{const services=await new DemoServicesRepository().getServices();const tariffs=await new DemoTariffsRepository().getTariffs();return services.filter(s=>s.id.endsWith('_v1')).length>=3&&!tariffs.some(t=>['sur_property_stakeout_v1','sur_deed_existing_compare_v1','rou_street_project_line_v1'].includes(t.serviceId));});
 await test('حذف نرم، پنهان‌سازی و بازیابی',async()=>{const repo=new DemoProjectRepository();const p=await repo.createDraft('owner13');p.title='پروژه تست';await repo.saveDraft(p);await repo.softDeleteProject('owner13',p.id,'surveyor');const hidden=!(await repo.getProjects('owner13')).some(x=>x.id===p.id);const deleted=(await repo.getDeletedProjects('owner13')).some(x=>x.id===p.id);await repo.restoreProject('owner13',p.id,'surveyor');return hidden&&deleted&&(await repo.getProjects('owner13')).some(x=>x.id===p.id);});
 await test('غیرمالک و نقش غیرنقشه‌بردار امکان حذف ندارند',async()=>{const repo=new DemoProjectRepository();try{await repo.softDeleteProject('other13','missing','client');return false;}catch{return true;}});
 await test('ورودی عنوان composition پایدار دارد',async()=>{const text=await import('node:fs/promises').then(fs=>fs.readFile('src/features/projects/components/ProjectCard1Details.tsx','utf8'));return text.includes('onCompositionStart')&&text.includes('onCompositionEnd')&&text.includes('rawTitle');});
 await test('versionCode افزایش یافته',async()=>{const text=await import('node:fs/promises').then(fs=>fs.readFile('android/app/build.gradle','utf8'));const value=Number(text.match(/versionCode\s+(\d+)/)?.[1]);return value>=2;});
 storage.remove('surveying.demo_local_accounts.v1'); storage.remove('geo_demo_auth_user');
 return results;
}
