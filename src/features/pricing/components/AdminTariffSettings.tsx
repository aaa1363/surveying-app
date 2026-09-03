import React,{useEffect,useState} from 'react';
import { Shield,Save,Edit2 } from 'lucide-react';
import { PricingSettings,ServiceTariff,SurveyingService,UserRole } from '../../../models';
import { pricingSettingsRepository,servicesRepository,tariffsRepository } from '../../../repositories';
import { Card,CardHeader,CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { formatToman,toEnglishDigits } from '../../../utils/formatters';

interface Props { currentUser:{id:string;name:string;role:UserRole}; }
export const AdminTariffSettings:React.FC<Props>=({currentUser})=>{
 const canEdit=currentUser.role==='admin';
 const [services,setServices]=useState<SurveyingService[]>([]); const [tariffs,setTariffs]=useState<ServiceTariff[]>([]); const [settings,setSettings]=useState<PricingSettings|null>(null);
 const [editing,setEditing]=useState<string|null>(null); const [baseRate,setBaseRate]=useState(''); const [minAmount,setMinAmount]=useState(''); const [version,setVersion]=useState(''); const [message,setMessage]=useState('');
 const load=async()=>{const [s,t,p]=await Promise.all([servicesRepository.getServices(),tariffsRepository.getTariffs(),pricingSettingsRepository.getSettings()]);setServices(s);setTariffs(t);setSettings(p);};
 useEffect(()=>{void load();},[]);
 const tariffFor=(id:string)=>tariffs.find(t=>t.serviceId===id&&t.isActive)??(canEdit?tariffs.find(t=>t.serviceId===id):undefined);
 const start=(s:SurveyingService,newVersion=false)=>{if(!canEdit)return;const t=tariffFor(s.id);if(!t)return;setEditing(s.id);setBaseRate(String(t.baseRate));setMinAmount(String(t.minAmount));setVersion(newVersion?'1405.1':t.version);};
 const save=async(s:SurveyingService)=>{const t=tariffFor(s.id);if(!t)return;try{await tariffsRepository.updateTariff(s.id,{baseRate:Number(toEnglishDigits(baseRate)),minAmount:Number(toEnglishDigits(minAmount)),version:version.trim(),validFrom:t.validFrom,sourceTitle:t.sourceTitle,sourceUrl:t.sourceUrl,notes:t.notes,isActive:true},currentUser);setMessage('تعرفه با موفقیت ذخیره شد.');setEditing(null);await load();}catch(e){setMessage(e instanceof Error?e.message:'خطا در ذخیره تعرفه');}};
 const saveSettings=async()=>{if(!settings)return;try{await pricingSettingsRepository.updateSettings(settings,currentUser);setMessage('تنظیمات قیمت‌گذاری ذخیره شد.');}catch(e){setMessage(e instanceof Error?e.message:'خطا در ذخیره تنظیمات');}};
 const toggle=async(s:SurveyingService)=>{const t=tariffs.find(x=>x.serviceId===s.id&&x.isActive)??tariffs.find(x=>x.serviceId===s.id);if(!t)return;try{await tariffsRepository.setTariffActive(s.id,!t.isActive,currentUser);await load();}catch(e){setMessage(e instanceof Error?e.message:'خطا در تغییر وضعیت تعرفه');}};
 return <div className="space-y-5" dir="rtl">
  <div className={`p-4 rounded-2xl border ${canEdit?'bg-amber-50 border-amber-200':'bg-slate-50 border-slate-200'}`}><div className="flex items-center gap-2 font-bold"><Shield className="w-5 h-5"/>تعرفه مرجع و تنظیمات قیمت‌گذاری <Badge variant={canEdit?'warning':'neutral'} size="sm">{canEdit?'دسترسی مدیر · ورود نمایشی':'فقط مشاهده'}</Badge></div><p className="text-xs mt-2 text-slate-600">برآورد پیشنهادی براساس تنظیمات و داده‌های موجود است. کنترل ویرایش هم در رابط و هم Repository اعمال شده است.</p></div>
  {message&&<div className="p-3 rounded-xl bg-teal-50 text-teal-900 text-xs">{message}</div>}
  <Card><CardHeader><CardTitle>گروه «برداشت و تهیه نقشه» و پنج خدمت فرعی</CardTitle></CardHeader><div className="space-y-3">
   {services.map(s=>{const t=tariffFor(s.id);return <div key={s.id} className="p-4 border rounded-xl bg-white"><div className="flex justify-between gap-3"><div><h4 className="font-bold text-sm">{s.title}</h4><p className="text-xs text-slate-500 mt-1">{s.description}</p>{t?<p className="text-xs mt-2">نرخ واحد: <b>{formatToman(t.baseRate)}</b> · حداقل: <b>{formatToman(t.minAmount)}</b> · نسخه {t.version} · {t.isActive?'فعال':'غیرفعال'}</p>:<p className="text-xs mt-2 text-amber-700">تعرفه فعالی برای مشاهده وجود ندارد.</p>}</div>{canEdit&&t&&<div className="flex gap-2 flex-wrap"><Button size="sm" variant="outline" onClick={()=>void toggle(s)}>{t.isActive?'غیرفعال‌سازی':'فعال‌سازی'}</Button><Button size="sm" variant="outline" onClick={()=>start(s)}>ویرایش نرخ</Button><Button size="sm" variant="secondary" onClick={()=>start(s,true)} rightIcon={<Edit2 className="w-3.5 h-3.5"/>}>نسخه جدید</Button></div>}</div>
    {editing===s.id&&<div className="grid sm:grid-cols-4 gap-2 mt-3"><Input value={baseRate} onChange={e=>setBaseRate(e.target.value)} placeholder="نرخ پایه"/><Input value={minAmount} onChange={e=>setMinAmount(e.target.value)} placeholder="حداقل مبلغ"/><Input value={version} onChange={e=>setVersion(e.target.value)} placeholder="نسخه تعرفه"/><Button onClick={()=>void save(s)} rightIcon={<Save className="w-4 h-4"/>}>ذخیره</Button></div>}</div>;})}
  </div></Card>
  {settings&&<Card><CardHeader><CardTitle>تنظیمات موتور قیمت‌گذاری</CardTitle></CardHeader><div className="grid sm:grid-cols-2 gap-3"><label className="text-xs">وزن تعرفه<Input disabled={!canEdit} value={String(settings.tariffWeight*100)} onChange={e=>{const v=Math.max(0,Math.min(100,Number(toEnglishDigits(e.target.value))));setSettings({...settings,tariffWeight:v/100,marketWeight:(100-v)/100});}}/></label><label className="text-xs">ضریب IQR<Input disabled={!canEdit} value={String(settings.outlierIqrMultiplier)} onChange={e=>setSettings({...settings,outlierIqrMultiplier:Number(toEnglishDigits(e.target.value))})}/></label></div>{canEdit&&<div className="mt-3"><Button onClick={()=>void saveSettings()}>ذخیره تنظیمات</Button></div>}</Card>}
 </div>;
};
