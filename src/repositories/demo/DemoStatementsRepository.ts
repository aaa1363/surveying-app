/**
 * Demo Progress Statements Repository
 * Storage Key: surveying.statements.v1.{userId}.{projectId}
 */

import { ProgressStatement, ManualApproval } from '../../models';
import { IStatementsRepository } from '../interfaces/IStatementsRepository';
import { storage } from '../../utils/storage';
import { getJalaliYear } from '../../utils/jalaliDate';
import { DemoDocumentCountersRepository } from './DemoDocumentCountersRepository';
import { DemoDocumentAuditRepository } from './DemoDocumentAuditRepository';
import { validateStatement } from '../../features/documents/documentRules';

const countersRepo = new DemoDocumentCountersRepository();
const auditRepo = new DemoDocumentAuditRepository();

function getStorageKey(userId: string, projectId: string): string {
  return `surveying.statements.v1.${userId}.${projectId}`;
}

export class DemoStatementsRepository implements IStatementsRepository {
  async getStatements(userId: string, projectId: string): Promise<ProgressStatement[]> {
    if (!userId || !projectId) return [];
    const key = getStorageKey(userId, projectId);
    return storage.get<ProgressStatement[]>(key, []);
  }

  async getStatementById(userId: string, projectId: string, statementId: string): Promise<ProgressStatement | null> {
    const list = await this.getStatements(userId, projectId);
    return list.find((s) => s.id === statementId) || null;
  }

  async saveStatement(statement: ProgressStatement): Promise<ProgressStatement> {
    const list = await this.getStatements(statement.userId, statement.projectId);
    validateStatement(statement, list);
    const index = list.findIndex((s) => s.id === statement.id);
    const now = new Date().toISOString();

    const previousClaimedAmount = list
      .filter((item) => item.id !== statement.id && item.status !== 'cancelled' && item.contractId === statement.contractId)
      .reduce((sum, item) => sum + item.currentStageAmount, 0);
    const existing = index >= 0 ? list[index] : undefined;
    const isRevision = Boolean(existing?.documentNumber && existing.status !== 'draft');
    const revisions = isRevision
      ? [...(existing?.revisions || []), { revision: existing?.version || 1, documentNumber: existing!.documentNumber!,
          savedAt: now, savedByUserId: statement.userId, snapshot: structuredClone({ ...existing!, revisions: [] }) }]
      : (existing?.revisions || statement.revisions || []);
    const clean: ProgressStatement = {
      ...statement,
      previousClaimedAmount,
      remainingBalance: statement.totalClaimableAmount - previousClaimedAmount - statement.currentStageAmount,
      currency: 'TOMAN',
      schemaVersion: 1,
      version: isRevision ? (existing?.version || 1) + 1 : (existing?.version || statement.version || 1),
      revisions,
      updatedAt: now,
      createdAt: index >= 0 ? list[index].createdAt : statement.createdAt || now,
    };

    if (index >= 0) {
      list[index] = clean;
    } else {
      list.push(clean);
    }

    const key = getStorageKey(statement.userId, statement.projectId);
    storage.set(key, list);
    return clean;
  }

  async issueStatement(userId: string, projectId: string, statementId: string, issueDateJalali: string): Promise<ProgressStatement> {
    const statement = await this.getStatementById(userId, projectId, statementId);
    if (!statement) {
      throw new Error('صورت‌وضعیت یافت نشد.');
    }

    const year = getJalaliYear(issueDateJalali);
    let docNumber = statement.documentNumber;
    if (!docNumber) {
      docNumber = await countersRepo.getNextDocumentNumber(userId, 'statement', year);
    }

    const prevStatus = statement.status;
    const updated: ProgressStatement = {
      ...statement,
      documentNumber: docNumber,
      statementDateJalali: issueDateJalali,
      status: 'issued',
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.saveStatement(updated);
    await auditRepo.recordStatusChange({
      documentId: saved.id,
      documentType: 'statement',
      fromStatus: prevStatus,
      toStatus: 'issued',
      actionDateJalali: issueDateJalali,
      changedByUserId: userId,
      reason: `صدور صورت‌وضعیت با شماره سند ${docNumber}`,
    });

    return saved;
  }

  async recordManualApproval(userId: string, projectId: string, statementId: string, approval: ManualApproval): Promise<ProgressStatement> {
    const statement = await this.getStatementById(userId, projectId, statementId);
    if (!statement) {
      throw new Error('صورت‌وضعیت یافت نشد.');
    }

    const prevStatus = statement.status;
    const updated: ProgressStatement = {
      ...statement,
      manualApproval: approval,
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.saveStatement(updated);
    await auditRepo.recordStatusChange({
      documentId: saved.id,
      documentType: 'statement',
      fromStatus: prevStatus,
      toStatus: saved.status,
      actionDateJalali: approval.approvalDateJalali,
      changedByUserId: userId,
      reason: `ثبت تأیید دستی صورت‌وضعیت (${approval.approvalType === 'phone' ? 'تلفنی' : approval.approvalType === 'in_person' ? 'حضوری' : 'سند کاغذی'}): ${approval.approverName}`,
    });

    return saved;
  }

  async cancelStatement(userId: string, projectId: string, statementId: string, reason: string, dateJalali: string): Promise<ProgressStatement> {
    const statement = await this.getStatementById(userId, projectId, statementId);
    if (!statement) {
      throw new Error('صورت‌وضعیت یافت نشد.');
    }

    const prevStatus = statement.status;
    const updated: ProgressStatement = {
      ...statement,
      status: 'cancelled',
      cancellationReason: reason,
      cancellationDateJalali: dateJalali,
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.saveStatement(updated);
    await auditRepo.recordStatusChange({
      documentId: saved.id,
      documentType: 'statement',
      fromStatus: prevStatus,
      toStatus: 'cancelled',
      actionDateJalali: dateJalali,
      changedByUserId: userId,
      reason: `لغو صورت‌وضعیت: ${reason}`,
    });

    return saved;
  }
}
