import { TariffAuditLog } from '../../models';

export interface ITariffAuditRepository {
  getLogs(limit?: number): Promise<TariffAuditLog[]>;
  logChange(entry: Omit<TariffAuditLog, 'id' | 'timestamp'>): Promise<TariffAuditLog>;
  clearLogs(): Promise<void>;
}

