import { DEFAULT_PRICING_SETTINGS, MarketPriceRecord, MarketStatistics } from '../models';
import { DemoMarketPricesRepository, DemoPricingSettingsRepository, DemoServicesRepository, DemoTariffsRepository } from '../repositories/demo';
import { analyzeMarketRecordsIQR, buildEmployerPriceSummary, calculateProjectPricing, getMarketStatisticsForService } from './pricingEngine';
import { PRICING_LIMITS } from './pricingValidation';

type Result={title:string;passed:boolean;message:string};
const baseStats:MarketStatistics={serviceId:'sur_1',totalSamples:6,validSamples:6,outliersCount:0,medianPrice:4_600_000,minPrice:4_200_000,maxPrice:4_900_000,q1Price:4_400_000,q3Price:4_800_000,iqr:400_000,lowerBound:3_800_000,upperBound:5_400_000,confidenceLevel:'medium',confidenceMessage:'متوسط'};
const input={actualCost:2_000_000,quantity:2,unit:'بلوک' as const,baseRate:3_500_000,minAmount:3_000_000,locationCoefficient:1,difficultyCoefficient:1,riskCoefficient:1,qualityCoefficient:1,profitPercent:20,taxesAndDeductions:100_000,selectedLevel:'standard' as const};
const record=(id:string,price:number,projectId=`p-${id}`,isDemo=true):MarketPriceRecord=>({id,serviceId:'sur_1',serviceTitle:'برداشت',projectId,userId:'u',unit:'بلوک',unitPrice:price,totalPrice:price,quantity:1,projectStatus:'completed',reliabilityWeight:1,isOutlier:false,isDemo,createdAt:'',updatedAt:'',schemaVersion:1});
const rejects=(fn:()=>unknown)=>{try{fn();return false;}catch{return true;}};
const rejectsAsync=async(fn:()=>Promise<unknown>)=>{try{await fn();return false;}catch{return true;}};

export async function runStage9IntegrationTests():Promise<Result[]>{
 const results:Result[]=[]; const test=async(title:string,fn:()=>boolean|Promise<boolean>)=>{try{results.push({title,passed:await fn(),message:'موفق'});}catch(e){results.push({title,passed:false,message:e instanceof Error?e.message:'خطا'});}};
 const calc=()=>calculateProjectPricing(input,baseStats,DEFAULT_PRICING_SETTINGS);
 await test('۱. محاسبه تکراری idempotent است',()=>JSON.stringify(calc())===JSON.stringify(calc()));
 await test('۲. quantity صفر رد می‌شود',()=>rejects(()=>calculateProjectPricing({...input,quantity:0},baseStats,DEFAULT_PRICING_SETTINGS)));
 await test('۳. quantity منفی رد می‌شود',()=>rejects(()=>calculateProjectPricing({...input,quantity:-1},baseStats,DEFAULT_PRICING_SETTINGS)));
 await test('۴. NaN رد می‌شود',()=>rejects(()=>calculateProjectPricing({...input,actualCost:NaN},baseStats,DEFAULT_PRICING_SETTINGS)));
 await test('۵. Infinity رد می‌شود',()=>rejects(()=>calculateProjectPricing({...input,baseRate:Infinity},baseStats,DEFAULT_PRICING_SETTINGS)));
 await test('۶. منفی پنهانی clamp نمی‌شود',()=>rejects(()=>calculateProjectPricing({...input,taxesAndDeductions:-1},baseStats,DEFAULT_PRICING_SETTINGS)));
 await test('۷. مقدار بیش از سقف مرکزی رد می‌شود',()=>rejects(()=>calculateProjectPricing({...input,actualCost:PRICING_LIMITS.maxMoney+1},baseStats,DEFAULT_PRICING_SETTINGS)));
 await test('۸. overflow ضرب رد می‌شود',()=>rejects(()=>calculateProjectPricing({...input,baseRate:PRICING_LIMITS.maxMoney,quantity:PRICING_LIMITS.maxQuantity},baseStats,DEFAULT_PRICING_SETTINGS)));
 await test('۹. خروجی تومان و safe integer است',()=>{const r=calc();return Number.isSafeInteger(r.finalPrice)&&r.finalPrice>=0;});
 await test('۱۰. وزن‌ها normalize می‌شوند',()=>{const r=calculateProjectPricing(input,baseStats,{...DEFAULT_PRICING_SETTINGS,tariffWeight:.2,marketWeight:.2});return Number.isFinite(r.referencePrice);});
 await test('۱۱. مجموع وزن صفر رد می‌شود',()=>rejects(()=>calculateProjectPricing(input,baseStats,{...DEFAULT_PRICING_SETTINGS,tariffWeight:0,marketWeight:0})));
 await test('۱۲. ضریب اقتصادی بالاتر از یک رد می‌شود',()=>rejects(()=>calculateProjectPricing(input,baseStats,{...DEFAULT_PRICING_SETTINGS,economicFactor:1.1})));
 await test('۱۳. ضریب تخصصی کمتر از یک رد می‌شود',()=>rejects(()=>calculateProjectPricing(input,baseStats,{...DEFAULT_PRICING_SETTINGS,specializedFactor:.9})));
 await test('۱۴. ترتیب سه سطح همیشه برقرار است',()=>{const r=calc();return r.economicPrice<=r.standardPrice&&r.standardPrice<=r.specializedPrice;});
 await test('۱۵. همه سطح‌ها کف هزینه و تعرفه را رعایت می‌کنند',()=>{const r=calc(),floor=Math.max(r.costBasedPrice,r.adjustedTariff);return [r.economicPrice,r.standardPrice,r.specializedPrice].every(x=>x>=floor);});
 await test('۱۶. custom زیر کف رد می‌شود',()=>rejects(()=>calculateProjectPricing({...input,selectedLevel:'custom',customPriceAmount:1},baseStats,DEFAULT_PRICING_SETTINGS)));
 await test('۱۷. IQR outlier را بدون حذف فیزیکی جدا می‌کند',()=>{const source=[1,2,3,4,5,100].map((x,i)=>record(String(i),x*1_000_000));const r=analyzeMarketRecordsIQR(source);return r.outlierRecords.length===1&&source.length===6;});
 await test('۱۸. میانه نهایی فقط از non-outlier است',()=>{const r=getMarketStatisticsForService([4,4.2,4.4,4.6,4.8,50].map((x,i)=>record(String(i),x*1_000_000)),'sur_1',DEFAULT_PRICING_SETTINGS);return r.medianPrice<10_000_000;});
 await test('۱۹. رکورد صفر و NaN معتبر شمرده نمی‌شود',()=>{const r=getMarketStatisticsForService([record('a',0),record('b',NaN),record('c',4_000_000)],'sur_1',DEFAULT_PRICING_SETTINGS);return r.validSamples===1&&r.excludedRecords?.length===2;});
 await test('۲۰. confidence فقط از valid non-outlier است',()=>{const r=getMarketStatisticsForService([record('a',4_000_000),record('b',4_100_000),record('c',4_200_000),record('d',40_000_000),record('e',0)],'sur_1',DEFAULT_PRICING_SETTINGS);return r.validSamples<5&&r.confidenceLevel==='low';});
 await test('۲۱. پروژه جاری از بازار حذف می‌شود',()=>getMarketStatisticsForService([record('a',4_000_000,'current'),record('b',5_000_000,'other')],'sur_1',DEFAULT_PRICING_SETTINGS,{projectId:'current'}).validSamples===1);
 await test('۲۲. Demo و Real در Repository جدا هستند',async()=>{localStorage.clear();localStorage.setItem('surveying.marketPrices.v1',JSON.stringify([record('d',4_000_000,'d',true),record('r',5_000_000,'r',false)]));const repo=new DemoMarketPricesRepository();return (await repo.getMarketRecords(undefined,'demo')).length===1&&(await repo.getMarketRecords(undefined,'real')).length===1;});
 await test('۲۳. mutation خدمت توسط surveyor رد می‌شود',async()=>{localStorage.clear();const repo=new DemoServicesRepository();const service=(await repo.getServices())[0];return rejectsAsync(()=>repo.saveService(service,{id:'s',name:'s',role:'surveyor'}));});
 await test('۲۴. mutation خدمت توسط client رد می‌شود',async()=>{localStorage.clear();const repo=new DemoServicesRepository();return rejectsAsync(()=>repo.toggleServiceActive('sur_1',false,{id:'c',name:'c',role:'client'}));});
 await test('۲۵. تنظیم نامعتبر در Repository ذخیره نمی‌شود',async()=>{localStorage.clear();return rejectsAsync(()=>new DemoPricingSettingsRepository().updateSettings({economicFactor:2},{id:'a',name:'a',role:'admin'}));});
 await test('۲۶. غیرمدیر نسخه تعرفه ایجاد نمی‌کند',async()=>{localStorage.clear();return rejectsAsync(()=>new DemoTariffsRepository().updateTariff('sur_1',{baseRate:1,minAmount:1,version:'x',validFrom:'1405/01/01',sourceTitle:'x'},{id:'s',name:'s',role:'surveyor'}));});
 await test('۲۷. نسخه قبلی immutable باقی می‌ماند',async()=>{localStorage.clear();const repo=new DemoTariffsRepository();const before=structuredClone((await repo.getTariffs())[0]);await repo.updateTariff('sur_1',{baseRate:5_000_000,minAmount:3_000_000,version:'1405.9',validFrom:'1405/01/01',sourceTitle:'برآورد پیشنهادی'},{id:'a',name:'a',role:'admin'});return JSON.stringify((await repo.getTariffs()).find(x=>x.id===before.id))===JSON.stringify({...before,isActive:false});});
 await test('۲۸. duplicate version رد و فقط یک نسخه فعال است',async()=>{localStorage.clear();const repo=new DemoTariffsRepository(),actor={id:'a',name:'a',role:'admin' as const},data={baseRate:5_000_000,minAmount:3_000_000,version:'1405.9',validFrom:'1405/01/01',sourceTitle:'برآورد پیشنهادی'};await repo.updateTariff('sur_1',data,actor);const rejected=await rejectsAsync(()=>repo.updateTariff('sur_1',data,actor));return rejected&&(await repo.getTariffs()).filter(x=>x.serviceId==='sur_1'&&x.isActive).length===1;});
 await test('۲۹. Preview مبلغ عددی/حروف و quantity/unit یکسان دارد',()=>{const r=calc(),p=buildEmployerPriceSummary('p','s',r,'یادداشت',input.quantity,input.unit);return p.finalPrice===r.finalPrice&&p.finalPriceInWords.includes('تومان')&&p.quantity===2&&p.unit==='بلوک';});
 await test('۳۰. Preview serialized اطلاعات داخلی افشا نمی‌کند',()=>{const text=JSON.stringify(buildEmployerPriceSummary('p','s',calc()));return !['actualCost','profitPercent','taxesAndDeductions','personalRate','outlier','tariffWeight'].some(k=>text.includes(k));});
 return results;
}
