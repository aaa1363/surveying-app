import { ProformaInvoice, ManualApproval } from '../../models';

export interface IProformaRepository {
  getProforma(userId: string, projectId: string): Promise<ProformaInvoice | null>;
  saveProforma(proforma: ProformaInvoice): Promise<ProformaInvoice>;
  issueProforma(userId: string, projectId: string, issueDateJalali: string): Promise<ProformaInvoice>;
  recordManualApproval(userId: string, projectId: string, approval: ManualApproval): Promise<ProformaInvoice>;
  cancelProforma(userId: string, projectId: string, reason: string, dateJalali: string): Promise<ProformaInvoice>;
  updateStatus(userId: string, projectId: string, newStatus: ProformaInvoice['status'], reason?: string, dateJalali?: string): Promise<ProformaInvoice>;
}
