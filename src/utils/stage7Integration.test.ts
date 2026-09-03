import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FUTURE_FEATURE_FLAGS } from '../config/futureFeatureFlags';
import { DemoFuturePaymentRepository } from '../repositories/demo/DemoFuturePaymentRepository';
import { DemoFutureDigitalSignatureRepository } from '../repositories/demo/DemoFutureDigitalSignatureRepository';
import { RepositoryActor } from '../models/Stage6Models';

type Result = { testNumber: number; title: string; passed: boolean; message: string };
const memory = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, String(value)),
  removeItem: (key: string) => void memory.delete(key),
  clear: () => memory.clear(),
  key: (index: number) => [...memory.keys()][index] ?? null,
  get length() { return memory.size; },
};
if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, configurable: true });
}

const demoActors: RepositoryActor[] = [
  { userId: 'surveyor-stage7', role: 'surveyor', environment: 'demo' },
  { userId: 'client-stage7', role: 'client', environment: 'demo' },
  { userId: 'admin-stage7', role: 'admin', environment: 'demo' },
];
const realActor: RepositoryActor = { userId: 'real-stage7', role: 'admin', environment: 'real' };
const rejects = async (action: () => Promise<unknown>) => {
  try { await action(); return false; } catch { return true; }
};

export async function runStage7IntegrationTests() {
  localStorage.clear();
  const results: Result[] = [];
  const test = async (title: string, action: () => boolean | Promise<boolean>) => {
    try {
      const passed = await action();
      results.push({ testNumber: results.length + 1, title, passed, message: passed ? 'موفق' : 'شرط آزمون برقرار نشد' });
    } catch (error) {
      results.push({ testNumber: results.length + 1, title, passed: false, message: error instanceof Error ? error.message : String(error) });
    }
  };

  const payment = new DemoFuturePaymentRepository('demo');
  const signature = new DemoFutureDigitalSignatureRepository('demo');

  await test('feature flagها به‌صورت پیش‌فرض false باشند', () =>
    FUTURE_FEATURE_FLAGS.paymentGateway === false && FUTURE_FEATURE_FLAGS.digitalSignature === false);
  await test('وضعیت هر دو قابلیت unavailable باشد', async () =>
    (await payment.getState(demoActors[0])).status === 'unavailable' &&
    (await signature.getState(demoActors[0])).status === 'unavailable');
  await test('ایجاد پرداخت برای هر سه نقش رد شود', async () =>
    (await Promise.all(demoActors.map((actor) => rejects(() => payment.requestPayment(actor))))).every(Boolean));
  await test('درخواست امضا برای هر سه نقش رد شود', async () =>
    (await Promise.all(demoActors.map((actor) => rejects(() => signature.requestSignature(actor))))).every(Boolean));
  await test('فراخوانی مستقیم با محیط نامعتبر رد شود', async () =>
    await rejects(() => payment.getState(realActor)) && await rejects(() => signature.getState(realActor)));
  await test('Demo و Real از یکدیگر جدا بمانند', async () => {
    const realPayment = new DemoFuturePaymentRepository('real');
    const realSignature = new DemoFutureDigitalSignatureRepository('real');
    return (await realPayment.getState(realActor)).environment === 'real' &&
      (await realSignature.getState(realActor)).environment === 'real' &&
      await rejects(() => realPayment.getState(demoActors[0]));
  });
  await test('هیچ اطلاعات حساسی در localStorage ذخیره نشود', async () => {
    const before = JSON.stringify([...memory.entries()]);
    await rejects(() => payment.requestPayment(demoActors[1]));
    await rejects(() => signature.requestSignature(demoActors[1]));
    return JSON.stringify([...memory.entries()]) === before;
  });
  await test('هیچ درخواست شبکه‌ای ایجاد نشود', async () => {
    let calls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => { calls += 1; throw new Error('network forbidden'); }) as typeof fetch;
    try {
      await rejects(() => payment.requestPayment(demoActors[0]));
      await rejects(() => signature.requestSignature(demoActors[0]));
      return calls === 0;
    } finally { globalThis.fetch = originalFetch; }
  });
  await test('UI دکمه‌های غیرفعال و هشدارهای لازم را داشته باشد', () => {
    const source = readFileSync(resolve('src/features/documents/components/FutureCapabilitiesPanel.tsx'), 'utf8');
    return (source.match(/disabled/g) || []).length >= 2 && source.includes('قابلیت آینده — غیرفعال') &&
      source.includes('امضای دیجیتال نمایشی است و اعتبار حقوقی ندارد');
  });
  await test('کارفرما با URL مستقیم به اسناد داخلی دسترسی نداشته باشد', () => {
    const source = readFileSync(resolve('src/app/App.tsx'), 'utf8');
    return source.includes("currentUser.role === 'client'") && source.includes('<ClientPanelView') &&
      !readFileSync(resolve('src/app/routes.tsx'), 'utf8').includes('payment-gateway');
  });

  return results;
}

