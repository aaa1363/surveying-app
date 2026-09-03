/**
 * Demo Document Audit Repository
 * Storage Key: surveying.documentAudit.v1
 */

import { DocumentStatusHistory, DocumentType } from '../../models';
import { IDocumentAuditRepository } from '../interfaces/IDocumentAuditRepository';
import { storage } from '../../utils/storage';

const STORAGE_KEY = 'surveying.documentAudit.v1';

export class DemoDocumentAuditRepository implements IDocumentAuditRepository {
  private getLogs(): DocumentStatusHistory[] {
    return storage.get<DocumentStatusHistory[]>(STORAGE_KEY, []);
  }

  private saveLogs(logs: DocumentStatusHistory[]): void {
    storage.set(STORAGE_KEY, logs);
  }

  async recordStatusChange(params: {
    documentId: string;
    documentType: DocumentType;
    fromStatus: string;
    toStatus: string;
    actionDateJalali: string;
    changedByUserId: string;
    reason?: string;
  }): Promise<DocumentStatusHistory> {
    const logs = this.getLogs();
    const entry: DocumentStatusHistory = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      documentId: params.documentId,
      documentType: params.documentType,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      actionDateJalali: params.actionDateJalali,
      changedByUserId: params.changedByUserId,
      reason: params.reason,
      timestamp: new Date().toISOString(),
    };

    logs.unshift(entry);
    this.saveLogs(logs);
    return entry;
  }

  async getAuditLog(documentId: string): Promise<DocumentStatusHistory[]> {
    const logs = this.getLogs();
    return logs.filter((l) => l.documentId === documentId);
  }

  async getAllLogs(): Promise<DocumentStatusHistory[]> {
    return this.getLogs();
  }
}
