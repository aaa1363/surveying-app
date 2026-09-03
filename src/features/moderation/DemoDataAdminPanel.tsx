import React, { useState } from 'react';
import { Download, RefreshCw, Upload } from 'lucide-react';
import { User } from '../../models/User';
import { demoDataRepository } from '../../repositories';
import { Button } from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/errors';

export const DemoDataAdminPanel: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [resetKeys, setResetKeys] = useState<string[] | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const actor = { userId: currentUser.id, role: currentUser.role, environment: currentUser.environment } as const;

  const run = async (action: () => Promise<void>) => {
    if (pending) return;
    setPending(true); setMessage('');
    try { await action(); } catch (error) { setMessage(getErrorMessage(error, 'عملیات مدیریت داده انجام نشد.')); }
    finally { setPending(false); }
  };

  const exportData = () => run(async () => {
    const payload = await demoDataRepository.exportData(actor);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'surveying-demo-data-v1.json'; anchor.click();
    URL.revokeObjectURL(url);
    setMessage('خروجی امن داده‌های Demo آماده شد.');
  });

  const importFile = (file?: File) => run(async () => {
    if (!file) throw new Error('فایل انتخاب نشده است.');
    const count = await demoDataRepository.importData(actor, await file.text());
    setMessage(`${count.toLocaleString('fa-IR')} کلید Demo به‌صورت یکپارچه وارد شد.`);
  });

  const prepareReset = () => run(async () => {
    const scope = await demoDataRepository.getResetScope(actor);
    setResetKeys(scope.keys); setConfirmation('');
    setMessage(`مرحله اول تأیید شد؛ فقط ${scope.keys.length.toLocaleString('fa-IR')} کلید متعلق به Demo حذف خواهد شد.`);
  });

  const reset = () => run(async () => {
    const count = await demoDataRepository.reset(actor, confirmation);
    setResetKeys(null); setConfirmation('');
    setMessage(`${count.toLocaleString('fa-IR')} کلید Demo حذف شد؛ داده‌های نامرتبط باقی ماند.`);
  });

  return (
    <section className="space-y-4" aria-labelledby="demo-data-title">
      <div><h3 id="demo-data-title" className="font-black text-slate-900">انتقال و پاک‌سازی امن داده Demo</h3><p className="text-xs text-slate-600 mt-1">فقط داده‌های متعلق به برنامه و محیط نمایشی؛ بدون اطلاعات حساس یا داده Real.</p></div>
      {message && <p role="status" className="p-3 rounded-xl bg-slate-100 text-sm text-slate-700">{message}</p>}
      <div className="grid sm:grid-cols-3 gap-3">
        <Button onClick={() => void exportData()} isLoading={pending} rightIcon={<Download className="w-4 h-4" />}>Export امن</Button>
        <label className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-bold cursor-pointer focus-within:ring-2 focus-within:ring-teal-600">
          <Upload className="w-4 h-4" /> Import امن
          <input className="sr-only" type="file" accept="application/json,.json" disabled={pending} onChange={(event) => void importFile(event.target.files?.[0])} aria-label="انتخاب فایل داده Demo" />
        </label>
        <Button variant="danger" onClick={() => void prepareReset()} disabled={pending} rightIcon={<RefreshCw className="w-4 h-4" />}>مرحله اول Reset</Button>
      </div>
      {resetKeys && <div className="p-4 border border-rose-200 bg-rose-50 rounded-xl space-y-3">
        <p className="text-xs text-rose-900">محدوده حذف: {resetKeys.length.toLocaleString('fa-IR')} کلید Demo متعلق به برنامه. برای تأیید دوم عبارت «حذف داده‌های نمایشی» را وارد کنید.</p>
        <label htmlFor="demo-reset-confirmation" className="block text-xs font-bold">عبارت تأیید</label>
        <input id="demo-reset-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-xl border border-rose-300 p-3" />
        <Button variant="danger" onClick={() => void reset()} disabled={pending || confirmation !== 'حذف داده‌های نمایشی'}>حذف فقط داده‌های Demo</Button>
      </div>}
    </section>
  );
};
