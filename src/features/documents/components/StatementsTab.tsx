import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Printer,
  History,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  PhoneCall,
  XCircle,
  FileCheck,
  Building,
} from 'lucide-react';
import {
  SurveyProject,
  User,
  ProgressStatement,
  ServiceInvoice,
  DocumentPartySnapshot,
} from '../../../models';
import {
  statementsRepository,
  invoicesRepository,
  contractsRepository,
  profileRepository,
} from '../../../repositories';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { LoadingState } from '../../../components/ui/LoadingState';
import { DocumentPrintModal } from './DocumentPrintModal';
import { ManualApprovalModal } from './ManualApprovalModal';
import { DocumentAuditModal } from './DocumentAuditModal';
import { formatToman, numberToPersianWords, toPersianDigits, toEnglishDigits } from '../../../utils/formatters';
import { getCurrentJalaliDate, isValidJalaliDate } from '../../../utils/jalaliDate';

interface StatementsTabProps {
  project: SurveyProject;
  user: User;
}

export const StatementsTab: React.FC<StatementsTabProps> = ({ project, user }) => {
  const [statements, setStatements] = useState<ProgressStatement[]>([]);
  const [invoices, setInvoices] = useState<ServiceInvoice[]>([]);
  const [contractAmount, setContractAmount] = useState<number>(0);
  const [contractId, setContractId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Statement Form Modal
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [stageTitle, setStageTitle] = useState('');
  const [statementDateJalali, setStatementDateJalali] = useState(getCurrentJalaliDate());
  const [progressPercentage, setProgressPercentage] = useState<number>(50);
  const [totalClaimableAmount, setTotalClaimableAmount] = useState<number>(0);
  const [previousClaimedAmount, setPreviousClaimedAmount] = useState<number>(0);
  const [currentStageAmount, setCurrentStageAmount] = useState<number>(0);
  const [statementNotes, setStatementNotes] = useState('');

  // New Invoice Form Modal
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceDesc, setInvoiceDesc] = useState('');
  const [invoiceTotalAmount, setInvoiceTotalAmount] = useState<number>(0);
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Modals for Actions
  const [selectedStatement, setSelectedStatement] = useState<ProgressStatement | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<ServiceInvoice | null>(null);
  const [printDocType, setPrintDocType] = useState<'statement' | 'invoice'>('statement');
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditDocId, setAuditDocId] = useState('');
  const [auditDocTitle, setAuditDocTitle] = useState('');

  // Cancel Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetType, setCancelTargetType] = useState<'statement' | 'invoice'>('statement');
  const [cancelTargetId, setCancelTargetId] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDate, setCancelDate] = useState(getCurrentJalaliDate());

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [stmts, invs, contract] = await Promise.all([
        statementsRepository.getStatements(user.id, project.id),
        invoicesRepository.getInvoices(user.id, project.id),
        contractsRepository.getContract(user.id, project.id),
      ]);

      setStatements(stmts);
      setInvoices(invs);
      const cAmount = contract?.totalAmount || 0;
      setContractAmount(cAmount);
      setContractId(contract?.id);
      setTotalClaimableAmount(cAmount);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات صورت‌وضعیت‌ها');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [project.id, user.id]);

  const handleOpenNewStatement = () => {
    // calculate sum of previously issued statements
    const prevSum = statements
      .filter((s) => s.status !== 'cancelled')
      .reduce((sum, s) => sum + s.currentStageAmount, 0);

    const baseAmount = contractAmount > 0 ? contractAmount : 0;
    setPreviousClaimedAmount(prevSum);
    setTotalClaimableAmount(baseAmount);
    setStageTitle(`صورت‌وضعیت مرحله ${toPersianDigits(statements.length + 1)}`);
    setStatementDateJalali(getCurrentJalaliDate());
    setProgressPercentage(50);

    const estimatedCurrent = baseAmount > 0 ? Math.max(0, (baseAmount * 0.5) - prevSum) : 0;
    setCurrentStageAmount(estimatedCurrent);
    setStatementNotes('');
    setStatementModalOpen(true);
  };

  // Recalculate current stage amount when percentage or total claimable changes
  const handleProgressChange = (percent: number) => {
    setProgressPercentage(percent);
    if (totalClaimableAmount > 0) {
      const targetAmount = (totalClaimableAmount * percent) / 100;
      const stageAmount = Math.max(0, targetAmount - previousClaimedAmount);
      setCurrentStageAmount(stageAmount);
    }
  };

  const handleSaveStatement = async (issueImmediately: boolean) => {
    if (!stageTitle.trim()) {
      setError('عنوان مرحله الزامی است.');
      return;
    }

    if (currentStageAmount <= 0) {
      setError('مبلغ این مرحله باید بزرگتر از صفر باشد.');
      return;
    }
    if (progressPercentage < 0 || progressPercentage > 100) {
      setError('درصد پیشرفت باید بین صفر تا ۱۰۰ باشد.');
      return;
    }
    if (previousClaimedAmount + currentStageAmount > totalClaimableAmount) {
      setError('مبلغ صورت‌وضعیت بیشتر از مانده قرارداد است.');
      return;
    }

    const dateVal = isValidJalaliDate(statementDateJalali);
    if (!dateVal.isValid) {
      setError(dateVal.error || 'تاریخ معتبر نیست.');
      return;
    }

    try {
      const remaining = Math.max(0, totalClaimableAmount - (previousClaimedAmount + currentStageAmount));
      const newStmt: ProgressStatement = {
        id: `st-${project.id}-${Date.now()}`,
        userId: user.id,
        projectId: project.id,
        contractId,
        stageTitle: stageTitle.trim(),
        statementDateJalali,
        progressPercentage,
        totalClaimableAmount,
        previousClaimedAmount,
        currentStageAmount,
        remainingBalance: remaining,
        status: 'draft',
        notes: statementNotes.trim() || undefined,
        version: 1,
        currency: 'TOMAN',
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await statementsRepository.saveStatement(newStmt);
      if (issueImmediately) {
        const issued = await statementsRepository.issueStatement(user.id, project.id, saved.id, statementDateJalali);
        setSuccessMessage(`صورت‌وضعیت با شماره ${issued.documentNumber} صادر شد.`);
      } else {
        setSuccessMessage('پیش‌نویس صورت‌وضعیت با موفقیت ذخیره شد.');
      }

      setStatementModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت صورت‌وضعیت');
    }
  };

  const handleIssueStatement = async (stmt: ProgressStatement) => {
    try {
      const issued = await statementsRepository.issueStatement(user.id, project.id, stmt.id, getCurrentJalaliDate());
      setSuccessMessage(`صورت‌وضعیت با شماره ${issued.documentNumber} صادر شد.`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در صدور صورت‌وضعیت');
    }
  };

  const createPartySnapshot = async (): Promise<DocumentPartySnapshot> => {
    const profile = await profileRepository.getProfile(user.id);
    return {
      surveyor: {
        fullName: user.fullName || 'مهندس نقشه‌بردار',
        phone: user.phone || '---',
        engineerLicenseNumber: profile?.engineerLicenseNumber,
        judicialExpertNumber: profile?.judicialExpertNumber,
      },
      client: { ...project.clientSnapshot },
    };
  };

  const handleCreateInvoiceFromStatement = async (stmt: ProgressStatement) => {
    try {
      const partySnapshot = await createPartySnapshot();
      const newInvoice: ServiceInvoice = {
        id: `inv-${project.id}-${Date.now()}`,
        userId: user.id,
        projectId: project.id,
        contractId,
        projectTitle: project.title,
        partySnapshot,
        serviceDescription: `ارائه خدمات مهندسی مربوط به ${stmt.stageTitle}`,
        issueDateJalali: getCurrentJalaliDate(),
        dueDateJalali: getCurrentJalaliDate(),
        totalAmount: stmt.currentStageAmount,
        paidAmount: 0,
        remainingBalance: stmt.currentStageAmount,
        status: 'draft',
        notes: stmt.notes,
        version: 1,
        currency: 'TOMAN',
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await invoicesRepository.saveInvoice(newInvoice);
      const issued = await invoicesRepository.issueInvoice(user.id, project.id, saved.id, getCurrentJalaliDate());
      setSuccessMessage(`صورتحساب خدمات با شماره سند ${issued.documentNumber} بر اساس صورت‌وضعیت صادر گردید.`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در صدور صورتحساب خدمات');
    }
  };

  const handleOpenNewInvoice = () => {
    setInvoiceDesc(`صورتحساب خدمات مهندسی پروژه ${project.title}`);
    setInvoiceTotalAmount(contractAmount > 0 ? contractAmount : 0);
    setInvoiceDueDate(getCurrentJalaliDate());
    setInvoiceNotes('');
    setInvoiceModalOpen(true);
  };

  const handleSaveInvoice = async () => {
    if (!invoiceDesc.trim()) {
      setError('شرح خدمات صورتحساب الزامی است.');
      return;
    }
    if (invoiceTotalAmount <= 0) {
      setError('مبلغ صورتحساب باید بزرگتر از صفر باشد.');
      return;
    }

    try {
      const partySnapshot = await createPartySnapshot();
      const newInvoice: ServiceInvoice = {
        id: `inv-${project.id}-${Date.now()}`,
        userId: user.id,
        projectId: project.id,
        projectTitle: project.title,
        partySnapshot,
        serviceDescription: invoiceDesc.trim(),
        issueDateJalali: getCurrentJalaliDate(),
        dueDateJalali: invoiceDueDate.trim() || undefined,
        totalAmount: Number(invoiceTotalAmount),
        paidAmount: 0,
        remainingBalance: Number(invoiceTotalAmount),
        status: 'draft',
        notes: invoiceNotes.trim() || undefined,
        version: 1,
        currency: 'TOMAN',
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await invoicesRepository.saveInvoice(newInvoice);
      const issued = await invoicesRepository.issueInvoice(user.id, project.id, saved.id, getCurrentJalaliDate());
      setSuccessMessage(`صورتحساب خدمات با شماره ${issued.documentNumber} صادر شد.`);
      setInvoiceModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در صدور صورتحساب');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      setError('علت لغو باید قید گردد.');
      return;
    }

    try {
      if (cancelTargetType === 'statement') {
        await statementsRepository.cancelStatement(user.id, project.id, cancelTargetId, cancelReason, cancelDate);
        setSuccessMessage('صورت‌وضعیت لغو شد.');
      } else {
        await invoicesRepository.cancelInvoice(user.id, project.id, cancelTargetId, cancelReason, cancelDate);
        setSuccessMessage('صورتحساب خدمات لغو شد.');
      }
      setCancelModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در لغو سند');
    }
  };

  const handleConfirmManualApproval = async (approval: any) => {
    if (!selectedStatement) return;
    try {
      await statementsRepository.recordManualApproval(user.id, project.id, selectedStatement.id, approval);
      setSuccessMessage('تأییدیه هماهنگی کارفرما برای صورت‌وضعیت ثبت گردید.');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت تأییدیه');
    }
  };

  if (isLoading) {
    return <LoadingState message="در حال دریافت اطلاعات صورت‌وضعیت‌ها و صورتحساب‌ها..." className="py-12" />;
  }

  return (
    <div className="space-y-8 text-right" dir="rtl">

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base">
              صورت‌وضعیت پیشرفت کار و صورتحساب خدمات
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ثبت پیشرفت فیزیکی، مبالغ مطالبه‌شده و صدور صورتحساب خدمات مهندسی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenNewInvoice}
            rightIcon={<Receipt className="w-4 h-4" />}
            className="text-slate-800"
          >
            صدور صورتحساب خدمات
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenNewStatement}
            rightIcon={<Plus className="w-4 h-4" />}
            className="bg-[#0B1D35] hover:bg-[#0B1D35]/90 text-white font-bold"
          >
            ثبت صورت‌وضعیت جدید
          </Button>
        </div>
      </div>

      {/* Tax Disclaimer Banner */}
      <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed flex items-start gap-2">
        <Receipt className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-slate-900">محدوده نسخه آزمایشی:</strong>
          <span className="mr-1">
            این بخش صرفاً جهت مستندسازی فنی و مدیریت داخلی صورت‌وضعیت‌ها و صورتحساب خدمات مهندسی طراحی شده و هیچ اتصال مالیاتی ندارد.
          </span>
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

      {/* 1. Progress Statements Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h4 className="font-black text-slate-900 text-sm">لیست صورت‌وضعیت‌های پیشرفت کار ({toPersianDigits(statements.length)})</h4>
          </div>
        </div>

        {statements.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">هنوز صورت‌وضعیتی برای این پروژه ثبت نشده است.</p>
            <p className="text-[11px] text-slate-500">
              می‌توانید با دکمه «ثبت صورت‌وضعیت جدید» اولین صورت‌وضعیت مرحله‌ای را صادر فرمایید.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {statements.map((s) => (
              <Card key={s.id} variant="default" className="p-4 bg-white border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-sm font-bold text-slate-900">{s.stageTitle}</strong>
                      {s.documentNumber ? (
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#0B1D35] text-white rounded">
                          {s.documentNumber}
                        </span>
                      ) : (
                        <Badge variant="neutral" size="sm">پیش‌نویس</Badge>
                      )}
                      {s.status === 'issued' && <Badge variant="info" size="sm">صادرشده</Badge>}
                      {s.status === 'cancelled' && <Badge variant="neutral" size="sm">لغوشده</Badge>}
                      {s.manualApproval && <Badge variant="success" size="sm">دارای تأیید کارفرما</Badge>}
                      {s.documentNumber && <Badge variant="neutral" size="sm">نسخه {toPersianDigits(s.version)}</Badge>}
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      تاریخ: <span className="font-mono">{toPersianDigits(s.statementDateJalali)}</span>
                      {s.progressPercentage ? ` | پیشرفت تجمعی: ${toPersianDigits(s.progressPercentage)}%` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStatement(s);
                        setPrintDocType('statement');
                        setPrintModalOpen(true);
                      }}
                      rightIcon={<Printer className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      چاپ A4
                    </Button>

                    {!s.documentNumber && s.status !== 'cancelled' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleIssueStatement(s)}
                        className="bg-[#0B1D35] text-white text-xs font-bold"
                      >
                        صدور با شماره سند
                      </Button>
                    )}

                    {s.documentNumber && !s.manualApproval && s.status !== 'cancelled' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedStatement(s);
                          setApprovalModalOpen(true);
                        }}
                        rightIcon={<PhoneCall className="w-3.5 h-3.5" />}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        ثبت تأیید
                      </Button>
                    )}

                    {s.documentNumber && s.status !== 'cancelled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateInvoiceFromStatement(s)}
                        rightIcon={<Receipt className="w-3.5 h-3.5" />}
                        className="text-teal-700 border-teal-300 hover:bg-teal-50 text-xs"
                      >
                        صدور صورتحساب
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAuditDocId(s.id);
                        setAuditDocTitle(s.stageTitle);
                        setAuditModalOpen(true);
                      }}
                      className="text-slate-500 hover:bg-slate-100"
                    >
                      <History className="w-4 h-4" />
                    </Button>

                    {s.status !== 'cancelled' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCancelTargetType('statement');
                          setCancelTargetId(s.id);
                          setCancelModalOpen(true);
                        }}
                        className="text-rose-600 hover:bg-rose-50 text-xs"
                      >
                        لغو
                      </Button>
                    )}
                  </div>
                </div>

                {/* Financial Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  <div>
                    <span className="text-[11px] text-slate-500 block">کل تعهد:</span>
                    <span className="font-mono font-bold text-slate-800">{formatToman(s.totalClaimableAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">قبلی مطالبه‌شده:</span>
                    <span className="font-mono text-slate-600">{formatToman(s.previousClaimedAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">مبلغ این مرحله:</span>
                    <strong className="font-mono text-amber-900">{formatToman(s.currentStageAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">مانده تعهد:</span>
                    <span className="font-mono text-slate-600">{formatToman(s.remainingBalance)}</span>
                  </div>
                </div>

                {s.notes && (
                  <p className="text-[11px] text-slate-600">
                    <strong>توضیحات:</strong> {s.notes}
                  </p>
                )}
                {s.revisions && s.revisions.length > 0 && (
                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                    نسخه‌های قبلی: {s.revisions.map((revision) => `${toPersianDigits(revision.revision)} (${formatToman(revision.snapshot.currentStageAmount)})`).join('، ')}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 2. Service Invoices Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
            <h4 className="font-black text-slate-900 text-sm">لیست صورتحساب‌های خدمات ({toPersianDigits(invoices.length)})</h4>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 p-6 text-xs text-slate-500">
            هنوز صورتحساب خدماتی برای این پروژه صادر نشده است.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {invoices.map((inv) => (
              <Card key={inv.id} variant="default" className="p-4 bg-white border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-sm font-bold text-slate-900">{inv.serviceDescription}</strong>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#0B1D35] text-white rounded">
                        {inv.documentNumber}
                      </span>
                      {inv.status === 'settled' && <Badge variant="success" size="sm">تسویه‌شده</Badge>}
                      {inv.status === 'partially_paid' && <Badge variant="warning" size="sm">بخشی پرداخت‌شده</Badge>}
                      {inv.documentNumber && <Badge variant="neutral" size="sm">نسخه {toPersianDigits(inv.version)}</Badge>}
                      {inv.status === 'issued' && <Badge variant="info" size="sm">صادرشده (پرداخت‌نشده)</Badge>}
                      {inv.status === 'cancelled' && <Badge variant="neutral" size="sm">لغوشده</Badge>}
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      تاریخ صدور: <span className="font-mono">{toPersianDigits(inv.issueDateJalali)}</span>
                      {inv.dueDateJalali ? ` | سررسید: ${toPersianDigits(inv.dueDateJalali)}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setPrintDocType('invoice');
                        setPrintModalOpen(true);
                      }}
                      rightIcon={<Printer className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      چاپ A4
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAuditDocId(inv.id);
                        setAuditDocTitle(inv.serviceDescription);
                        setAuditModalOpen(true);
                      }}
                      className="text-slate-500 hover:bg-slate-100"
                    >
                      <History className="w-4 h-4" />
                    </Button>

                    {inv.status !== 'cancelled' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCancelTargetType('invoice');
                          setCancelTargetId(inv.id);
                          setCancelModalOpen(true);
                        }}
                        className="text-rose-600 hover:bg-rose-50 text-xs"
                      >
                        لغو
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  <div>
                    <span className="text-[11px] text-slate-500 block">مبلغ کل صورتحساب:</span>
                    <span className="font-mono font-bold text-slate-900">{formatToman(inv.totalAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">پرداخت‌شده:</span>
                    <span className="font-mono text-emerald-700 font-bold">{formatToman(inv.paidAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">مانده قابل‌پرداخت:</span>
                    <strong className="font-mono text-rose-700">{formatToman(inv.remainingBalance)}</strong>
                  </div>
                </div>
                {inv.revisions && inv.revisions.length > 0 && (
                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                    نسخه‌های قبلی: {inv.revisions.map((revision) => `${toPersianDigits(revision.revision)} (${formatToman(revision.snapshot.totalAmount)})`).join('، ')}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New Statement Modal */}
      <Modal
        isOpen={statementModalOpen}
        onClose={() => setStatementModalOpen(false)}
        title="تنظیم و صدور صورت‌وضعیت پیشرفت کار"
        size="md"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              عنوان مرحله یا بخش کار <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={stageTitle}
              onChange={(e) => setStageTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تاریخ صورت‌وضعیت (شمسی) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={statementDateJalali}
                onChange={(e) => setStatementDateJalali(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                درصد پیشرفت تجمعی کار (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={progressPercentage || ''}
                onChange={(e) => handleProgressChange(Number(toEnglishDigits(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                کل مبلغ تعهد (تومان)
              </label>
              <input
                type="number"
                min={0}
                value={totalClaimableAmount || ''}
                onChange={(e) => {
                  const val = Number(toEnglishDigits(e.target.value));
                  setTotalClaimableAmount(val);
                  const target = (val * progressPercentage) / 100;
                  setCurrentStageAmount(Math.max(0, target - previousClaimedAmount));
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                مبالغ قبلی (تومان)
              </label>
              <input
                type="number"
                min={0}
                value={previousClaimedAmount || ''}
                onChange={(e) => setPreviousClaimedAmount(Number(toEnglishDigits(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                مبلغ این مرحله (تومان) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={currentStageAmount || ''}
                onChange={(e) => setCurrentStageAmount(Number(toEnglishDigits(e.target.value)))}
                className="w-full bg-white border border-teal-500 rounded-xl px-3 py-2 text-xs font-mono font-bold text-teal-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="text-xs text-teal-800 font-bold bg-teal-50 p-2.5 rounded-xl border border-teal-200">
            مبلغ این مرحله به حروف: {numberToPersianWords(currentStageAmount)}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              توضیحات و ریز اقلام
            </label>
            <textarea
              value={statementNotes}
              onChange={(e) => setStatementNotes(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setStatementModalOpen(false)}>
              انصراف
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveStatement(false)}
              >
                ذخیره پیش‌نویس
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSaveStatement(true)}
                className="bg-[#0B1D35] hover:bg-[#0B1D35]/90 text-white font-bold"
              >
                صدور با شماره سند
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* New Invoice Modal */}
      <Modal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title="صدور مستقیم صورتحساب خدمات"
        size="md"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              شرح خدمات صورتحساب <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={invoiceDesc}
              onChange={(e) => setInvoiceDesc(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                مبلغ کل صورتحساب (تومان) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={invoiceTotalAmount || ''}
                onChange={(e) => setInvoiceTotalAmount(Number(toEnglishDigits(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              />
              <span className="text-[10px] text-teal-800 font-bold block mt-1">
                {numberToPersianWords(invoiceTotalAmount)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تاریخ سررسید پرداخت (شمسی)
              </label>
              <input
                type="text"
                value={invoiceDueDate}
                onChange={(e) => setInvoiceDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              توضیحات اختیاری
            </label>
            <textarea
              value={invoiceNotes}
              onChange={(e) => setInvoiceNotes(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setInvoiceModalOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveInvoice}
              className="bg-[#0B1D35] hover:bg-[#0B1D35]/90 text-white font-bold"
            >
              صدور صورتحساب خدمات با شماره سند
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancellation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={`لغو ${cancelTargetType === 'statement' ? 'صورت‌وضعیت' : 'صورتحساب'}`}
        size="sm"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              علت لغو سند <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تاریخ شمسی
            </label>
            <input
              type="text"
              value={cancelDate}
              onChange={(e) => setCancelDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setCancelModalOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmCancel}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              تأیید لغو سند
            </Button>
          </div>
        </div>
      </Modal>

      {/* Print Modal */}
      <DocumentPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        documentType={printDocType}
        statement={selectedStatement}
        invoice={selectedInvoice}
      />

      {/* Manual Approval Modal */}
      <ManualApprovalModal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        onConfirm={handleConfirmManualApproval}
        documentTitle={`صورت‌وضعیت ${selectedStatement?.documentNumber || ''}`}
        defaultApproverName={project.clientSnapshot.type === 'legal' ? project.clientSnapshot.representativeName || project.clientSnapshot.companyName : project.clientSnapshot.fullName}
      />

      {/* Audit Modal */}
      <DocumentAuditModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        documentId={auditDocId}
        documentTitle={auditDocTitle}
      />

    </div>
  );
};
