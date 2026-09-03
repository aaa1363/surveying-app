import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DemoDataRepository } from '../repositories/demo/DemoDataRepository';
import { RepositoryActor } from '../models/Stage6Models';

type Result = { testNumber: number; title: string; passed: boolean; message: string };
const admin: RepositoryActor = { userId: 'admin-stage8', role: 'admin', environment: 'demo' };
const surveyor: RepositoryActor = { userId: 'surveyor-stage8', role: 'surveyor', environment: 'demo' };
const realAdmin: RepositoryActor = { userId: 'admin-real', role: 'admin', environment: 'real' };
const rejects = async (action: () => Promise<unknown>) => { try { await action(); return false; } catch { return true; } };
const valid = (data: Record<string, unknown> = {}) => JSON.stringify({ schemaVersion: 1, environment: 'demo', exportedAt: new Date().toISOString(), data });

export async function runStage8IntegrationTests() {
  const results: Result[] = [];
  const repository = new DemoDataRepository();
  const test = async (title: string, action: () => boolean | Promise<boolean>) => {
    try { const passed = await action(); results.push({ testNumber: results.length + 1, title, passed, message: passed ? 'موفق' : 'شرط آزمون برقرار نشد' }); }
    catch (error) { results.push({ testNumber: results.length + 1, title, passed: false, message: error instanceof Error ? error.message : String(error) }); }
  };

  await test('featureهای سنگین lazy و fallback فارسی باشند', () => {
    const app = readFileSync(resolve('src/app/App.tsx'), 'utf8');
    const projects = readFileSync(resolve('src/features/projects/ProjectsView.tsx'), 'utf8');
    const finance = readFileSync(resolve('src/features/documents/ProjectFinanceView.tsx'), 'utf8');
    return (app.match(/lazy\(\(\) => import/g) || []).length >= 6 && app.includes('در حال بارگذاری بخش انتخاب‌شده') &&
      projects.includes("import('./ProjectCostsView')") && (finance.match(/lazy\(\(\) => import/g) || []).length === 4;
  });
  await test('Unauthorized و NotFound مرکزی موجود باشند', () => {
    const source = readFileSync(resolve('src/components/ui/RouteStates.tsx'), 'utf8');
    return source.includes('UnauthorizedState') && source.includes('NotFoundState') && readFileSync(resolve('src/app/App.tsx'), 'utf8').includes('<UnauthorizedState');
  });
  await test('Modal دارای dialog، focus trap، Escape و بازگرداندن focus باشد', () => {
    const source = readFileSync(resolve('src/components/ui/Modal.tsx'), 'utf8');
    return ['role="dialog"', 'aria-modal="true"', "e.key === 'Tab'", "e.key === 'Escape'", 'previouslyFocused?.focus()'].every((part) => source.includes(part));
  });
  await test('ثبت تکراری در Button و مدیریت Demo مهار شود', () => {
    const button = readFileSync(resolve('src/components/ui/Button.tsx'), 'utf8');
    const panel = readFileSync(resolve('src/features/moderation/DemoDataAdminPanel.tsx'), 'utf8');
    return button.includes('disabled={disabled || isLoading}') && panel.includes('if (pending) return');
  });
  await test('Export فقط Demo و بدون داده حساس باشد', async () => {
    localStorage.setItem('surveying.demo_export.v1', JSON.stringify({ environment: 'demo', title: 'نمونه', phone: '09120000000', token: 'secret', nested: { certificate: 'x' } }));
    localStorage.setItem('surveying_real_forbidden_v1', JSON.stringify({ environment: 'real', title: 'واقعی' }));
    const text = JSON.stringify(await repository.exportData(admin));
    return text.includes('نمونه') && !/09120000000|secret|certificate|واقعی/.test(text);
  });
  await test('Import مربوط به Real و schema نامعتبر رد شود', async () =>
    await rejects(() => repository.importData(admin, JSON.stringify({ schemaVersion: 1, environment: 'real', data: {} }))) &&
    await rejects(() => repository.importData(admin, JSON.stringify({ schemaVersion: 2, environment: 'demo', data: {} }))));
  await test('Import بزرگ و prototype pollution رد شود', async () =>
    await rejects(() => repository.importData(admin, valid({ 'surveying.demo_large.v1': 'x'.repeat(1_000_001) }))) &&
    await rejects(() => repository.importData(admin, '{"schemaVersion":1,"environment":"demo","data":{"surveying.demo.v1":{"__proto__":{"polluted":true}}}}')));
  await test('Import اتمیک باشد و در خطا rollback کند', async () => {
    localStorage.setItem('surveying.atomic.one.v1', JSON.stringify({ old: 1 }));
    const original = localStorage.setItem.bind(localStorage);
    let failed = false;
    localStorage.setItem = ((key: string, value: string) => { if (!failed && key === 'surveying.atomic.two.v1') { failed = true; throw new Error('quota'); } original(key, value); }) as typeof localStorage.setItem;
    try { await repository.importData(admin, valid({ 'surveying.atomic.one.v1': { next: 1 }, 'surveying.atomic.two.v1': { next: 2 } })); }
    catch { /* expected */ } finally { localStorage.setItem = original; }
    return localStorage.getItem('surveying.atomic.one.v1') === JSON.stringify({ old: 1 }) && localStorage.getItem('surveying.atomic.two.v1') === null;
  });
  await test('Reset scoped باشد و کلید نامرتبط را حفظ کند', async () => {
    localStorage.setItem('surveying.reset.v1', '1'); localStorage.setItem('unrelated-key', 'keep');
    const scope = await repository.getResetScope(admin);
    const removed = await repository.reset(admin, scope.confirmationPhrase);
    return removed > 0 && localStorage.getItem('surveying.reset.v1') === null && localStorage.getItem('unrelated-key') === 'keep';
  });
  await test('Reset بدون تأیید دوم رد شود', () => rejects(() => repository.reset(admin, 'تأیید ناقص')));
  await test('Export/Import/Reset فقط برای admin و Demo باشد', async () =>
    await rejects(() => repository.exportData(surveyor)) && await rejects(() => repository.importData(realAdmin, valid())) && await rejects(() => repository.getResetScope(realAdmin)));
  await test('پرداخت و امضا همچنان غیرفعال بمانند', () => {
    const panel = readFileSync(resolve('src/features/documents/components/FutureCapabilitiesPanel.tsx'), 'utf8');
    const flags = readFileSync(resolve('src/config/futureFeatureFlags.ts'), 'utf8');
    return (panel.match(/قابلیت آینده — غیرفعال/g) || []).length === 2 && (panel.match(/disabled/g) || []).length >= 2 && (flags.match(/false/g) || []).length === 2;
  });
  return results;
}
