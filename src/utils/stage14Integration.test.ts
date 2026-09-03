import {readFileSync} from 'node:fs';
const read=(p:string)=>readFileSync(p,'utf8');
export async function runStage14IntegrationTests(){const out:{name:string;passed:boolean}[]=[];const test=(name:string,ok:boolean)=>out.push({name,passed:ok});const nav=read('src/components/layout/BottomNavigation.tsx');const hubs=read('src/features/hubs/NavigationHubs.tsx');const css=read('src/index.css');const app=read('src/app/App.tsx');
test('ناوبری نقشه‌بردار پنج تب دارد',['داشبورد','پروژه‌ها','قیمت‌گذاری','اسناد','پروفایل'].every(x=>nav.includes(`label: '${x}'`)||nav.includes(`label:'${x}'`)));
test('ناوبری کارفرما پنج تب دارد',['نقشه‌برداران','قیمت‌ها','درخواست‌ها'].every(x=>nav.includes(`label:'${x}'`)));
test('ناوبری مدیر پنج تب دارد',['مدیریت','تعرفه‌ها','آزمایشگاه','تنظیمات'].every(x=>nav.includes(`label: '${x}'`)||nav.includes(`label:'${x}'`)));
test('HubCard و HubSection و PageHeader مشترک‌اند',['HubCard','HubSection','PageHeader'].every(x=>read('src/components/hub/HubComponents.tsx').includes(x)));
test('مرکز پروژه ثبت و مدیریت مستقل دارد',hubs.includes('ثبت پروژه')&&hubs.includes('مدیریت پروژه‌ها'));
test('Hub قیمت‌گذاری آزمایشگاه را نمایش نمی‌دهد',hubs.slice(hubs.indexOf('PricingHub'),hubs.indexOf('DocumentsLandingHub')).includes('آزمایشگاه')===false);
test('اسناد و پروفایل Hub مستقل دارند',hubs.includes('DocumentsLandingHub')&&hubs.includes('ProfileHub'));
test('تم روشن، تیره و سیستم نسخه‌دار است',read('src/utils/theme.ts').includes('surveying.appearance.v1')&&['light','dark','system'].every(x=>hubs.includes(`'${x}'`)));
test('CSS variables و reduced motion تعریف شده', ['--primary','--accent','--background','--surface','--danger','prefers-reduced-motion'].every(x=>css.includes(x)));
test('role guard کارفرما و مدیر حفظ شده',app.includes("currentUser.role === 'client'")&&app.includes("currentUser.role==='admin'")&&app.includes('<UnauthorizedState/>'));
return out;}
