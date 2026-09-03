import React, { useState, useEffect } from 'react';
import {
  FileSignature,
  Save,
  Send,
  Printer,
  History,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Clock,
  Coins,
  FileCheck,
  UserCheck,
  GitBranch,
  XCircle,
} from 'lucide-react';
import {
  SurveyProject,
  User,
  Contract,
  ContractSection,
  ContractStatus,
  DocumentPartySnapshot,
} from '../../../models';
import {
  contractsRepository,
  profileRepository,
  projectPricingRepository,
} from '../../../repositories';
import {PersianDateInput} from '../../../components/ui/PersianDateInput';
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
import { getSubServiceLabel } from '../../../data/servicesCatalog';

interface ContractTabProps {
  project: SurveyProject;
  user: User;
}

export const ContractTab: React.FC<ContractTabProps> = ({ project, user }) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Contract Form Fields
  const [subject, setSubject] = useState('');
  const [scopeOfServices, setScopeOfServices] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [startDateJalali, setStartDateJalali] = useState(project.startDateJalali || getCurrentJalaliDate());
  const [durationDaysOrMonths, setDurationDaysOrMonths] = useState('۱۵ روز کاری پس از تحویل زمین');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [sections, setSections] = useState<ContractSection[]>([]);
  const [surveyorObligations, setSurveyorObligations] = useState('');
  const [clientObligations, setClientObligations] = useState('');
  const [scopeChangeTerms, setScopeChangeTerms] = useState('');
  const [delayTerms, setDelayTerms] = useState('');
  const [terminationTerms, setTerminationTerms] = useState('');
  const [disputeResolution, setDisputeResolution] = useState('');
  const [notesAndAttachments, setNotesAndAttachments] = useState('');

  // Modals
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [newVersionSummary, setNewVersionSummary] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDate, setCancelDate] = useState(getCurrentJalaliDate());

  const loadContractData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const template = await contractsRepository.getDefaultTemplate();
      const existing = await contractsRepository.getContract(user.id, project.id);

      if (existing) {
        setContract(existing);
        setSubject(existing.subject || '');
        setScopeOfServices(existing.scopeOfServices || '');
        setDeliverables(existing.deliverables || '');
        setStartDateJalali(existing.startDateJalali || getCurrentJalaliDate());
        setDurationDaysOrMonths(existing.durationDaysOrMonths || '');
        setTotalAmount(existing.totalAmount || 0);
        setSections(existing.sections || template.sections);
        setSurveyorObligations(existing.surveyorObligations || template.surveyorObligations);
        setClientObligations(existing.clientObligations || template.clientObligations);
        setScopeChangeTerms(existing.scopeChangeTerms || template.scopeChangeTerms);
        setDelayTerms(existing.delayTerms || template.delayTerms);
        setTerminationTerms(existing.terminationTerms || template.terminationTerms);
        setDisputeResolution(existing.disputeResolution || template.disputeResolution);
        setNotesAndAttachments(existing.notesAndAttachments || '');
      } else {
        // Init from default template & project context
        const serviceTitle = getSubServiceLabel(
          project.services.mainCategoryId,
          project.services.primarySubServiceId
        );
        setSubject(`قرارداد ارائه خدمات مهندسی نقشه‌برداری در موضوع ${serviceTitle}`);
        setScopeOfServices(`عملیات نقشه‌برداری زمینی، تعیین مختصات و تهیه نقشه‌های رقومی پروژه «${project.title}» واقع در استان ${project.location.province}، شهر ${project.location.city}`);
        setDeliverables('فایل نقشه‌های اتوکد (DWG/DXF)، فایل خروجی PDF، جدول مختصات رقومی ایستگاه‌ها و نقاط برداشت‌شده همراه با گزارش فنی.');
        setStartDateJalali(project.startDateJalali || getCurrentJalaliDate());
        setDurationDaysOrMonths('۱۵ روز کاری پس از تحویل بلامانع زمین و واریز پیش‌پرداخت');
        setSections(template.sections);
        setSurveyorObligations(template.surveyorObligations);
        setClientObligations(template.clientObligations);
        setScopeChangeTerms(template.scopeChangeTerms);
        setDelayTerms(template.delayTerms);
        setTerminationTerms(template.terminationTerms);
        setDisputeResolution(template.disputeResolution);
        setNotesAndAttachments('');

        // Attempt reading pricing if exists
        const estimate = await projectPricingRepository.getEstimate(user.id, project.id);
        if (estimate && estimate.finalPrice > 0) {
          setTotalAmount(estimate.finalPrice);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات قرارداد');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContractData();
  }, [project.id, user.id]);

  const createPartySnapshot = async (): Promise<DocumentPartySnapshot> => {
    const profile = await profileRepository.getProfile(user.id);
    const warnings: string[] = [];

    if (!user.phone) warnings.push('شماره تماس نقشه‌بردار در نمایه ثبت نشده است.');
    if (!profile?.engineerLicenseNumber && !profile?.judicialExpertNumber) {
      warnings.push('شماره نظام مهندسی یا کارشناسی نقشه‌بردار ثبت نشده است.');
    }

    if (project.clientSnapshot.type === 'legal') {
      if (!project.clientSnapshot.companyName) warnings.push('نام شرکت کارفرما ثبت نشده است.');
      if (!project.clientSnapshot.phone) warnings.push('شماره تماس شرکت ثبت نشده است.');
      if (!project.clientSnapshot.representativeName) warnings.push('نام نماینده شرکت ثبت نشده است.');
    } else {
      if (!project.clientSnapshot.fullName) warnings.push('نام و نام خانوادگی کارفرما ثبت نشده است.');
      if (!project.clientSnapshot.phone) warnings.push('شماره تماس کارفرما ثبت نشده است.');
    }

    return {
      surveyor: {
        fullName: user.fullName || 'مهندس نقشه‌بردار',
        phone: user.phone || '---',
        engineerLicenseNumber: profile?.engineerLicenseNumber,
        judicialExpertNumber: profile?.judicialExpertNumber,
        province: profile?.province,
        city: profile?.city,
      },
      client: { ...project.clientSnapshot },
      validationWarnings: warnings,
    };
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const partySnapshot = await createPartySnapshot();
      const draft: Contract = {
        id: contract?.id || `ct-${project.id}-${Date.now()}`,
        userId: user.id,
        projectId: project.id,
        documentNumber: contract?.documentNumber,
        projectTitle: project.title,
        partySnapshot,
        subject,
        scopeOfServices,
        deliverables,
        startDateJalali,
        durationDaysOrMonths,
        totalAmount: Number(totalAmount) || 0,
        sections,
        surveyorObligations,
        clientObligations,
        scopeChangeTerms,
        delayTerms,
        terminationTerms,
        disputeResolution,
        notesAndAttachments,
        status: contract?.status || 'draft',
        currentVersion: contract?.currentVersion || 1,
        versions: contract?.versions || [],
        currency: 'TOMAN',
        schemaVersion: 1,
        createdAt: contract?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await contractsRepository.saveContract(draft);
      setContract(saved);
      setSuccessMessage('پیش‌نویس قرارداد با موفقیت ذخیره شد.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره قرارداد');
    } finally {
      setIsSaving(false);
    }
  };

  const handleIssue = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const issued = await contractsRepository.issueContract(user.id, project.id, startDateJalali);
      setContract(issued);
      setSuccessMessage(`قرارداد با شماره سند ${issued.documentNumber} صادر و آماده ارسال/امضا گردید.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در صدور قرارداد');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewForIssue = async () => {
    const val = isValidJalaliDate(startDateJalali);
    if (!val.isValid) {
      setError(val.error || 'تاریخ شروع قرارداد معتبر نیست.');
      return;
    }

    if (totalAmount <= 0) {
      setError('مبلغ کل قرارداد باید بزرگتر از صفر باشد.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await handleSaveDraft();
      setPrintModalOpen(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در صدور قرارداد');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsNewVersion = async () => {
    if (!newVersionSummary.trim()) {
      setError('خلاصه تغییرات نگارش جدید باید قید شود.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const partySnapshot = await createPartySnapshot();
      const currentContractState: Contract = {
        id: contract?.id || `ct-${project.id}-${Date.now()}`,
        userId: user.id,
        projectId: project.id,
        documentNumber: contract?.documentNumber,
        projectTitle: project.title,
        partySnapshot,
        subject,
        scopeOfServices,
        deliverables,
        startDateJalali,
        durationDaysOrMonths,
        totalAmount: Number(totalAmount) || 0,
        sections,
        surveyorObligations,
        clientObligations,
        scopeChangeTerms,
        delayTerms,
        terminationTerms,
        disputeResolution,
        notesAndAttachments,
        status: contract?.status || 'ready_to_send',
        currentVersion: contract?.currentVersion || 1,
        versions: contract?.versions || [],
        currency: 'TOMAN',
        schemaVersion: 1,
        createdAt: contract?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = await contractsRepository.saveNewVersion(
        currentContractState,
        newVersionSummary.trim(),
        getCurrentJalaliDate()
      );
      setContract(updated);
      setVersionModalOpen(false);
      setNewVersionSummary('');
      setSuccessMessage(`نگارش جدید (نسخه ${updated.currentVersion}) با موفقیت ثبت شد و نگارش قبلی در تاریخچه حفظ گردید.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت نگارش جدید');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmManualApproval = async (approval: any) => {
    try {
      const updated = await contractsRepository.recordManualApproval(user.id, project.id, approval);
      setContract(updated);
      setSuccessMessage('تأییدیه و امضای دستی کارفرما ثبت شد و قرارداد به وضعیت فعال تغییر یافت.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت تأییدیه');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      setError('علت لغو/فسخ قرارداد باید قید گردد.');
      return;
    }
    try {
      const cancelled = await contractsRepository.cancelContract(user.id, project.id, cancelReason, cancelDate);
      setContract(cancelled);
      setCancelModalOpen(false);
      setSuccessMessage('قرارداد لغو/فسخ شد.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در لغو قرارداد');
    }
  };

  if (isLoading) {
    return <LoadingState message="در حال بارگذاری قرارداد و مفاد حقوقی..." className="py-12" />;
  }

  const getStatusBadge = (status?: ContractStatus) => {
    switch (status) {
      case 'draft':
        return <Badge variant="neutral" size="sm">پیش‌نویس</Badge>;
      case 'ready_to_send':
        return <Badge variant="info" size="sm">آماده ارسال / امضا</Badge>;
      case 'manual_approved':
      case 'active':
        return <Badge variant="success" size="sm">فعال و دارای تأیید دستی</Badge>;
      case 'completed':
        return <Badge variant="success" size="sm">تکمیل‌شده</Badge>;
      case 'terminated':
        return <Badge variant="danger" size="sm">فسخ‌شده</Badge>;
      case 'cancelled':
        return <Badge variant="neutral" size="sm">لغوشده</Badge>;
      default:
        return <Badge variant="neutral" size="sm">در حال تنظیم</Badge>;
    }
  };

  const isIssued = Boolean(contract?.documentNumber);

  return (
    <div className="space-y-6 text-right" dir="rtl">

      {/* Top Banner & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
            <FileSignature className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                قرارداد ارائه خدمات مهندسی نقشه‌برداری
              </h3>
              {contract?.documentNumber ? (
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 bg-[#0B1D35] text-white rounded-md">
                  {contract.documentNumber}
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-mono">پیش‌نویس بدون شماره</span>
              )}
              {getStatusBadge(contract?.status)}
              <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold">
                نگارش {contract?.currentVersion || 1}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              تنظیم مواد، تعهدات فنی، زمان‌بندی تحویل و ثبت تأیید دستی طرفین
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {contract && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrintModalOpen(true)}
                rightIcon={<Printer className="w-4 h-4" />}
              >
                چاپ / PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAuditModalOpen(true)}
                title="مشاهده لاگ رخدادها"
                className="text-slate-600 hover:bg-slate-100"
              >
                <History className="w-4 h-4" />
              </Button>
            </>
          )}

          {isIssued && contract?.status !== 'active' && contract?.status !== 'completed' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setApprovalModalOpen(true)}
              rightIcon={<UserCheck className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              ثبت تأیید / امضای دستی
            </Button>
          )}

          {isIssued && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVersionModalOpen(true)}
              rightIcon={<GitBranch className="w-4 h-4" />}
              className="text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            >
              ثبت نگارش جدید
            </Button>
          )}

          {contract && contract.status !== 'cancelled' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              className="text-rose-600 hover:bg-rose-50 text-xs"
            >
              فسخ / لغو
            </Button>
          )}
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

      {/* Legal Sample Notice */}
      <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
        <strong>یادداشت:</strong> متن‌ها و مواد این فرم نمونه‌های پیش‌فرض و قابل‌ویرایش آزمایشی هستند و ادعای اعتبار حقوقی قطعی ندارند. لطفاً بندها را متناسب با توافقات فنی تنظیم فرمایید.
      </div>

      {/* Contract Version History Cards if any */}
      {contract?.versions && contract.versions.length > 0 && (
        <Card variant="default" className="p-4 bg-slate-50 border-slate-200 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <GitBranch className="w-4 h-4 text-indigo-600" />
            <span>تاریخچه نگارش‌های قبلی ({contract.versions.length} نگارش ذخیره‌شده)</span>
          </div>
          <div className="space-y-1 text-slate-600">
            {contract.versions.map((v, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800">نسخه {v.versionNumber}:</span> {v.changeSummary}
                </div>
                <span className="font-mono text-[11px] text-slate-500">{toPersianDigits(v.updatedAtJalali)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Contract Form Card */}
      <Card variant="default" className="p-4 sm:p-6 space-y-5">

        {/* Subject */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            موضوع قرارداد <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
          />
        </div>

        {/* Scope & Deliverables */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              محدوده و شرح خدمات <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={scopeOfServices}
              onChange={(e) => setScopeOfServices(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسناد و تحویل‌دادنی‌ها <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>
        </div>

        {/* Dates & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <PersianDateInput id="contract-start-date" label="تاریخ شروع عملیات (شمسی)" required
              value={startDateJalali}
              onChange={setStartDateJalali} helperText="قالب: سال/ماه/روز" />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              مدت زمان اجرا و تحویل
            </label>
            <input
              type="text"
              value={durationDaysOrMonths}
              onChange={(e) => setDurationDaysOrMonths(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              مبلغ کل قرارداد (تومان) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={totalAmount || ''}
              onChange={(e) => setTotalAmount(Number(toEnglishDigits(e.target.value)))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
            <span className="text-[10px] text-teal-800 font-bold block mt-1 truncate">
              {numberToPersianWords(totalAmount)}
            </span>
          </div>
        </div>

        {/* Obligations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تعهدات مهندس نقشه‌بردار
            </label>
            <textarea
              value={surveyorObligations}
              onChange={(e) => setSurveyorObligations(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تعهدات کارفرما
            </label>
            <textarea
              value={clientObligations}
              onChange={(e) => setClientObligations(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>
        </div>

        {/* Conditions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              شرایط تغییر محدوده و عوارض
            </label>
            <textarea
              value={scopeChangeTerms}
              onChange={(e) => setScopeChangeTerms(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              شرایط تأخیرات و حوادث
            </label>
            <textarea
              value={delayTerms}
              onChange={(e) => setDelayTerms(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              فسخ و حل اختلاف
            </label>
            <textarea
              value={disputeResolution}
              onChange={(e) => setDisputeResolution(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>
        </div>

        {/* Additional Clauses / Sections */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            توضیحات تکمیلی و پیوست‌ها
          </label>
          <textarea
            value={notesAndAttachments}
            onChange={(e) => setNotesAndAttachments(e.target.value)}
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            placeholder="پیوست نقشه‌های هوایی، مستندات مرجع، لیست تجهیزات..."
          />
        </div>

        {/* Inactive Future Feature Badge */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-slate-400" />
            <span>امضای الکترونیکی / دیجیتال</span>
          </div>
          <Badge variant="neutral" size="sm">قابل افزودن در نسخه آینده</Badge>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 flex-wrap">
          <Button
            variant="outline"
            size="md"
            onClick={handleSaveDraft}
            disabled={isSaving}
            rightIcon={<Save className="w-4 h-4" />}
          >
            {isSaving ? 'در حال ذخیره...' : 'ذخیره پیش‌نویس'}
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={contract?.documentNumber ? handleIssue : handlePreviewForIssue}
            disabled={isSaving}
            rightIcon={<Send className="w-4 h-4" />}
            className="bg-[#0B1D35] hover:bg-[#0B1D35]/90 text-white font-bold"
          >
            {contract?.documentNumber ? 'به‌روزرسانی قرارداد' : 'پیش‌نمایش قبل از صدور'}
          </Button>
        </div>

      </Card>

      {/* New Version Modal */}
      <Modal
        isOpen={versionModalOpen}
        onClose={() => setVersionModalOpen(false)}
        title="ثبت نگارش جدید از قرارداد صادرشده"
        size="sm"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <p className="text-xs text-slate-600 leading-relaxed">
            با ثبت نگارش جدید، نسخه فعلی در تاریخچه سند بایگانی شده و نگارش شماره <strong>{(contract?.currentVersion || 1) + 1}</strong> فعال می‌گردد.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              خلاصه تغییرات این نگارش <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={newVersionSummary}
              onChange={(e) => setNewVersionSummary(e.target.value)}
              placeholder="مثال: اصلاح زمان‌بندی تحویل و افزودن تبصره نقشه‌های هوایی"
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setVersionModalOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAsNewVersion}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              ثبت قطعی نگارش جدید
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancellation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="لغو یا فسخ قرارداد"
        size="sm"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              علت لغو یا فسخ قرارداد <span className="text-rose-500">*</span>
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
              تاریخ شمسی اقدام
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
              تأیید فسخ / لغو
            </Button>
          </div>
        </div>
      </Modal>

      {/* Print / PDF Modal */}
      <DocumentPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        documentType="contract"
        contract={contract}
        onIssueAfterPdfPreflight={contract?.documentNumber?undefined:handleIssue}
      />

      {/* Manual Approval Modal */}
      <ManualApprovalModal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        onConfirm={handleConfirmManualApproval}
        documentTitle={`قرارداد ${contract?.documentNumber || ''}`}
        defaultApproverName={project.clientSnapshot.type === 'legal' ? project.clientSnapshot.representativeName || project.clientSnapshot.companyName : project.clientSnapshot.fullName}
      />

      {/* Audit Modal */}
      {contract && (
        <DocumentAuditModal
          isOpen={auditModalOpen}
          onClose={() => setAuditModalOpen(false)}
          documentId={contract.id}
          documentTitle={`قرارداد ${contract.documentNumber || ''}`}
        />
      )}

    </div>
  );
};
