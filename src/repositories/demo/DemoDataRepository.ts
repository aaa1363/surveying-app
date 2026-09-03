import { DemoDataExport, DemoResetScope } from '../../models/DemoDataTransfer';
import { RepositoryActor } from '../../models/Stage6Models';
import { IDemoDataRepository } from '../interfaces/IDemoDataRepository';
import {DEMO_BUSINESS_SEED_DISABLED_KEY, disableDemoBusinessSeed} from '../../utils/demoSeedPolicy';

const MAX_IMPORT_BYTES = 1_000_000;
const RESET_PHRASE = 'حذف داده‌های نمایشی';
const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const SENSITIVE_KEY = /phone|mobile|national.?id|address|iban|sheba|card|cvv|password|token|certificate|private.?key|شماره.?تلفن|کد.?ملی|نشانی|شبا/i;

function isOwnedDemoKey(key: string): boolean {
  if (key.startsWith('surveying_real_')) return false;
  return key.startsWith('geo_demo_') || key.startsWith('surveying_demo_') || key.startsWith('surveying.');
}

function sanitize(value: unknown): unknown {
  if (typeof value === 'string' && /(?:\+98|0)?9\d{9}|IR\d{24}|\b\d{16}\b/i.test(value.replace(/[\s-]/g, ''))) return undefined;
  if (Array.isArray(value)) return value.map(sanitize).filter((item) => item !== undefined);
  if (!value || typeof value !== 'object') return value;
  const source = value as Record<string, unknown>;
  if (source.environment === 'real' || source.isDemo === false) return undefined;
  const output: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const [key, nested] of Object.entries(source)) {
    if (BLOCKED_KEYS.has(key) || SENSITIVE_KEY.test(key)) continue;
    const clean = sanitize(nested);
    if (clean !== undefined) output[key] = clean;
  }
  return output;
}

function assertActor(actor: RepositoryActor): void {
  if (actor.role !== 'admin') throw new Error('این عملیات فقط برای مدیر مجاز است.');
  if (actor.environment !== 'demo') throw new Error('انتقال داده فقط در محیط Demo مجاز است.');
}

function ownedKeys(): string[] {
  return Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
    .filter((key): key is string => Boolean(key && isOwnedDemoKey(key)));
}

const BUSINESS_KEY = /(projects?|clients?|cost|proforma|contract|statement|invoice|payment|selection|inquir|validation|review|portfolio|document.*audit|document.*counter|reset)/i;
function businessKeys():string[]{return ownedKeys().filter(key=>BUSINESS_KEY.test(key)&&key!==DEMO_BUSINESS_SEED_DISABLED_KEY);}

function parseSecureJson(source: string): DemoDataExport {
  if (new TextEncoder().encode(source).byteLength > MAX_IMPORT_BYTES) throw new Error('حجم فایل بیشتر از حد مجاز است.');
  const parsed = JSON.parse(source, (key, value: unknown) => {
    if (BLOCKED_KEYS.has(key)) throw new Error('ساختار فایل ناامن است.');
    return value;
  }) as DemoDataExport;
  if (!parsed || parsed.schemaVersion !== 1 || parsed.environment !== 'demo' || !parsed.data || Array.isArray(parsed.data) || typeof parsed.data !== 'object') {
    throw new Error('ساختار یا نسخه فایل معتبر نیست.');
  }
  for (const [key, value] of Object.entries(parsed.data)) {
    if (!isOwnedDemoKey(key) || key.includes('_real_')) throw new Error('کلید ناشناخته یا محیط ناسازگار است.');
    if (sanitize(value) === undefined || JSON.stringify(sanitize(value)) !== JSON.stringify(value)) throw new Error('فایل شامل داده حساس یا ناسازگار است.');
  }
  return parsed;
}

export class DemoDataRepository implements IDemoDataRepository {
  async exportData(actor: RepositoryActor): Promise<DemoDataExport> {
    assertActor(actor);
    const data: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const key of ownedKeys()) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try { data[key] = sanitize(JSON.parse(raw)); } catch { /* داده خراب صادر نمی‌شود */ }
    }
    return { schemaVersion: 1, environment: 'demo', exportedAt: new Date().toISOString(), data };
  }

  async importData(actor: RepositoryActor, source: string): Promise<number> {
    assertActor(actor);
    const parsed = parseSecureJson(source);
    const entries = Object.entries(parsed.data);
    const previous = new Map(entries.map(([key]) => [key, localStorage.getItem(key)]));
    try {
      for (const [key, value] of entries) localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      for (const [key, value] of previous) value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value);
      throw error;
    }
    return entries.length;
  }

  async getResetScope(actor: RepositoryActor): Promise<DemoResetScope> {
    assertActor(actor);
    return { keys: businessKeys(), confirmationPhrase: RESET_PHRASE };
  }

  async reset(actor: RepositoryActor, confirmationPhrase: string): Promise<number> {
    assertActor(actor);
    if (confirmationPhrase !== RESET_PHRASE) throw new Error('تأیید مرحله دوم صحیح نیست.');
    const keys = businessKeys();
    keys.forEach((key) => localStorage.removeItem(key));
    disableDemoBusinessSeed();
    return keys.length;
  }
}
