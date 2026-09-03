/**
 * Demo Document Counters Repository
 * Storage Key: surveying.documentCounters.v1
 */

import { DocumentType, DocumentCounter } from '../../models';
import { IDocumentCountersRepository } from '../interfaces/IDocumentCountersRepository';
import { storage } from '../../utils/storage';

const STORAGE_KEY = 'surveying.documentCounters.v1';

const PREFIX_MAP: Record<DocumentType, string> = {
  proforma: 'PF',
  contract: 'CT',
  statement: 'ST',
  invoice: 'IN',
};

export class DemoDocumentCountersRepository implements IDocumentCountersRepository {
  private getCounters(): DocumentCounter[] {
    return storage.get<DocumentCounter[]>(STORAGE_KEY, []);
  }

  private saveCounters(counters: DocumentCounter[]): void {
    storage.set(STORAGE_KEY, counters);
  }

  async getNextDocumentNumber(userId: string, type: DocumentType, jalaliYear: number): Promise<string> {
    const counters = this.getCounters();
    const existingIndex = counters.findIndex(
      (c) => c.userId === userId && c.type === type && c.jalaliYear === jalaliYear
    );

    let nextNum = 1;
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      nextNum = counters[existingIndex].lastNumber + 1;
      counters[existingIndex].lastNumber = nextNum;
      counters[existingIndex].updatedAt = now;
    } else {
      counters.push({
        id: `cnt-${userId}-${type}-${jalaliYear}`,
        userId,
        type,
        jalaliYear,
        lastNumber: 1,
        updatedAt: now,
      });
      nextNum = 1;
    }

    this.saveCounters(counters);

    const prefix = PREFIX_MAP[type] || 'DOC';
    const padded = String(nextNum).padStart(4, '0');
    return `${prefix}-${jalaliYear}-${padded}`;
  }

  async peekCurrentNumber(userId: string, type: DocumentType, jalaliYear: number): Promise<number> {
    const counters = this.getCounters();
    const existing = counters.find(
      (c) => c.userId === userId && c.type === type && c.jalaliYear === jalaliYear
    );
    return existing ? existing.lastNumber : 0;
  }
}
