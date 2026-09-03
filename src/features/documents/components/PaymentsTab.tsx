import React, { useState, useEffect } from 'react';
import {
  Coins,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Building,
  Calendar,
  Layers,
  ArrowDownToLine,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import {
  SurveyProject,
  User,
  PaymentSchedule,
  PaymentMilestone,
  PaymentRecord,
  PaymentMethod,
  ServiceInvoice,
} from '../../../models';
import {
  paymentsRepository,
  contractsRepository,
  invoicesRepository,
} from '../../../repositories';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { LoadingState } from '../../../components/ui/LoadingState';
import { formatToman, numberToPersianWords, toPersianDigits, toEnglishDigits } from '../../../utils/formatters';
import { getCurrentJalaliDate, isValidJalaliDate } from '../../../utils/jalaliDate';
import { FutureCapabilitiesPanel } from './FutureCapabilitiesPanel';

interface PaymentsTabProps {
  project: SurveyProject;
  user: User;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({ project, user }) => {
  const [schedule, setSchedule] = useState<PaymentSchedule | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [contractAmount, setContractAmount] = useState<number>(0);
  const [invoices, setInvoices] = useState<ServiceInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Milestone Modal
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneType, setMilestoneType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [milestonePercent, setMilestonePercent] = useState<number>(30);
  const [milestoneAmount, setMilestoneAmount] = useState<number>(0);
  const [milestoneDueDate, setMilestoneDueDate] = useState(getCurrentJalaliDate());
  const [milestoneCondition, setMilestoneCondition] = useState('');
  const [milestoneNotes, setMilestoneNotes] = useState('');

  // New Payment Record Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDateJalali, setPaymentDateJalali] = useState(getCurrentJalaliDate());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card_to_card');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sched, recs, contract, invoiceList] = await Promise.all([
        paymentsRepository.getSchedule(user.id, project.id),
        paymentsRepository.getPayments(user.id, project.id),
        contractsRepository.getContract(user.id, project.id),
        invoicesRepository.getInvoices(user.id, project.id),
      ]);

      const cAmount = contract?.totalAmount || 0;
      setContractAmount(cAmount);
      setInvoices(invoiceList.filter((invoice) => invoice.status !== 'draft' && invoice.status !== 'cancelled'));

      if (sched) {
        // If contract amount changed, ensure schedule reflects it
        if (cAmount > 0 && sched.totalContractAmount !== cAmount) {
          sched.totalContractAmount = cAmount;
          await paymentsRepository.saveSchedule(sched);
        }
        setSchedule(sched);
      } else {
        const initialSched: PaymentSchedule = {
          id: `sched-${user.id}-${project.id}`,
          userId: user.id,
          projectId: project.id,
          totalContractAmount: cAmount,
          milestones: cAmount > 0 ? [
            {
              id: `m-1-${Date.now()}`,
              userId: user.id,
              projectId: project.id,
              order: 1,
              title: 'پیش‌پرداخت اولیه و تجهیز',
              type: 'percentage',
              percentage: 30,
              amount: (cAmount * 30) / 100,
              dueDateJalali: getCurrentJalaliDate(),
              condition: 'هنگام امضای قرارداد و شروع عملیات',
              status: 'unpaid',
              paidAmount: 0,
            },
            {
              id: `m-2-${Date.now()}`,
              userId: user.id,
              projectId: project.id,
              order: 2,
              title: 'مرحله دوم: اتمام عملیات زمینی',
              type: 'percentage',
              percentage: 50,
              amount: (cAmount * 50) / 100,
              dueDateJalali: '',
              condition: 'پس از پایان برداشت صحرایی و ایستگاه‌گذاری',
              status: 'unpaid',
              paidAmount: 0,
            },
            {
              id: `m-3-${Date.now()}`,
              userId: user.id,
              projectId: project.id,
              order: 3,
              title: 'مرحله نهایی و تسویه',
              type: 'percentage',
              percentage: 20,
              amount: (cAmount * 20) / 100,
              dueDateJalali: '',
              condition: 'هنگام تحویل نقشه‌ها و فایل‌های رقومی',
              status: 'unpaid',
              paidAmount: 0,
            },
          ] : [],
          totalPaidAmount: 0,
          remainingBalance: cAmount,
          currency: 'TOMAN',
          schemaVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const saved = await paymentsRepository.saveSchedule(initialSched);
        setSchedule(saved);
      }

      setPayments(recs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات مالی و پرداخت‌ها');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [project.id, user.id]);

  const handleOpenNewMilestone = () => {
    setMilestoneTitle(`مرحله ${(schedule?.milestones.length || 0) + 1}`);
    setMilestoneType('percentage');
    setMilestonePercent(20);
    setMilestoneAmount((contractAmount * 20) / 100);
    setMilestoneDueDate(getCurrentJalaliDate());
    setMilestoneCondition('');
    setMilestoneNotes('');
    setMilestoneModalOpen(true);
  };

  const handleSaveMilestone = async () => {
    if (!milestoneTitle.trim()) {
      setError('عنوان مرحله الزامی است.');
      return;
    }

    const calculatedAmount =
      milestoneType === 'percentage'
        ? (contractAmount * milestonePercent) / 100
        : milestoneAmount;

    if (calculatedAmount <= 0) {
      setError('مبلغ مرحله باید بزرگتر از صفر باشد.');
      return;
    }

    try {
      const newMilestone: PaymentMilestone = {
        id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: user.id,
        projectId: project.id,
        order: (schedule?.milestones.length || 0) + 1,
        title: milestoneTitle.trim(),
        type: milestoneType,
        percentage: milestoneType === 'percentage' ? milestonePercent : undefined,
        amount: calculatedAmount,
        dueDateJalali: milestoneDueDate.trim() || undefined,
        condition: milestoneCondition.trim() || undefined,
        notes: milestoneNotes.trim() || undefined,
        status: 'unpaid',
        paidAmount: 0,
      };

      await paymentsRepository.saveMilestone(newMilestone);
      setMilestoneModalOpen(false);
      setSuccessMessage('مرحله پرداخت با موفقیت افزوده شد.');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره مرحله پرداخت');
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    try {
      await paymentsRepository.deleteMilestone(user.id, project.id, id);
      setSuccessMessage('مرحله پرداخت حذف شد.');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در حذف مرحله');
    }
  };

  const handleOpenRecordPayment = (milestoneId?: string) => {
    setSelectedMilestoneId(milestoneId || '');
    if (milestoneId && schedule) {
      const m = schedule.milestones.find((item) => item.id === milestoneId);
      if (m) {
        const remainingForMilestone = Math.max(0, m.amount - (m.paidAmount || 0));
        setPaymentAmount(remainingForMilestone > 0 ? remainingForMilestone : m.amount);
      }
    } else {
      setPaymentAmount(schedule?.remainingBalance || 0);
    }
    setPaymentDateJalali(getCurrentJalaliDate());
    setPaymentMethod('card_to_card');
    setTrackingNumber('');
    setPaymentNotes('');
    const firstPayableInvoice = invoices.find((invoice) => invoice.remainingBalance > 0);
    setSelectedInvoiceId(firstPayableInvoice?.id || '');
    setPaymentModalOpen(true);
  };

  const handleSavePayment = async () => {
    if (paymentAmount <= 0) {
      setError('مبلغ پرداخت باید بزرگتر از صفر باشد.');
      return;
    }
    if (!selectedInvoiceId) {
      setError('انتخاب صورتحساب برای ثبت پرداخت الزامی است.');
      return;
    }

    const dateVal = isValidJalaliDate(paymentDateJalali);
    if (!dateVal.isValid) {
      setError(dateVal.error || 'تاریخ پرداخت معتبر نیست.');
      return;
    }

    const rec: PaymentRecord = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      projectId: project.id,
      invoiceId: selectedInvoiceId,
      milestoneId: selectedMilestoneId || undefined,
      amount: Number(paymentAmount),
      paymentDateJalali,
      paymentMethod,
      trackingNumber: trackingNumber.trim() || undefined,
      notes: paymentNotes.trim() || undefined,
      currency: 'TOMAN',
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await executePaymentSave(rec);
  };

  const executePaymentSave = async (rec: PaymentRecord) => {
    try {
      await paymentsRepository.recordPayment(rec);

      setPaymentModalOpen(false);
      setSuccessMessage(`پرداخت به مبلغ ${formatToman(rec.amount)} با موفقیت ثبت شد و مانده حساب به‌روزرسانی گردید.`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت پرداخت');
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!window.confirm('آیا از حذف این رکورد پرداخت اطمینان دارید؟ مانده حساب مجدداً محاسبه خواهد شد.')) {
      return;
    }
    try {
      await paymentsRepository.deletePayment(user.id, project.id, id);
      setSuccessMessage('پرداخت حذف شد و مانده حساب به‌روزرسانی گردید.');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در حذف پرداخت');
    }
  };

  if (isLoading) {
    return <LoadingState message="در حال بارگذاری وضعیت پرداخت‌ها و مانده حساب..." className="py-12" />;
  }

  const totalPaid = schedule?.totalPaidAmount || 0;
  const remainingBal = schedule?.remainingBalance ?? contractAmount;
  const scheduledSum = (schedule?.milestones || []).reduce((sum, m) => sum + m.amount, 0);
  const collectionRate = contractAmount > 0 ? Math.min(100, Math.round((totalPaid / contractAmount) * 100)) : 0;

  const getMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'card_to_card': return 'کارت به کارت';
      case 'bank_transfer': return 'حواله بانکی / پایا / ساتنا';
      case 'cash': return 'نقدی';
      case 'cheque': return 'چک';
      case 'other': return 'سایر';
    }
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base">
              برنامه پرداخت مرحله‌ای و ثبت دریافتی‌ها
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              مدیریت مراحل توافق‌شده، ثبت دستی تراکنش‌ها و پایش مانده حساب
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenNewMilestone}
            rightIcon={<Plus className="w-4 h-4" />}
          >
            افزودن مرحله جدید
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenRecordPayment()}
            rightIcon={<ArrowDownToLine className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            ثبت دریافت وجه
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Financial Overview Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Metric 1: Total Contract Amount */}
        <Card variant="default" className="p-4 bg-white border-slate-200 space-y-1">
          <span className="text-[11px] text-slate-500 font-bold block">مبلغ کل قرارداد</span>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-base sm:text-lg font-black text-slate-900">{formatToman(contractAmount)}</span>
            <span className="text-[10px] text-slate-400">تومان</span>
          </div>
          <span className="text-[10px] text-slate-500 truncate block">
            {numberToPersianWords(contractAmount)}
          </span>
        </Card>

        {/* Metric 2: Total Scheduled */}
        <Card variant="default" className="p-4 bg-white border-slate-200 space-y-1">
          <span className="text-[11px] text-slate-500 font-bold block">جمع مراحل زمان‌بندی‌شده</span>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-base sm:text-lg font-black text-indigo-700">{formatToman(scheduledSum)}</span>
            <span className="text-[10px] text-indigo-500 font-bold">
              {contractAmount > 0 ? `${toPersianDigits(Math.round((scheduledSum / contractAmount) * 100))}%` : '---'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            تعداد {toPersianDigits(schedule?.milestones.length || 0)} مرحله تعریف‌شده
          </span>
        </Card>

        {/* Metric 3: Total Paid */}
        <Card variant="default" className="p-4 bg-emerald-50/50 border-emerald-200 space-y-1">
          <span className="text-[11px] text-emerald-800 font-bold block">کل دریافتی‌های ثبت‌شده</span>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-base sm:text-lg font-black text-emerald-700">{formatToman(totalPaid)}</span>
            <span className="text-[10px] text-emerald-600 font-bold">{toPersianDigits(collectionRate)}% وصول</span>
          </div>
          <span className="text-[10px] text-emerald-700 block">
            تعداد {toPersianDigits(payments.length)} تراکنش دریافتی
          </span>
        </Card>

        {/* Metric 4: Remaining Balance */}
        <Card variant="default" className="p-4 bg-rose-50/50 border-rose-200 space-y-1">
          <span className="text-[11px] text-rose-800 font-bold block">مانده تسویه‌نشده</span>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-base sm:text-lg font-black text-rose-700">{formatToman(remainingBal)}</span>
            <span className="text-[10px] text-rose-500 font-bold">تومان</span>
          </div>
          <span className="text-[10px] text-rose-600 block">
            {remainingBal === 0 && contractAmount > 0 ? 'کاملاً تسویه شده است' : 'در انتظار وصول'}
          </span>
        </Card>

      </div>

      {/* 1. Payment Milestones Schedule */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0B1D35]" />
            <h4 className="font-black text-slate-900 text-sm">مراحل پرداخت توافق‌شده</h4>
          </div>
        </div>

        {(!schedule?.milestones || schedule.milestones.length === 0) ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 p-6 text-xs text-slate-500">
            هنوز مرحله‌ای برای پرداخت تعریف نشده است.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {schedule.milestones.map((m, idx) => (
              <Card key={m.id} variant="default" className="p-4 bg-white border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                        {toPersianDigits(idx + 1)}
                      </span>
                      <strong className="text-sm font-bold text-slate-900">{m.title}</strong>
                      {m.percentage && (
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {toPersianDigits(m.percentage)}٪
                        </span>
                      )}
                      {m.status === 'paid' && <Badge variant="success" size="sm">تسویه‌شده</Badge>}
                      {m.status === 'partially_paid' && <Badge variant="warning" size="sm">بخشی پرداخت‌شده</Badge>}
                      {m.status === 'unpaid' && <Badge variant="neutral" size="sm">پرداخت‌نشده</Badge>}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-3 flex-wrap">
                      {m.dueDateJalali && (
                        <span>سررسید: <strong className="font-mono text-slate-700">{toPersianDigits(m.dueDateJalali)}</strong></span>
                      )}
                      {m.condition && <span>شرط: <strong className="text-slate-700">{m.condition}</strong></span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRecordPayment(m.id)}
                      rightIcon={<ArrowDownToLine className="w-3.5 h-3.5" />}
                      className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs"
                    >
                      ثبت پرداخت این مرحله
                    </Button>
                    <button
                      onClick={() => handleDeleteMilestone(m.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="حذف مرحله"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  <div>
                    <span className="text-[11px] text-slate-500 block">مبلغ مرحله:</span>
                    <span className="font-mono font-bold text-slate-900">{formatToman(m.amount)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">دریافتی این مرحله:</span>
                    <span className="font-mono text-emerald-700 font-bold">{formatToman(m.paidAmount || 0)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">مانده مرحله:</span>
                    <strong className="font-mono text-slate-700">{formatToman(Math.max(0, m.amount - (m.paidAmount || 0)))}</strong>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 2. Received Payments History */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h4 className="font-black text-slate-900 text-sm">ریز پرداخت‌های دریافتی ({toPersianDigits(payments.length)})</h4>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 p-6 text-xs text-slate-500">
            هنوز دریافتی مالی برای این پروژه ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">مبلغ دریافتی</th>
                  <th className="p-3">تاریخ</th>
                  <th className="p-3">روش پرداخت</th>
                  <th className="p-3">شماره پیگیری / فیش</th>
                  <th className="p-3">مرحله مرتبط</th>
                  <th className="p-3">توضیحات</th>
                  <th className="p-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const linkedM = schedule?.milestones.find((m) => m.id === p.milestoneId);
                  return (
                    <tr key={p.id} className={p.status === 'void' ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50/70'}>
                      <td className="p-3 font-mono font-bold text-emerald-800 text-sm">
                        {formatToman(p.amount)} {p.status === 'void' && <Badge variant="neutral" size="sm">لغوشده</Badge>}
                      </td>
                      <td className="p-3 font-mono text-slate-700">
                        {toPersianDigits(p.paymentDateJalali)}
                      </td>
                      <td className="p-3 text-slate-800 font-medium">
                        {getMethodLabel(p.paymentMethod)}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {p.trackingNumber ? toPersianDigits(p.trackingNumber) : '---'}
                      </td>
                      <td className="p-3 text-slate-700">
                        {linkedM ? linkedM.title : 'عمومی / بدون تفکیک مرحله'}
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">
                        {p.notes || '---'}
                      </td>
                      <td className="p-3 text-center">
                        {p.status !== 'void' && <button
                          onClick={() => handleDeletePayment(p.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="حذف پرداخت"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FutureCapabilitiesPanel />

      {/* New Milestone Modal */}
      <Modal
        isOpen={milestoneModalOpen}
        onClose={() => setMilestoneModalOpen(false)}
        title="افزودن مرحله به برنامه پرداخت"
        size="md"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">صورتحساب مرتبط <span className="text-rose-500">*</span></label>
            <select value={selectedInvoiceId} onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900">
              <option value="">انتخاب صورتحساب</option>
              {invoices.filter((invoice) => invoice.remainingBalance > 0).map((invoice) => (
                <option key={invoice.id} value={invoice.id}>{invoice.documentNumber} — مانده {formatToman(invoice.remainingBalance)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              عنوان مرحله <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
              placeholder="مثال: تحویل فایل‌های رقومی"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نحوه تعیین مبلغ
              </label>
              <select
                value={milestoneType}
                onChange={(e) => setMilestoneType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              >
                <option value="percentage">درصدی از کل قرارداد</option>
                <option value="fixed_amount">مبلغ ثابت (تومان)</option>
              </select>
            </div>

            {milestoneType === 'percentage' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  درصد مرحله (%) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={milestonePercent || ''}
                  onChange={(e) => {
                    const p = Number(toEnglishDigits(e.target.value));
                    setMilestonePercent(p);
                    setMilestoneAmount((contractAmount * p) / 100);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مبلغ مرحله (تومان) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={milestoneAmount || ''}
                  onChange={(e) => setMilestoneAmount(Number(toEnglishDigits(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
                />
              </div>
            )}
          </div>

          <div className="text-xs text-indigo-900 font-bold bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
            مبلغ محاسبه‌شده: {formatToman(milestoneType === 'percentage' ? (contractAmount * milestonePercent) / 100 : milestoneAmount)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تاریخ سررسید (شمسی)
              </label>
              <input
                type="text"
                value={milestoneDueDate}
                onChange={(e) => setMilestoneDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                شرط تحقق مرحله
              </label>
              <input
                type="text"
                value={milestoneCondition}
                onChange={(e) => setMilestoneCondition(e.target.value)}
                placeholder="مثال: پایان برداشت صحرایی"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setMilestoneModalOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveMilestone}
              className="bg-[#0B1D35] hover:bg-[#0B1D35]/90 text-white font-bold"
            >
              افزودن مرحله
            </Button>
          </div>
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="ثبت دستی دریافت وجه از کارفرما"
        size="md"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              مرحله مرتبط با این پرداخت
            </label>
            <select
              value={selectedMilestoneId}
              onChange={(e) => {
                const mid = e.target.value;
                setSelectedMilestoneId(mid);
                if (mid && schedule) {
                  const m = schedule.milestones.find((item) => item.id === mid);
                  if (m) {
                    const rem = Math.max(0, m.amount - (m.paidAmount || 0));
                    setPaymentAmount(rem > 0 ? rem : m.amount);
                  }
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            >
              <option value="">پرداخت کلی / بدون تخصیص به مرحله خاص</option>
              {schedule?.milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({formatToman(m.amount)} - مانده: {formatToman(Math.max(0, m.amount - (m.paidAmount || 0)))})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                مبلغ واریزی (تومان) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(Number(toEnglishDigits(e.target.value)))}
                className="w-full bg-white border border-emerald-500 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-950 focus:outline-none"
              />
              <span className="text-[10px] text-emerald-800 font-bold block mt-1">
                {numberToPersianWords(paymentAmount)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تاریخ دریافت / واریز (شمسی) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={paymentDateJalali}
                onChange={(e) => setPaymentDateJalali(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                روش پرداخت <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              >
                <option value="card_to_card">کارت به کارت</option>
                <option value="bank_transfer">حواله بانکی / پایا / ساتنا</option>
                <option value="cash">نقدی</option>
                <option value="cheque">چک صیادی</option>
                <option value="other">سایر روش‌ها</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                شماره پیگیری / فیش واریز
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="کد پیگیری یا شماره فیش..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              توضیحات اختیاری
            </label>
            <textarea
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="نکات مربوط به واریزکننده یا حساب مبدا..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setPaymentModalOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSavePayment}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              ثبت قطعی دریافتی
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
