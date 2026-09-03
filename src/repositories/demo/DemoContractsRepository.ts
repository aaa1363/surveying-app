/**
 * Demo Contracts Repository
 * Storage Key: surveying.contracts.v1.{userId}.{projectId}
 */

import { Contract, ContractTemplate, ContractVersion, ManualApproval } from '../../models';
import { IContractsRepository } from '../interfaces/IContractsRepository';
import { storage } from '../../utils/storage';
import { getJalaliYear } from '../../utils/jalaliDate';
import { DemoDocumentCountersRepository } from './DemoDocumentCountersRepository';
import { DemoDocumentAuditRepository } from './DemoDocumentAuditRepository';

const countersRepo = new DemoDocumentCountersRepository();
const auditRepo = new DemoDocumentAuditRepository();

function getStorageKey(userId: string, projectId: string): string {
  return `surveying.contracts.v1.${userId}.${projectId}`;
}

export class DemoContractsRepository implements IContractsRepository {
  async getDefaultTemplate(): Promise<ContractTemplate> {
    return {
      id: 'template-surveying-v1',
      name: 'قالب جامع خدمات مهندسی نقشه‌برداری',
      version: '1.0.0',
      sections: [
        {
          id: 'sec-1',
          title: 'ماده ۱ - موضوع قرارداد و شرح خدمات',
          content: 'انجام کامل عملیات نقشه‌برداری شامل برداشت زمینی، تهیه نقشه‌های رقومی، تعیین مختصات و تهیه فایلهای خروجی استاندارد مطابق با نیازها و مشخصات فنی پروژه.',
          isRequired: true,
        },
        {
          id: 'sec-2',
          title: 'ماده ۲ - اسناد و تحویل‌دادنی‌ها',
          content: 'ارائه فایل نقشه‌ها در قالب‌های DWG / DXF / PDF به انضمام گزارش فنی اندازه‌گیری‌ها، مختصات ایستگاه‌ها و فایل رقومی نقاط برداشت‌شده.',
          isRequired: true,
        },
        {
          id: 'sec-3',
          title: 'ماده ۳ - مدت و برنامه زمان‌بندی',
          content: 'مدت اجرای عملیات از تاریخ تحویل زمین و پرداخت پیش‌پرداخت آغاز و طی روزهای کاری توافق‌شده تکمیل و تحویل می‌گردد.',
          isRequired: true,
        },
        {
          id: 'sec-4',
          title: 'ماده ۴ - مبلغ و نحوه پرداخت',
          content: 'مبلغ کل حق‌الزحمه خدمات به شرح جدول پرداخت‌های مرحله‌ای و به صورت پیش‌پرداخت، پرداخت‌های میانی پس از تایید گزارش پیشرفت و تسویه نهایی هنگام تحویل مدارک پرداخت می‌گردد.',
          isRequired: true,
        },
      ],
      surveyorObligations: 'نقشه‌بردار متعهد است با بهره‌گیری از تجهیزات دقیق کالیبره‌شده، استانداردهای فنی و نقشه‌برداری زمینی را رعایت نموده و نقشه‌ها را در مهلت مقرر تحویل نماید.',
      clientObligations: 'کارفرما متعهد است دسترسی بی‌خطر و بلامانع به کارگاه را فراهم نموده، مستندات مرجع موردنیاز را در اختیار نقشه‌بردار گذاشته و مبالغ را مطابق زمان‌بندی واریز نماید.',
      scopeChangeTerms: 'در صورت افزایش محدوده یا عوارض اضافی، مراتب با توافق کتبی طرفین و بر اساس نرخ‌های توافق‌شده به متمم قرارداد اضافه خواهد شد.',
      delayTerms: 'تاخیرات ناشی از حوادث قهریه یا عدم دسترسی به سایت که خارج از اختیارات نقشه‌بردار باشد، به مدت زمان قرارداد افزوده خواهد شد.',
      terminationTerms: 'هر یک از طرفین در صورت تخلف صریح از تعهدات پس از اخطار کتبی حق فسخ با تصفیه حساب هزینه‌های واقعی انجام‌شده تا زمان توقف را دارند.',
      disputeResolution: 'اختلافات احتمالی در مرحله اول از طریق مذاکره مسالمت‌آمیز و در صورت عدم توافق از طریق مراجع صالحه قانونی یا داوری مرضی‌الطرفین حل‌وفصل خواهد شد.',
    };
  }

  async getContract(userId: string, projectId: string): Promise<Contract | null> {
    if (!userId || !projectId) return null;
    const key = getStorageKey(userId, projectId);
    return storage.get<Contract | null>(key, null);
  }

  async saveContract(contract: Contract): Promise<Contract> {
    const key = getStorageKey(contract.userId, contract.projectId);
    const existing = await this.getContract(contract.userId, contract.projectId);
    const now = new Date().toISOString();

    const clean: Contract = {
      ...contract,
      currency: 'TOMAN',
      schemaVersion: 1,
      currentVersion: contract.currentVersion || 1,
      versions: contract.versions || [],
      updatedAt: now,
      createdAt: existing?.createdAt || contract.createdAt || now,
    };

    storage.set(key, clean);
    return clean;
  }

  async issueContract(userId: string, projectId: string, issueDateJalali: string): Promise<Contract> {
    const existing = await this.getContract(userId, projectId);
    if (!existing) {
      throw new Error('قرارداد یافت نشد.');
    }

    const year = getJalaliYear(issueDateJalali);
    let docNumber = existing.documentNumber;
    if (!docNumber) {
      docNumber = await countersRepo.getNextDocumentNumber(userId, 'contract', year);
    }

    const prevStatus = existing.status;
    const updated: Contract = {
      ...existing,
      documentNumber: docNumber,
      status: 'ready_to_send',
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.saveContract(updated);
    await auditRepo.recordStatusChange({
      documentId: saved.id,
      documentType: 'contract',
      fromStatus: prevStatus,
      toStatus: 'ready_to_send',
      actionDateJalali: issueDateJalali,
      changedByUserId: userId,
      reason: 'صدور قرارداد و آماده‌سازی جهت امضا/ارسال',
    });

    return saved;
  }

  async recordManualApproval(userId: string, projectId: string, approval: ManualApproval): Promise<Contract> {
    const existing = await this.getContract(userId, projectId);
    if (!existing) {
      throw new Error('قرارداد یافت نشد.');
    }

    const prevStatus = existing.status;
    const updated: Contract = {
      ...existing,
      manualApproval: approval,
      status: 'active',
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.saveContract(updated);
    await auditRepo.recordStatusChange({
      documentId: saved.id,
      documentType: 'contract',
      fromStatus: prevStatus,
      toStatus: 'active',
      actionDateJalali: approval.approvalDateJalali,
      changedByUserId: userId,
      reason: `ثبت تأیید/امضای دستی کارفرما (${approval.approvalType === 'phone' ? 'تلفنی' : approval.approvalType === 'in_person' ? 'حضوری' : 'سند کاغذی'}): ${approval.approverName}`,
    });

    return saved;
  }

  async saveNewVersion(contract: Contract, changeSummary: string, updatedJalaliDate: string): Promise<Contract> {
    const existing = await this.getContract(contract.userId, contract.projectId);
    const now = new Date().toISOString();

    const previousVersionSnapshot: ContractVersion = {
      versionNumber: existing ? existing.currentVersion : 1,
      savedAt: now,
      savedByUserId: contract.userId,
      changeSummary: changeSummary || 'ویرایش مفاد و شرایط قرارداد',
      totalAmount: existing ? existing.totalAmount : contract.totalAmount,
      sections: existing ? existing.sections : contract.sections,
      updatedAtJalali: updatedJalaliDate,
    };

    const updatedVersions = existing?.versions ? [...existing.versions, previousVersionSnapshot] : [previousVersionSnapshot];
    const newVersionNumber = (existing?.currentVersion || 1) + 1;

    const updated: Contract = {
      ...contract,
      currentVersion: newVersionNumber,
      versions: updatedVersions,
      updatedAt: now,
    };

    const saved = await this.saveContract(updated);
    await auditRepo.recordStatusChange({
      documentId: saved.id,
      documentType: 'contract',
      fromStatus: existing?.status || 'draft',
      toStatus: saved.status,
      actionDateJalali: updatedJalaliDate,
      changedByUserId: contract.userId,
      reason: `ثبت نگارش جدید نسخه ${newVersionNumber}: ${changeSummary}`,
    });

    return saved;
  }

  async cancelContract(userId: string, projectId: string, reason: string, dateJalali: string): Promise<Contract> {
    const existing = await this.getContract(userId, projectId);
    if (!existing) {
      throw new Error('قرارداد یافت نشد.');
    }

    const prevStatus = existing.status;
    const updated: Contract = {
      ...existing,
      status: 'cancelled',
      cancellationReason: reason,
      cancellationDateJalali: dateJalali,
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.saveContract(updated);
    await auditRepo.recordStatusChange({
      documentId: saved.id,
      documentType: 'contract',
      fromStatus: prevStatus,
      toStatus: 'cancelled',
      actionDateJalali: dateJalali,
      changedByUserId: userId,
      reason: `لغو/فسخ قرارداد: ${reason}`,
    });

    return saved;
  }

  async updateStatus(
    userId: string,
    projectId: string,
    newStatus: Contract['status'],
    reason?: string,
    dateJalali?: string
  ): Promise<Contract> {
    const existing = await this.getContract(userId, projectId);
    if (!existing) {
      throw new Error('قرارداد یافت نشد.');
    }

    const prevStatus = existing.status;
    const updated: Contract = {
      ...existing,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.saveContract(updated);
    await auditRepo.recordStatusChange({
      documentId: saved.id,
      documentType: 'contract',
      fromStatus: prevStatus,
      toStatus: newStatus,
      actionDateJalali: dateJalali || existing.startDateJalali,
      changedByUserId: userId,
      reason: reason || `تغییر وضعیت قرارداد به ${newStatus}`,
    });

    return saved;
  }
}
