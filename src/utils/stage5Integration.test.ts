import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { DemoDocumentCountersRepository } from '../repositories/demo/DemoDocumentCountersRepository';
import { DemoDocumentAuditRepository } from '../repositories/demo/DemoDocumentAuditRepository';
import { DemoProformaRepository } from '../repositories/demo/DemoProformaRepository';
import { DemoInvoicesRepository } from '../repositories/demo/DemoInvoicesRepository';
import { DemoStatementsRepository } from '../repositories/demo/DemoStatementsRepository';
import { DemoPaymentsRepository } from '../repositories/demo/DemoPaymentsRepository';
import { PaymentMilestone, PaymentRecord, PaymentSchedule, ProgressStatement, ProformaInvoice, ServiceInvoice } from '../models';
import { canManageProjectDocuments } from '../features/documents/documentAccess';

type Result = { testNumber: number; title: string; passed: boolean; message: string };
const memory = new Map<string, string>();
const localStorageMock = { getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, String(v)), removeItem: (k: string) => void memory.delete(k),
  clear: () => memory.clear(), key: (i: number) => [...memory.keys()][i] ?? null, get length() { return memory.size; } };
if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, configurable: true });
}

const now = '2026-08-30T00:00:00.000Z';
const party = { surveyor: { fullName: 'نقشه‌بردار', phone: '09120000000' },
  client: { id: 'cl', type: 'individual', fullName: 'کارفرما', phone: '09121111111' } } as ProformaInvoice['partySnapshot'];
const proforma = (overrides: Partial<ProformaInvoice> = {}): ProformaInvoice => ({ id: 'pf', userId: 'u', projectId: 'p',
  projectTitle: 'پروژه', partySnapshot: party, serviceDescription: 'خدمات نقشه‌برداری', issueDateJalali: '1405/07/01',
  validityDateJalali: '1405/08/01', totalProposedAmount: 45_400_000, paymentTerms: 'نقدی', estimatedDuration: '۱۰ روز',
  status: 'draft', version: 1, currency: 'TOMAN', schemaVersion: 1, createdAt: now, updatedAt: now, ...overrides });
const invoice = (id: string, amount = 1000): ServiceInvoice => ({ id, userId: 'u', projectId: 'p', documentNumber: `IN-1405-${id}`,
  projectTitle: 'پروژه', partySnapshot: party, serviceDescription: 'خدمات', totalAmount: amount, paidAmount: 0,
  remainingBalance: amount, issueDateJalali: '1405/07/01', dueDateJalali: '1405/08/01', status: 'issued', version: 1,
  currency: 'TOMAN', schemaVersion: 1, createdAt: now, updatedAt: now });
const schedule = (milestones: PaymentMilestone[] = [], total = 2000): PaymentSchedule => ({ id: 'sch', userId: 'u', projectId: 'p',
  totalContractAmount: total, milestones, totalPaidAmount: 0, remainingBalance: total, currency: 'TOMAN', schemaVersion: 1,
  createdAt: now, updatedAt: now });
const payment = (id: string, invoiceId: string, amount: number): PaymentRecord => ({ id, userId: 'u', projectId: 'p', invoiceId,
  amount, paymentDateJalali: '1405/07/01', paymentMethod: 'cash', currency: 'TOMAN', schemaVersion: 1, createdAt: now, updatedAt: now });
const statement = (overrides: Partial<ProgressStatement> = {}): ProgressStatement => ({ id: 'st', userId: 'u', projectId: 'p',
  contractId: 'ct', stageTitle: 'مرحله اول', statementDateJalali: '1405/07/01', progressPercentage: 50,
  totalClaimableAmount: 1000, previousClaimedAmount: 0, currentStageAmount: 500, remainingBalance: 500,
  status: 'draft', version: 1, currency: 'TOMAN', schemaVersion: 1, createdAt: now, updatedAt: now, ...overrides });

async function rejects(fn: () => Promise<unknown>, phrase?: string) {
  try { await fn(); return false; } catch (error) { return !phrase || (error instanceof Error && error.message.includes(phrase)); }
}

function sourceText(root: string): string {
  const walk = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
    const path = join(dir, name); return statSync(path).isDirectory() ? walk(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
  return walk(root).map((path) => readFileSync(path, 'utf8')).join('\n');
}

export async function runStage5IntegrationTests() {
  const out: Result[] = [];
  const test = async (n: number, title: string, fn: () => boolean | Promise<boolean>) => {
    try { const ok = await fn(); out.push({ testNumber: n, title, passed: ok, message: ok ? 'موفق' : 'شرط آزمون برقرار نشد' }); }
    catch (error) { out.push({ testNumber: n, title, passed: false, message: error instanceof Error ? error.message : String(error) }); }
  };

  await test(1, 'فرم خالی شماره مصرف نکند', async () => { localStorage.clear(); const r = new DemoDocumentCountersRepository();
    const before = await r.peekCurrentNumber('u', 'proforma', 1405); const after = await r.peekCurrentNumber('u', 'proforma', 1405); return before === 0 && after === 0; });
  await test(2, 'چهار نوع سند شماره مستقل داشته باشند', async () => { localStorage.clear(); const r = new DemoDocumentCountersRepository();
    const values = await Promise.all(['proforma', 'contract', 'statement', 'invoice'].map((t) => r.getNextDocumentNumber('u', t as never, 1405)));
    return values.join('|') === 'PF-1405-0001|CT-1405-0001|ST-1405-0001|IN-1405-0001'; });
  await test(3, 'سال شمسی در شماره درست باشد', async () => (await new DemoDocumentCountersRepository().getNextDocumentNumber('x', 'invoice', 1404)).startsWith('IN-1404-'));
  await test(4, 'مبلغ قیمت‌گذاری به پیش‌فاکتور منتقل شود', async () => { localStorage.clear(); const saved = await new DemoProformaRepository().saveProforma(proforma()); return saved.totalProposedAmount === 45_400_000; });
  await test(5, 'مبلغ دستی معتبر پذیرفته شود', async () => { localStorage.clear(); return (await new DemoProformaRepository().saveProforma(proforma({ totalProposedAmount: 12_345_000 }))).totalProposedAmount === 12_345_000; });
  await test(6, 'مجموع درصد بیشتر از ۱۰۰ رد شود', async () => { localStorage.clear(); const repo = new DemoPaymentsRepository(); await repo.saveSchedule(schedule([], 1000));
    const a = { id: 'a', userId: 'u', projectId: 'p', title: 'الف', type: 'percentage', percentage: 60, amount: 600, status: 'unpaid', paidAmount: 0 } as PaymentMilestone;
    await repo.saveMilestone(a); return rejects(() => repo.saveMilestone({ ...a, id: 'b', title: 'ب', percentage: 50, amount: 500 }), '۱۰۰'); });
  await test(7, 'مجموع مبلغ بیشتر از قرارداد رد شود', async () => { localStorage.clear(); const repo = new DemoPaymentsRepository(); await repo.saveSchedule(schedule([], 1000));
    const a = { id: 'a', userId: 'u', projectId: 'p', title: 'الف', type: 'fixed_amount', amount: 800, status: 'unpaid', paidAmount: 0 } as PaymentMilestone;
    await repo.saveMilestone(a); return rejects(() => repo.saveMilestone({ ...a, id: 'b', title: 'ب', amount: 300 }), 'قرارداد'); });
  await test(8, 'مبلغ صفر و منفی رد شود', async () => { localStorage.clear(); const repo = new DemoProformaRepository();
    return await rejects(() => repo.saveProforma(proforma({ totalProposedAmount: 0 }))) && await rejects(() => repo.saveProforma(proforma({ totalProposedAmount: -1 }))); });
  await test(9, 'پرداخت بیشتر از مانده رد شود', async () => { localStorage.clear(); const inv = new DemoInvoicesRepository(); await inv.saveInvoice(invoice('1', 1000));
    const repo = new DemoPaymentsRepository(); await repo.saveSchedule(schedule([], 1000)); return rejects(() => repo.recordPayment(payment('p1', '1', 1001)), 'مانده'); });
  await test(10, 'پرداخت یک صورتحساب روی دیگری اثر نگذارد', async () => { localStorage.clear(); const inv = new DemoInvoicesRepository(); await inv.saveInvoice(invoice('1')); await inv.saveInvoice(invoice('2'));
    const repo = new DemoPaymentsRepository(); await repo.saveSchedule(schedule([], 2000)); await repo.recordPayment(payment('p1', '1', 400));
    return (await inv.getInvoiceById('u', 'p', '1'))?.paidAmount === 400 && (await inv.getInvoiceById('u', 'p', '2'))?.paidAmount === 0; });
  await test(11, 'پرداخت ناقص وضعیت جزئی ایجاد کند', async () => { localStorage.clear(); const inv = new DemoInvoicesRepository(); await inv.saveInvoice(invoice('1'));
    const repo = new DemoPaymentsRepository(); await repo.saveSchedule(schedule([], 1000)); await repo.recordPayment(payment('p1', '1', 400)); return (await inv.getInvoiceById('u', 'p', '1'))?.status === 'partially_paid'; });
  await test(12, 'پرداخت کامل وضعیت تسویه ایجاد کند', async () => { localStorage.clear(); const inv = new DemoInvoicesRepository(); await inv.saveInvoice(invoice('1'));
    const repo = new DemoPaymentsRepository(); await repo.saveSchedule(schedule([], 1000)); await repo.recordPayment(payment('p1', '1', 1000)); return (await inv.getInvoiceById('u', 'p', '1'))?.status === 'settled'; });
  await test(13, 'صورت‌وضعیت بیشتر از سقف رد شود', async () => { localStorage.clear(); const repo = new DemoStatementsRepository(); await repo.saveStatement(statement());
    return rejects(() => repo.saveStatement(statement({ id: 'st2', currentStageAmount: 600 })), 'مانده'); });
  await test(14, 'درصد پیشرفت خارج از بازه رد شود', async () => { localStorage.clear(); return rejects(() => new DemoStatementsRepository().saveStatement(statement({ progressPercentage: 101 })), 'درصد'); });
  await test(15, 'ویرایش سند صادرشده نسخه جدید ایجاد کند', async () => { localStorage.clear(); const repo = new DemoProformaRepository(); await repo.saveProforma(proforma()); const issued = await repo.issueProforma('u', 'p', '1405/07/01');
    const edited = await repo.saveProforma({ ...issued, serviceDescription: 'شرح جدید' }); return edited.version === 2 && edited.documentNumber === issued.documentNumber && edited.revisions?.length === 1; });
  await test(16, 'نسخه قبلی بدون تغییر بماند', async () => { const item = await new DemoProformaRepository().getProforma('u', 'p'); return item?.revisions?.[0].snapshot.serviceDescription === 'خدمات نقشه‌برداری'; });
  await test(17, 'سند صادرشده حذف فیزیکی نشود', async () => { const repo = new DemoProformaRepository(); const cancelled = await repo.cancelProforma('u', 'p', 'لغو آزمون', '1405/07/02'); return cancelled.status === 'cancelled' && Boolean(await repo.getProforma('u', 'p')); });
  await test(18, 'لغو سند Audit ایجاد کند', async () => (await new DemoDocumentAuditRepository().getAuditLog('pf')).some((log) => log.toStatus === 'cancelled' && log.reason?.includes('لغو')));
  await test(19, 'کارفرما و مدیر بدون مالکیت به اسناد دسترسی نداشته باشند', () => !canManageProjectDocuments('client', 'c', 'u') && !canManageProjectDocuments('admin', 'a', 'u') && canManageProjectDocuments('surveyor', 'u', 'u'));
  await test(20, 'اطلاعات هزینه داخلی در چاپ افشا نشود', () => { const text = readFileSync(resolve('src/features/documents/components/DocumentPrintModal.tsx'), 'utf8'); return !['actualCost', 'profitPercent', 'depreciationAmount', 'personalRates'].some((key) => text.includes(key)); });
  await test(21, 'عبارت‌های ادعای رسمی وجود نداشته باشند', () => { const text = sourceText(resolve('src/features/documents')); return !text.includes('صدور رسمی') && !text.includes('شماره رسمی') && !text.includes('فاکتور رسمی') && !text.includes('صورتحساب رسمی مالیاتی'); });
  await test(22, 'امضای دیجیتال و درگاه فعال نباشند', () => { const text = readFileSync(resolve('src/models/DocumentModels.ts'), 'utf8'); return (text.match(/readonly isEnabled: false/g) || []).length === 2 && !sourceText(resolve('src/features/documents')).includes('createPaymentUrl'); });
  await test(23, 'هیچ اتصال مالیاتی وجود نداشته باشد', () => { const text = sourceText(resolve('src/features/documents')) + sourceText(resolve('src/repositories')) + readFileSync(resolve('src/models/DocumentModels.ts'), 'utf8'); return !text.includes('TaxGateway') && !text.includes('سامانه مؤدیان'); });
  await test(24, 'آزمون بازگشتی مراحل دوم تا چهارم در runner حفظ شده باشد', () => readFileSync(resolve('src/utils/runStage5Tests.ts'), 'utf8').includes('runStage4IntegrationTests'));
  await test(25, 'Legacy، Dart و src/src وجود نداشته باشند', () => !['Legacy', 'lib', 'src/src'].some((path) => existsSync(resolve(path))));
  return { total: out.length, passed: out.filter((item) => item.passed).length, failed: out.filter((item) => !item.passed).length, results: out };
}
