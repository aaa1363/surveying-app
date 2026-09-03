import { PaymentMilestone, PaymentRecord, ProgressStatement } from '../../models';

export const PAYMENT_EXCEEDS_REMAINING = 'مبلغ پرداخت بیشتر از مانده قابل‌تسویه است';

export function validateMilestones(milestones: PaymentMilestone[], totalContractAmount: number): void {
  if (!Number.isFinite(totalContractAmount) || totalContractAmount < 0) {
    throw new Error('مبلغ قرارداد نامعتبر است.');
  }
  let percentageTotal = 0;
  let amountTotal = 0;
  for (const milestone of milestones) {
    if (!milestone.title.trim()) throw new Error('مرحله خالی قابل ذخیره نیست.');
    if (!Number.isFinite(milestone.amount) || milestone.amount <= 0) {
      throw new Error('مبلغ مرحله باید بزرگتر از صفر باشد.');
    }
    if (milestone.type === 'percentage') {
      if (!Number.isFinite(milestone.percentage) || (milestone.percentage ?? 0) <= 0) {
        throw new Error('درصد مرحله باید بزرگتر از صفر باشد.');
      }
      percentageTotal += milestone.percentage ?? 0;
    } else if (milestone.percentage !== undefined) {
      throw new Error('در حالت مبلغ ثابت، درصد نباید ثبت شود.');
    }
    amountTotal += milestone.amount;
  }
  if (percentageTotal > 100) throw new Error('مجموع درصد مراحل نباید از ۱۰۰٪ بیشتر شود.');
  if (amountTotal > totalContractAmount) throw new Error('مجموع مبلغ مراحل نباید از مبلغ قرارداد بیشتر شود.');
}

export function validateStatement(
  statement: ProgressStatement,
  previousStatements: ProgressStatement[],
): void {
  if (!statement.stageTitle.trim()) throw new Error('عنوان مرحله الزامی است.');
  if (!Number.isFinite(statement.currentStageAmount) || statement.currentStageAmount <= 0) {
    throw new Error('مبلغ صورت‌وضعیت باید بزرگتر از صفر باشد.');
  }
  if (!Number.isFinite(statement.totalClaimableAmount) || statement.totalClaimableAmount <= 0) {
    throw new Error('سقف قابل مطالبه باید بزرگتر از صفر باشد.');
  }
  if (statement.progressPercentage !== undefined &&
      (!Number.isFinite(statement.progressPercentage) || statement.progressPercentage < 0 || statement.progressPercentage > 100)) {
    throw new Error('درصد پیشرفت باید بین صفر تا ۱۰۰ باشد.');
  }
  const previousClaimed = previousStatements
    .filter((item) => item.id !== statement.id && item.status !== 'cancelled' && item.contractId === statement.contractId)
    .reduce((sum, item) => sum + item.currentStageAmount, 0);
  if (previousClaimed + statement.currentStageAmount > statement.totalClaimableAmount) {
    throw new Error('مبلغ صورت‌وضعیت بیشتر از مانده قرارداد است.');
  }
}

export function validatePayment(
  payment: PaymentRecord,
  contractRemaining: number,
  invoiceRemaining: number,
  milestoneRemaining?: number,
): void {
  if (!Number.isFinite(payment.amount) || payment.amount <= 0) {
    throw new Error('مبلغ پرداخت باید بزرگتر از صفر باشد.');
  }
  if (!payment.invoiceId) throw new Error('انتخاب صورتحساب برای ثبت پرداخت الزامی است.');
  const allowed = Math.min(contractRemaining, invoiceRemaining, milestoneRemaining ?? Number.POSITIVE_INFINITY);
  if (payment.amount > allowed) throw new Error(PAYMENT_EXCEEDS_REMAINING);
}
