import { ServiceInvoice } from '../../models';

export interface IInvoicesRepository {
  getInvoices(userId: string, projectId: string): Promise<ServiceInvoice[]>;
  getInvoiceById(userId: string, projectId: string, invoiceId: string): Promise<ServiceInvoice | null>;
  saveInvoice(invoice: ServiceInvoice, createRevision?: boolean): Promise<ServiceInvoice>;
  issueInvoice(userId: string, projectId: string, invoiceId: string, issueDateJalali: string): Promise<ServiceInvoice>;
  updatePaymentStatus(userId: string, projectId: string, invoiceId: string, paidAmount: number): Promise<ServiceInvoice>;
  cancelInvoice(userId: string, projectId: string, invoiceId: string, reason: string, dateJalali: string): Promise<ServiceInvoice>;
}
