/**
 * Demo Tariff Audit Repository
 * Storage Key: surveying.tariffAudit.v1
 */

import { TariffAuditLog } from '../../models';
import { ITariffAuditRepository } from '../interfaces/ITariffAuditRepository';
import { storage } from '../../utils/storage';

const STORAGE_KEY = 'surveying.tariffAudit.v1';

export class DemoTariffAuditRepository implements ITariffAuditRepository {
  async getLogs(limit = 100): Promise<TariffAuditLog[]> {
    const logs = storage.get<TariffAuditLog[]>(STORAGE_KEY, []);
    return logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async logChange(entry: Omit<TariffAuditLog, 'id' | 'timestamp'>): Promise<TariffAuditLog> {
    const logs = storage.get<TariffAuditLog[]>(STORAGE_KEY, []);
    const newLog: TariffAuditLog = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    storage.set(STORAGE_KEY, logs.slice(0, 300)); // Cap at 300 entries
    return newLog;
  }

  async clearLogs(): Promise<void> {
    storage.set(STORAGE_KEY, []);
  }
}

