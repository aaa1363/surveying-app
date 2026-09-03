/**
 * Demo Proforma Repository
 * Storage Key: surveying.proformas.v1.{userId}.{projectId}
 */

import { ProformaInvoice, ManualApproval } from '../../models';
import { IProformaRepository } from '../interfaces/IProformaRepository';
import { storage } from '../../utils/storage';
import { getJalaliYear } from '../../utils/jalaliDate';
import { DemoDocumentCountersRepository } from './DemoDocumentCountersRepository';
import { DemoDocumentAuditRepository } from './DemoDocumentAuditRepository';

const countersRepo = new DemoDocumentCountersRepository();
const auditRepo = new DemoDocumentAuditRepository();

function getStorageKey(userId: string, projectId: string): string {
  return `surveying.proformas.v1.${userId}.${projectId}`;
}

export class DemoProformaRepository implements IProformaRepository {
  async getProforma(userId: string, projectId: string): Promise<ProformaInvoice | null> {
    if (!userId || !projectId) return null;
    const key = getStorageKey(userId, projectId);
    return storage.get<ProformaInvoice | null>(key, null);
  }

  async saveProforma(proforma: ProformaInvoice): Promise<ProformaInvoice> {
    if (!proforma.serviceDescription.trim()) throw new Error('شرح خدمات الزامی است.');
    if (!Number.isFinite(proforma.totalProposedAmount) || proforma.totalProposedAmount <= 0) {
      throw new Error('مبلغ پیش‌فاکتور باید بزرگتر از صفر باشد.');
    }
    const key = getStorageKey(proforma.userId, proforma.projectId);
    const existing = await this.getProforma(proforma.userId, proforma.projectId);
    const now = new Date().toISOString();

    const isRevision = Boolean(existing?.documentNumber && existing.status !== 'draft');
    const revisions = isRevision
      ? [...(existing?.revisions || []), { revision: existing?.version || 1, documentNumber: existing!.documentNumber!,
          savedAt: now, savedByUserId: proforma.userId, snapshot: structuredClone({ ...existing!, revisions: [] }) }]
      : (existing?.revisions || proforma.revisions || []);
    const clean: ProformaInvoice = {
      ...proforma,
      version: isRevision ? (existing?.version || 1) + 1 : (existing?.version || proforma.version || 1),
      revisions,
      currency: 'TOMAN',
      schemaVersion: 1,
      updatedAt: now,
      createdAt: existing?.createdAt || proforma.createdAt || now,
    };

    storage.set(key, clean);
    return clean;
  }

  async issueProforma(userId: string, projectId: string, issueDateJalali: string): Promise<ProformaInvoice> {
    const existing = await this.getProforma(userId, projectId);
    if (!existing) {
      throw new Error('پیش‌فاکتور یافت نشد.');
    }

    const year = getJalaliYear(issueDateJalali);
    let docNumber = existing.documentNumber;
    if (!docNumber) {
      docNumber = await countersRepo.getNextDocumentNumber(userId, 'proforma', year);
    }

    const prevStatus = existing.status;
    const updated: ProformaInvoice = {
      ...existing,
      documentNumber: docNumber,
      issueDateJalali,
      status: 'issued',
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.saveProforma(updated);
    await auditRepo.recordStatusChange({
      documentId: saved.id,
      documentType: 'proforma',
      fromStatus: prevStatus,
      toStatus: 'issued',
      actionDateJalali: issueDateJalali,
      changedByUserId: userId,
      reason: 'صدور پیش‌فاکتور با شماره سند',
    });

    return saved;
  }

  async recordManualApproval(userId: string, projectId: string, approval: ManualApproval): Promise<ProformaInvoice> {
    const existing = await this.getProforma(userId, projectId);
    if (!existing) {
      throw new Error('پیش‌فاکتور یافت نشد.');
    }

    const prevStatus = existing.status;
    const updated: ProformaInvoice = {
      ...existing,
      manualApproval: approval,
      status: 'phone_approved',
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.saveProforma(updated);
    await auditRepo.recordStatusChange({
      documentId: saved.id,
      documentType: 'proforma',
      fromStatus: prevStatus,
      toStatus: 'phone_approved',
      actionDateJalali: approval.approvalDateJalali,
      changedByUserId: userId,
      reason: `ثبت تأیید کارفرما (${approval.approvalType === 'phone' ? 'تلفنی' : approval.approvalType === 'in_person' ? 'حضوری' : 'سند کاغذی'}): ${approval.approverName}`,
    });

    return saved;
  }

  async cancelProforma(userId: string, projectId: string, reason: string, dateJalali: string): Promise<ProformaInvoice> {
    const existing = await this.getProforma(userId, projectId);
    if (!existing) {
      throw new Error('پیش‌فاکتور یافت نشد.');
    }

    const prevStatus = existing.status;
    const updated: ProformaInvoice = {
      ...existing,
      status: 'cancelled',
      cancellationReason: reason,
      cancellationDateJalali: dateJalali,
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.saveProforma(updated);
    await auditRepo.recordStatusChange({
      documentId: saved.id,
      documentType: 'proforma',
      fromStatus: prevStatus,
      toStatus: 'cancelled',
      actionDateJalali: dateJalali,
      changedByUserId: userId,
      reason: `لغو پیش‌فاکتور: ${reason}`,
    });

    return saved;
  }

  async updateStatus(
    userId: string,
    projectId: string,
    newStatus: ProformaInvoice['status'],
    reason?: string,
    dateJalali?: string
  ): Promise<ProformaInvoice> {
    const existing = await this.getProforma(userId, projectId);
    if (!existing) {
      throw new Error('پیش‌فاکتور یافت نشد.');
    }

    const prevStatus = existing.status;
    const updated: ProformaInvoice = {
      ...existing,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.saveProforma(updated);
    await auditRepo.recordStatusChange({
      documentId: saved.id,
      documentType: 'proforma',
      fromStatus: prevStatus,
      toStatus: newStatus,
      actionDateJalali: dateJalali || existing.issueDateJalali,
      changedByUserId: userId,
      reason: reason || `تغییر وضعیت به ${newStatus}`,
    });

    return saved;
  }
}
