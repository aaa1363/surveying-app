/**
 * Demo Service Invoices Repository
 * Storage Key: surveying.invoices.v1.{userId}.{projectId}
 */

import { ServiceInvoice } from '../../models';
import { IInvoicesRepository } from '../interfaces/IInvoicesRepository';
import { storage } from '../../utils/storage';
import { getJalaliYear } from '../../utils/jalaliDate';
import { DemoDocumentCountersRepository } from './DemoDocumentCountersRepository';
import { DemoDocumentAuditRepository } from './DemoDocumentAuditRepository';

const countersRepo = new DemoDocumentCountersRepository();
const auditRepo = new DemoDocumentAuditRepository();

function getStorageKey(userId: string, projectId: string): string {
  return `surveying.invoices.v1.${userId}.${projectId}`;
}

export class DemoInvoicesRepository implements IInvoicesRepository {
  async getInvoices(userId: string, projectId: string): Promise<ServiceInvoice[]> {
    if (!userId || !projectId) return [];
    const key = getStorageKey(userId, projectId);
    return storage.get<ServiceInvoice[]>(key, []);
  }

  async getInvoiceById(userId: string, projectId: string, invoiceId: string): Promise<ServiceInvoice | null> {
    const list = await this.getInvoices(userId, projectId);
    return list.find((inv) => inv.id === invoiceId) || null;
  }

  async saveInvoice(invoice: ServiceInvoice, createRevision = true): Promise<ServiceInvoice> {
    if (!invoice.serviceDescription.trim()) throw new Error('شرح خدمات الزامی است.');
    if (!Number.isFinite(invoice.totalAmount) || invoice.totalAmount <= 0) throw new Error('مبلغ صورتحساب باید بزرگتر از صفر باشد.');
    if (!Number.isFinite(invoice.paidAmount) || invoice.paidAmount < 0 || invoice.paidAmount > invoice.totalAmount) {
      throw new Error('مبلغ پرداخت بیشتر از مانده قابل‌تسویه است');
    }
    const list = await this.getInvoices(invoice.userId, invoice.projectId);
    const index = list.findIndex((inv) => inv.id === invoice.id);
    const now = new Date().toISOString();

    const remaining = Math.max(0, invoice.totalAmount - (invoice.paidAmount || 0));
    let status = invoice.status;
    if (status !== 'cancelled' && status !== 'draft') {
      if (remaining === 0 && invoice.totalAmount > 0) {
        status = 'settled';
      } else if (invoice.paidAmount > 0 && remaining > 0) {
        status = 'partially_paid';
      }
    }

    const existing = index >= 0 ? list[index] : undefined;
    const isRevision = createRevision && Boolean(existing?.documentNumber && existing.status !== 'draft');
    const revisions = isRevision
      ? [...(existing?.revisions || []), { revision: existing?.version || 1, documentNumber: existing!.documentNumber!,
          savedAt: now, savedByUserId: invoice.userId, snapshot: structuredClone({ ...existing!, revisions: [] }) }]
      : (existing?.revisions || invoice.revisions || []);
    const clean: ServiceInvoice = {
      ...invoice,
      remainingBalance: remaining,
      status,
      currency: 'TOMAN',
      schemaVersion: 1,
      version: isRevision ? (existing?.version || 1) + 1 : (existing?.version || invoice.version || 1),
      revisions,
      updatedAt: now,
      createdAt: index >= 0 ? list[index].createdAt : invoice.createdAt || now,
    };

    if (index >= 0) {
      list[index] = clean;
    } else {
      list.push(clean);
    }

    const key = getStorageKey(invoice.userId, invoice.projectId);
    storage.set(key, list);
    return clean;
  }

  async issueInvoice(userId: string, projectId: string, invoiceId: string, issueDateJalali: string): Promise<ServiceInvoice> {
    const invoice = await this.getInvoiceById(userId, projectId, invoiceId);
    if (!invoice) {
      throw new Error('صورتحساب یافت نشد.');
    }

    const year = getJalaliYear(issueDateJalali);
    let docNumber = invoice.documentNumber;
    if (!docNumber) {
      docNumber = await countersRepo.getNextDocumentNumber(userId, 'invoice', year);
    }

    const prevStatus = invoice.status;
    const updated: ServiceInvoice = {
      ...invoice,
      documentNumber: docNumber,
      issueDateJalali,
      status: invoice.paidAmount > 0 ? (invoice.remainingBalance === 0 ? 'settled' : 'partially_paid') : 'issued',
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.saveInvoice(updated, false);
    await auditRepo.recordStatusChange({
      documentId: saved.id,
      documentType: 'invoice',
      fromStatus: prevStatus,
      toStatus: saved.status,
      actionDateJalali: issueDateJalali,
      changedByUserId: userId,
      reason: `صدور صورتحساب خدمات با شماره سند ${docNumber}`,
    });

    return saved;
  }

  async updatePaymentStatus(userId: string, projectId: string, invoiceId: string, paidAmount: number): Promise<ServiceInvoice> {
    const invoice = await this.getInvoiceById(userId, projectId, invoiceId);
    if (!invoice) {
      throw new Error('صورتحساب یافت نشد.');
    }
    if (!Number.isFinite(paidAmount) || paidAmount < 0 || paidAmount > invoice.totalAmount) {
      throw new Error('مبلغ پرداخت بیشتر از مانده قابل‌تسویه است');
    }

    const prevStatus = invoice.status;
    const remaining = Math.max(0, invoice.totalAmount - paidAmount);
    let newStatus = invoice.status;
    if (invoice.status !== 'cancelled') {
      if (remaining === 0 && invoice.totalAmount > 0) {
        newStatus = 'settled';
      } else if (paidAmount > 0) {
        newStatus = 'partially_paid';
      }
    }

    const updated: ServiceInvoice = {
      ...invoice,
      paidAmount,
      remainingBalance: remaining,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.saveInvoice(updated, false);
    if (prevStatus !== newStatus) {
      await auditRepo.recordStatusChange({
        documentId: saved.id,
        documentType: 'invoice',
        fromStatus: prevStatus,
        toStatus: newStatus,
        actionDateJalali: invoice.issueDateJalali,
        changedByUserId: userId,
        reason: `به‌روزرسانی وضعیت پرداخت صورتحساب (پرداخت‌شده: ${paidAmount} تومان)`,
      });
    }

    return saved;
  }

  async cancelInvoice(userId: string, projectId: string, invoiceId: string, reason: string, dateJalali: string): Promise<ServiceInvoice> {
    const invoice = await this.getInvoiceById(userId, projectId, invoiceId);
    if (!invoice) {
      throw new Error('صورتحساب یافت نشد.');
    }

    const prevStatus = invoice.status;
    const updated: ServiceInvoice = {
      ...invoice,
      status: 'cancelled',
      cancellationReason: reason,
      cancellationDateJalali: dateJalali,
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.saveInvoice(updated, false);
    await auditRepo.recordStatusChange({
      documentId: saved.id,
      documentType: 'invoice',
      fromStatus: prevStatus,
      toStatus: 'cancelled',
      actionDateJalali: dateJalali,
      changedByUserId: userId,
      reason: `لغو صورتحساب: ${reason}`,
    });

    return saved;
  }
}
