import React from 'react';
import { CreditCard, FileSignature } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const FutureCapabilitiesPanel: React.FC = () => (
  <section className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label="قابلیت‌های آینده غیرفعال">
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
        <CreditCard className="w-4 h-4 text-slate-400" />
        <span>درگاه پرداخت</span>
      </div>
      <p className="text-xs text-slate-600">قابلیت آینده — غیرفعال</p>
      <p className="text-xs text-slate-500">هیچ اتصال بانکی یا عملیات مالی در این نسخه انجام نمی‌شود.</p>
      <Button type="button" disabled className="w-full">پرداخت</Button>
    </div>
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
        <FileSignature className="w-4 h-4 text-slate-400" />
        <span>امضای دیجیتال</span>
      </div>
      <p className="text-xs text-slate-600">قابلیت آینده — غیرفعال</p>
      <p className="text-xs text-slate-500">امضای دیجیتال نمایشی است و اعتبار حقوقی ندارد</p>
      <Button type="button" disabled className="w-full">امضای سند</Button>
    </div>
  </section>
);

