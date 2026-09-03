import { PaymentSchedule, PaymentMilestone, PaymentRecord } from '../../models';

export interface IPaymentsRepository {
  getSchedule(userId: string, projectId: string): Promise<PaymentSchedule | null>;
  saveSchedule(schedule: PaymentSchedule): Promise<PaymentSchedule>;
  getMilestones(userId: string, projectId: string): Promise<PaymentMilestone[]>;
  saveMilestone(milestone: PaymentMilestone): Promise<PaymentMilestone>;
  deleteMilestone(userId: string, projectId: string, milestoneId: string): Promise<void>;
  
  getPayments(userId: string, projectId: string): Promise<PaymentRecord[]>;
  recordPayment(payment: PaymentRecord): Promise<{ payment: PaymentRecord; updatedSchedule: PaymentSchedule }>;
  deletePayment(userId: string, projectId: string, paymentId: string): Promise<PaymentSchedule>;
}
