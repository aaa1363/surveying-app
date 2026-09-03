import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  Send,
  Printer,
  History,
  PhoneCall,
  XCircle,
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { SurveyProject, User, ProformaInvoice, ProformaStatus, DocumentPartySnapshot } from '../../../models';
import {
  proformaRepository,
  profileRepository,
  projectPricingRepository,
} from '../../../repositories';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { LoadingState } from '../../../components/ui/LoadingState';
import { DocumentPrintModal } from './DocumentPrintModal';
import { ManualApprovalModal } from './ManualApprovalModal';
import { DocumentAuditModal } from './DocumentAuditModal';
import {PersianDateInput} from '../../../components/ui/PersianDateInput';
import { formatToman, numberToPersianWords, toPersianDigits, toEnglishDigits } from '../../../utils/formatters';
import { getCurrentJalaliDate, isValidJalaliDate } from '../../../utils/jalaliDate';
import { getSubServiceLabel } from '../../../data/servicesCatalog';

interface ProformaTabProps {
  project: SurveyProject;
  user: User;
}

export const ProformaTab: React.FC<ProformaTabProps> = ({ project, user }) => {
  const [proforma, setProforma] = useState<ProformaInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [serviceDescription, setServiceDescription] = useState('');
  const [issueDateJalali, setIssueDateJalali] = useState(getCurrentJalaliDate());
  const [validityDateJalali, setValidityDateJalali] = useState('');
  const [totalProposedAmount, setTotalProposedAmount] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState('۳۰٪ پیش‌پرداخت، ۵۰٪ پس از برداشت زمینی و ۲۰٪ هنگام تحویل نهایی مدارک');
  const [estimatedDuration, setEstimatedDuration] = useState('۷ روز کاری پس از تحویل زمین');
  const [notes, setNotes] = useState('');

  // Modals
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDate, setCancelDate] = useState(getCurrentJalaliDate());

  // Pricing pull notice
  const [pricingReadNotice, setPricingReadNotice] = useState<string | null>(null);

  const loadProformaData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const existing = await proformaRepository.getProforma(user.id, project.id);
      if (existing) {
        setProforma(existing);
        setServiceDescription(existing.serviceDescription || '');
        setIssueDateJalali(existing.issueDateJalali || getCurrentJalaliDate());
        setValidityDateJalali(existing.validityDateJalali || '');
        setTotalProposedAmount(existing.totalProposedAmount || 0);
        setPaymentTerms(existing.paymentTerms || '');
        setEstimatedDuration(existing.estimatedDuration || '');
        setNotes(existing.notes || '');
      } else {
        // Build initial draft default
        const serviceTitle = getSubServiceLabel(
          project.services.mainCategoryId,
          project.services.primarySubServiceId
        );
        setServiceDescription(`انجام خدمات مهندسی نقشه‌برداری در موضوع «${serviceTitle}» واقع در استان ${project.location.province}، شهر ${project.location.city}`);
        setIssueDateJalali(getCurrentJalaliDate());
        setValidityDateJalali('');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات پیش‌فاکتور');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProformaData();
  }, [project.id, user.id]);

  const handlePullPricing = async () => {
    try {
      const estimate = await projectPricingRepository.getEstimate(user.id, project.id);
      if (estimate && estimate.finalPrice > 0) {
        setTotalProposedAmount(estimate.finalPrice);
        setPricingReadNotice(`مبلغ پیشنهادی (${formatToman(estimate.finalPrice)}) از مرحله قیمت‌گذاری فراخوانی شد.`);
      } else {
        setPricingReadNotice('هنوز برای این پروژه برآورد قیمتی در مرحله قیمت‌گذاری ثبت نشده است.');
      }
    } catch {
      setPricingReadNotice('خطا در دریافت اطلاعات برآورد قیمت.');
    }
  };

  const createPartySnapshot = async (): Promise<DocumentPartySnapshot> => {
    const profile = await profileRepository.getProfile(user.id);
    const warnings: string[] = [];

    if (!user.phone) warnings.push('شماره تماس نقشه‌بردار در نمایه ثبت نشده است.');
    if (!profile?.engineerLicenseNumber && !profile?.judicialExpertNumber) {
      warnings.push('شماره پروانه یا کارشناسی نقشه‌بردار ثبت نشده است.');
    }

    if (project.clientSnapshot.type === 'legal') {
      if (!project.clientSnapshot.companyName) warnings.push('نام شرکت کارفرما ثبت نشده است.');
      if (!project.clientSnapshot.phone) warnings.push('شماره تماس شرکت ثبت نشده است.');
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
      const draft: ProformaInvoice = {
        id: proforma?.id || `pf-${project.id}-${Date.now()}`,
        userId: user.id,
        projectId: project.id,
        documentNumber: proforma?.documentNumber,
        projectTitle: project.title,
        partySnapshot,
        serviceDescription,
        issueDateJalali,
        validityDateJalali: validityDateJalali || issueDateJalali,
        totalProposedAmount: Number(totalProposedAmount) || 0,
        paymentTerms,
        estimatedDuration,
        notes,
        status: proforma?.status || 'draft',
        version: proforma?.version || 1,
        currency: 'TOMAN',
        schemaVersion: 1,
        createdAt: proforma?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await proformaRepository.saveProforma(draft);
      setProforma(saved);
      setSuccessMessage('پیش‌نویس پیش‌فاکتور با موفقیت ذخیره شد (شماره سند هنگام صدور تولید می‌گردد).');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره پیش‌فاکتور');
    } finally {
      setIsSaving(false);
    }
  };

  const handleIssue = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const issued = await proformaRepository.issueProforma(user.id, project.id, issueDateJalali);
      setProforma(issued);
      setSuccessMessage(`پیش‌فاکتور با شماره سند ${issued.documentNumber} صادر گردید.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در صدور پیش‌فاکتور');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewForIssue = async () => {
    const val = isValidJalaliDate(issueDateJalali);
    if (!val.isValid) {
      setError(val.error || 'تاریخ صدور معتبر نیست.');
      return;
    }

    if (totalProposedAmount <= 0) {
      setError('لطفاً مبلغ کل پیشنهادی را وارد فرمایید.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // First ensure draft is saved
      await handleSaveDraft();
      setPrintModalOpen(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در صدور پیش‌فاکتور');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmManualApproval = async (approval: any) => {
    try {
      const updated = await proformaRepository.recordManualApproval(user.id, project.id, approval);
      setProforma(updated);
      setSuccessMessage('تأییدیه هماهنگی تلفنی/دستی با کارفرما ثبت شد.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت تأییدیه');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      setError('علت لغو پیش‌فاکتور باید قید گردد.');
      return;
    }
    try {
      const cancelled = await proformaRepository.cancelProforma(user.id, project.id, cancelReason, cancelDate);
      setProforma(cancelled);
      setCancelModalOpen(false);
      setSuccessMessage('پیش‌فاکتور لغو شد.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در لغو پیش‌فاکتور');
    }
  };

  if (isLoading) {
    return <LoadingState message="در حال بارگذاری اطلاعات پیش‌فاکتور..." className="py-12" />;
  }

  const getStatusBadge = (status?: ProformaStatus) => {
    switch (status) {
      case 'draft':
        return <Badge variant="neutral" size="sm">پیش‌نویس</Badge>;
      case 'issued':
        return <Badge variant="info" size="sm">صادرشده</Badge>;
      case 'phone_approved':
        return <Badge variant="success" size="sm">تأیید تلفنی کارفرما</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="sm">ردشده</Badge>;
      case 'expired':
        return <Badge variant="warning" size="sm">منقضی</Badge>;
      case 'cancelled':
        return <Badge variant="neutral" size="sm">لغوشده</Badge>;
      default:
        return <Badge variant="neutral" size="sm">در حال تنظیم</Badge>;
    }
  };

  const clientTitle = project.clientSnapshot.type === 'legal'
    ? project.clientSnapshot.companyName || 'کارفرمای حقوقی'
    : project.clientSnapshot.fullName || 'کارفرمای حقیقی';

  return (
    <div className="space-y-6 text-right" dir="rtl">

      {/* Top Banner & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                پیش‌فاکتور و پیشنهاد قیمت
              </h3>
              {proforma?.documentNumber ? (
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 bg-[#0B1D35] text-white rounded-md">
                  {proforma.documentNumber}
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-mono">پیش‌نویس بدون شماره</span>
              )}
              {getStatusBadge(proforma?.status)}
              {proforma?.documentNumber && <Badge variant="neutral" size="sm">نسخه {toPersianDigits(proforma.version)}</Badge>}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              کارفرما: <strong className="text-slate-800">{clientTitle}</strong> | پروژه: <strong className="text-slate-800">{project.title}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {proforma && (
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
                title="مشاهده تاریخچه و رخدادها"
                className="text-slate-600 hover:bg-slate-100"
              >
                <History className="w-4 h-4" />
              </Button>
            </>
          )}

          {proforma?.status === 'issued' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setApprovalModalOpen(true)}
              rightIcon={<PhoneCall className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              ثبت تأیید تلفنی
            </Button>
          )}

          {proforma && proforma.status !== 'cancelled' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              className="text-rose-600 hover:bg-rose-50 text-xs"
            >
              لغو سند
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

      {proforma?.revisions && proforma.revisions.length > 0 && (
        <Card variant="default" className="p-3 text-xs space-y-2">
          <strong>تاریخچه نسخه‌های قبلی</strong>
          {proforma.revisions.map((revision) => (
            <div key={revision.revision} className="flex justify-between gap-3 bg-slate-50 rounded-lg p-2">
              <span>نسخه {toPersianDigits(revision.revision)} — {revision.documentNumber}</span>
              <span className="font-mono">{formatToman(revision.snapshot.totalProposedAmount)}</span>
            </div>
          ))}
        </Card>
      )}

      {/* Snapshot Warnings */}
      {proforma?.partySnapshot?.validationWarnings && proforma.partySnapshot.validationWarnings.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
          <strong className="font-bold block">هشدارهای مشخصات سند:</strong>
          <ul className="list-disc list-inside space-y-0.5 text-amber-800">
            {proforma.partySnapshot.validationWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Form Fields Card */}
      <Card variant="default" className="p-4 sm:p-6 space-y-5">

        {/* Service Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            شرح کلی خدمات پیشنهادی <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={serviceDescription}
            onChange={(e) => setServiceDescription(e.target.value)}
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            placeholder="شرح عملیات نقشه‌برداری، تحویل‌دادنی‌ها و حوزه کار..."
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PersianDateInput id="proforma-issue-date" label="تاریخ صدور شمسی" required
              value={issueDateJalali}
              onChange={setIssueDateJalali} helperText="قالب: سال/ماه/روز" />

          <PersianDateInput id="proforma-validity-date" label="تاریخ اعتبار پیشنهاد قیمت (شمسی)"
              value={validityDateJalali}
              onChange={setValidityDateJalali} helperText="اختیاری" />
        </div>

        {/* Total Proposed Price with Pricing Engine Integration */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-black text-slate-900">
                مبلغ کل پیشنهادی (تومان) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                فقط مبلغ کلی در پیش‌فاکتور درج می‌شود و ریزهزینه‌های داخلی افشا نخواهد شد.
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handlePullPricing}
              rightIcon={<Calculator className="w-3.5 h-3.5" />}
              className="text-teal-700 border-teal-300 hover:bg-teal-50 text-xs self-start sm:self-auto"
            >
              فراخوانی مبلغ از برآورد قیمت
            </Button>
          </div>

          {pricingReadNotice && (
            <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-lg text-xs text-teal-900">
              {pricingReadNotice}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <input
              type="number"
              min={0}
              value={totalProposedAmount || ''}
              onChange={(e) => setTotalProposedAmount(Number(toEnglishDigits(e.target.value)))}
              placeholder="مثال: ۱۵۰۰۰۰۰۰"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0B1D35]"
            />
            <div className="text-xs text-slate-700 space-y-0.5">
              <div>به عدد: <strong className="font-mono text-slate-900">{formatToman(totalProposedAmount)}</strong></div>
              <div>به حروف: <span className="font-bold text-teal-800">{numberToPersianWords(totalProposedAmount)}</span></div>
            </div>
          </div>
        </div>

        {/* Terms & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              شرایط پرداخت
            </label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="شرایط و درصد‌های پرداخت..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              مدت تقریبی انجام عملیات
            </label>
            <input
              type="text"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              placeholder="مثال: ۱۰ روز کاری"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            توضیحات تکمیلی (اختیاری)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            placeholder="نکات خاص فنی، تجهیزات یا الزامات کارگاهی..."
          />
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
            onClick={proforma?.documentNumber ? handleIssue : handlePreviewForIssue}
            disabled={isSaving}
            rightIcon={<Send className="w-4 h-4" />}
            className="bg-[#0B1D35] hover:bg-[#0B1D35]/90 text-white font-bold"
          >
            {proforma?.documentNumber ? 'به‌روزرسانی و صدور' : 'پیش‌نمایش قبل از صدور'}
          </Button>
        </div>

      </Card>

      {/* Cancellation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="لغو پیش‌فاکتور"
        size="sm"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <p className="text-xs text-slate-600 leading-relaxed">
            با لغو این پیش‌فاکتور، وضعیت سند به «لغوشده» تغییر یافته و در لاگ رخدادها ثبت می‌گردد. سند صادرشده حذف فیزیکی نخواهد شد.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              علت لغو <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="علت لغو پیشنهاد قیمت یا عدم توافق کارفرما..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تاریخ شمسی لغو
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

      {/* Print / PDF Modal */}
      <DocumentPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        documentType="proforma"
        proforma={proforma}
        onIssueAfterPdfPreflight={proforma?.documentNumber?undefined:handleIssue}
      />

      {/* Manual Approval Modal */}
      <ManualApprovalModal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        onConfirm={handleConfirmManualApproval}
        documentTitle={`پیش‌فاکتور ${proforma?.documentNumber || ''}`}
        defaultApproverName={clientTitle}
      />

      {/* Audit Modal */}
      {proforma && (
        <DocumentAuditModal
          isOpen={auditModalOpen}
          onClose={() => setAuditModalOpen(false)}
          documentId={proforma.id}
          documentTitle={`پیش‌فاکتور ${proforma.documentNumber || ''}`}
        />
      )}

    </div>
  );
};
