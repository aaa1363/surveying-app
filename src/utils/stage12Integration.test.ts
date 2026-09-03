import {compareJalaliDates,isCompleteJalaliInput,isValidJalaliDate,normalizeJalaliDate} from './jalaliDate';
import {issueOnlyAfterPdfPreflight,safeDocumentFileName} from './documentPdf';
import {DemoPersonalRatesRepository} from '../repositories/demo/DemoPersonalRatesRepository';
import {DemoDataRepository} from '../repositories/demo/DemoDataRepository';
import {DemoProjectRepository} from '../repositories/demo/DemoProjectRepository';
import {DEFAULT_EQUIPMENT_RATES,DEFAULT_LABOR_RATES,DEFAULT_MATERIAL_RATES} from '../models/PersonalRates';

type Result={title:string;passed:boolean;message:string};
const admin={userId:'admin-stage12',role:'admin',environment:'demo'} as const;
const ok=(title:string,passed:boolean):Result=>({title,passed,message:passed?'موفق':'ناموفق'});
const rejects=async(fn:()=>Promise<unknown>)=>{try{await fn();return false;}catch{return true;}};

export async function runStage12Tests():Promise<Result[]> {
  const results:Result[]=[];
  results.push(ok('ورودی تدریجی تاریخ حذف یا فوراً رد نشود',!isCompleteJalaliInput('10')&&!isCompleteJalaliInput('1405/0')));
  results.push(ok('اعداد فارسی و تک‌رقمی canonical شوند',normalizeJalaliDate('۱۴۰۵/۷/۱')==='1405/07/01'));
  results.push(ok('ماه ۱۳ و روز نامعتبر رد شوند',!isValidJalaliDate('1405/13/01').isValid&&!isValidJalaliDate('1404/12/30').isValid));
  results.push(ok('سال کبیسه شمسی پذیرفته شود',isValidJalaliDate('1403/12/30').isValid));
  results.push(ok('ترتیب تاریخ شروع و ثبت قابل کنترل باشد',compareJalaliDates('1405/01/01','1405/01/02')<0));
  results.push(ok('نام PDF امن و قابل پیش‌بینی باشد',safeDocumentFileName('contract','PRJ-1405-0001')==='contract-PRJ-1405-0001.pdf'));
  let issueCalls=0;
  const invalidPdf={bytes:new Uint8Array([1,2,3]),fileName:'bad.pdf',pages:0};
  results.push(ok('PDF خراب یا صفر بایت رد شود',await rejects(()=>issueOnlyAfterPdfPreflight(async()=>invalidPdf,async()=>{issueCalls+=1;}))));
  results.push(ok('شکست PDF وضعیت صادرشده ایجاد نکند',issueCalls===0));
  const rateRepo=new DemoPersonalRatesRepository();
  const empty=await rateRepo.savePersonalRates({userId:'stage12-rates',laborRates:structuredClone(DEFAULT_LABOR_RATES),equipmentRates:structuredClone(DEFAULT_EQUIPMENT_RATES),materialRates:structuredClone(DEFAULT_MATERIAL_RATES),updatedAt:new Date().toISOString(),schemaVersion:1});
  results.push(ok('نرخ‌های خالی undefined باقی بمانند',empty.laborRates.every(item=>item.fullDayRate===undefined&&item.halfDayRate===undefined)));
  const bad=structuredClone(empty);bad.laborRates[0].fullDayRate=0;
  results.push(ok('نرخ صفر رد شود',await rejects(()=>rateRepo.savePersonalRates(bad))));
  const good=structuredClone(empty);good.laborRates[0].fullDayRate=1_000_000;
  results.push(ok('نرخ مثبت ذخیره شود',(await rateRepo.savePersonalRates(good)).laborRates[0].fullDayRate===1_000_000));
  localStorage.setItem('geo_demo_projects_stage12-reset','[]');localStorage.setItem('unrelated-stage12','keep');
  const dataRepo=new DemoDataRepository();const scope=await dataRepo.getResetScope(admin);await dataRepo.reset(admin,scope.confirmationPhrase);
  results.push(ok('Reset فقط داده کسب‌وکاری Demo را حذف کند',localStorage.getItem('geo_demo_projects_stage12-reset')===null&&localStorage.getItem('unrelated-stage12')==='keep'));
  const projects=await new DemoProjectRepository().getProjects('stage12-empty-user');
  results.push(ok('پس از Reset پروژه seed دوباره ساخته نشود',projects.length===0));
  results.push(ok('حساب‌ها و کلید نامرتبط حفظ شوند',localStorage.getItem('unrelated-stage12')==='keep'));
  return results;
}
