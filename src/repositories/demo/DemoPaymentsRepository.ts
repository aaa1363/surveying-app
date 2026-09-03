/** Demo payment repository. Data is isolated by user and project. */
import { PaymentSchedule, PaymentMilestone, PaymentRecord } from '../../models';
import { IPaymentsRepository } from '../interfaces/IPaymentsRepository';
import { storage } from '../../utils/storage';
import { validateMilestones, validatePayment } from '../../features/documents/documentRules';
import { DemoInvoicesRepository } from './DemoInvoicesRepository';
import { DemoDocumentAuditRepository } from './DemoDocumentAuditRepository';

interface ProjectPaymentsData { schedule: PaymentSchedule; records: PaymentRecord[] }
const keyFor = (userId: string, projectId: string) => `surveying.payments.v1.${userId}.${projectId}`;

export class DemoPaymentsRepository implements IPaymentsRepository {
  private getData(userId: string, projectId: string): ProjectPaymentsData {
    const now = new Date().toISOString();
    return storage.get<ProjectPaymentsData>(keyFor(userId, projectId), {
      schedule: { id: `sched-${userId}-${projectId}`, userId, projectId, totalContractAmount: 0,
        milestones: [], totalPaidAmount: 0, remainingBalance: 0, currency: 'TOMAN', schemaVersion: 1,
        createdAt: now, updatedAt: now }, records: [],
    });
  }

  private active(records: PaymentRecord[]) { return records.filter((record) => record.status !== 'void'); }

  private recompute(data: ProjectPaymentsData): void {
    const active = this.active(data.records);
    for (const milestone of data.schedule.milestones) {
      milestone.paidAmount = active.filter((p) => p.milestoneId === milestone.id).reduce((sum, p) => sum + p.amount, 0);
      milestone.status = milestone.paidAmount >= milestone.amount && milestone.amount > 0
        ? 'paid' : milestone.paidAmount > 0 ? 'partially_paid' : 'unpaid';
    }
    data.schedule.totalPaidAmount = active.reduce((sum, p) => sum + p.amount, 0);
    data.schedule.remainingBalance = Math.max(0, data.schedule.totalContractAmount - data.schedule.totalPaidAmount);
    data.schedule.updatedAt = new Date().toISOString();
  }

  private persist(data: ProjectPaymentsData): void {
    storage.set(keyFor(data.schedule.userId, data.schedule.projectId), data);
  }

  async getSchedule(userId: string, projectId: string) {
    if (!userId || !projectId) return null;
    const data = this.getData(userId, projectId); this.recompute(data); return data.schedule;
  }

  async saveSchedule(schedule: PaymentSchedule) {
    validateMilestones(schedule.milestones, schedule.totalContractAmount);
    const data = this.getData(schedule.userId, schedule.projectId);
    data.schedule = { ...schedule, currency: 'TOMAN', schemaVersion: 1,
      createdAt: data.schedule.createdAt || schedule.createdAt || new Date().toISOString() };
    this.recompute(data); this.persist(data); return data.schedule;
  }

  async getMilestones(userId: string, projectId: string) {
    return (await this.getSchedule(userId, projectId))?.milestones ?? [];
  }

  async saveMilestone(milestone: PaymentMilestone) {
    const data = this.getData(milestone.userId, milestone.projectId);
    const next = [...data.schedule.milestones];
    const index = next.findIndex((item) => item.id === milestone.id);
    const clean = { ...milestone, percentage: milestone.type === 'fixed_amount' ? undefined : milestone.percentage };
    if (index >= 0) next[index] = clean; else next.push(clean);
    validateMilestones(next, data.schedule.totalContractAmount);
    data.schedule.milestones = next; this.recompute(data); this.persist(data); return clean;
  }

  async deleteMilestone(userId: string, projectId: string, milestoneId: string) {
    const data = this.getData(userId, projectId);
    if (this.active(data.records).some((payment) => payment.milestoneId === milestoneId)) {
      throw new Error('مرحله دارای پرداخت قابل حذف نیست.');
    }
    const next = data.schedule.milestones.filter((item) => item.id !== milestoneId);
    validateMilestones(next, data.schedule.totalContractAmount);
    data.schedule.milestones = next; this.recompute(data); this.persist(data);
  }

  async getPayments(userId: string, projectId: string) { return this.getData(userId, projectId).records; }

  async recordPayment(payment: PaymentRecord) {
    const data = this.getData(payment.userId, payment.projectId); this.recompute(data);
    const invoices = new DemoInvoicesRepository();
    const invoice = await invoices.getInvoiceById(payment.userId, payment.projectId, payment.invoiceId);
    if (!invoice || invoice.status === 'cancelled' || invoice.status === 'draft') throw new Error('صورتحساب معتبر برای پرداخت یافت نشد.');
    const invoicePaid = this.active(data.records).filter((p) => p.invoiceId === invoice.id).reduce((sum, p) => sum + p.amount, 0);
    const milestone = payment.milestoneId ? data.schedule.milestones.find((m) => m.id === payment.milestoneId) : undefined;
    if (payment.milestoneId && !milestone) throw new Error('مرحله پرداخت یافت نشد.');
    validatePayment(payment, data.schedule.remainingBalance, invoice.totalAmount - invoicePaid,
      milestone ? milestone.amount - milestone.paidAmount : undefined);
    const now = new Date().toISOString();
    const clean: PaymentRecord = { ...payment, id: payment.id || `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      status: 'valid', currency: 'TOMAN', schemaVersion: 1, createdAt: payment.createdAt || now, updatedAt: now };
    data.records.push(clean); this.recompute(data); this.persist(data);
    const paid = this.active(data.records).filter((p) => p.invoiceId === invoice.id).reduce((sum, p) => sum + p.amount, 0);
    await invoices.updatePaymentStatus(payment.userId, payment.projectId, invoice.id, paid);
    return { payment: clean, updatedSchedule: data.schedule };
  }

  async deletePayment(userId: string, projectId: string, paymentId: string) {
    const data = this.getData(userId, projectId);
    const index = data.records.findIndex((record) => record.id === paymentId);
    if (index < 0 || data.records[index].status === 'void') return data.schedule;
    const payment = data.records[index];
    data.records[index] = { ...payment, status: 'void', voidReason: 'لغو توسط کاربر', voidedAt: new Date().toISOString(),
      voidedByUserId: userId, updatedAt: new Date().toISOString() };
    this.recompute(data); this.persist(data);
    const invoices = new DemoInvoicesRepository();
    const paid = this.active(data.records).filter((p) => p.invoiceId === payment.invoiceId).reduce((sum, p) => sum + p.amount, 0);
    await invoices.updatePaymentStatus(userId, projectId, payment.invoiceId, paid);
    await new DemoDocumentAuditRepository().recordStatusChange({ documentId: payment.id, documentType: 'invoice',
      fromStatus: 'paid', toStatus: 'void', actionDateJalali: payment.paymentDateJalali,
      changedByUserId: userId, reason: 'لغو رکورد پرداخت توسط کاربر' });
    return data.schedule;
  }
}
