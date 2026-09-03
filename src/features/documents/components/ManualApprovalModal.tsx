import React, { useState } from 'react';
import { PhoneCall, UserCheck, FileCheck, AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { ManualApproval, ManualApprovalType } from '../../../models';
import { getCurrentJalaliDate, isValidJalaliDate } from '../../../utils/jalaliDate';

interface ManualApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (approval: ManualApproval) => Promise<void>;
  documentTitle: string;
  defaultApproverName?: string;
}

export const ManualApprovalModal: React.FC<ManualApprovalModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  documentTitle,
  defaultApproverName = '',
}) => {
  const [approverName, setApproverName] = useState(defaultApproverName);
  const [approvalDateJalali, setApprovalDateJalali] = useState(getCurrentJalaliDate());
  const [approvalType, setApprovalType] = useState<ManualApprovalType>('phone');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approverName.trim()) {
      setError('لطفاً نام شخص تأییدکننده را وارد نمایید.');
      return;
    }

    const dateVal = isValidJalaliDate(approvalDateJalali);
    if (!dateVal.isValid) {
      setError(dateVal.error || 'تاریخ شمسی واردشده نامعتبر است.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm({
        approverName: approverName.trim(),
        approvalDateJalali: approvalDateJalali.trim(),
        approvalType,
        notes: notes.trim() || undefined,
        recordedAt: new Date().toISOString(),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت تأییدیه');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ثبت دستی هماهنگی و تأییدیه کارفرما"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-right" dir="rtl">
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 leading-relaxed">
          <p>
            کارفرما دسترسی مستقیم به سامانه ندارد. پس از هماهنگی تلفنی، جلسه حضوری یا دریافت نسخه کاغذی امضاشده، اطلاعات تأیید سند <strong className="font-bold text-[#0B1D35]">«{documentTitle}»</strong> را در این فرم ثبت فرمایید.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Approver Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            نام و نام خانوادگی تأییدکننده / کارفرما <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={approverName}
            onChange={(e) => setApproverName(e.target.value)}
            placeholder="مثال: مهندس احمدی (نماینده تام‌الاختیار)"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            required
          />
        </div>

        {/* Date & Approval Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تاریخ شمسی هماهنگی / تأیید <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={approvalDateJalali}
              onChange={(e) => setApprovalDateJalali(e.target.value)}
              placeholder="۱۴۰۵/۰۶/۱۵"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              نوع و شیوه تأیید <span className="text-rose-500">*</span>
            </label>
            <select
              value={approvalType}
              onChange={(e) => setApprovalType(e.target.value as ManualApprovalType)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            >
              <option value="phone">هماهنگی و تأیید تلفنی</option>
              <option value="in_person">جلسه و توافق حضوری</option>
              <option value="paper_document">سند کاغذی و امضای فیزیکی</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            توضیحات اختیاری هماهنگی
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: در تماس تلفنی ساعت ۱۰ صبح شرایط پرداخت و زمان‌بندی بررسی شد و کارفرما موافقت خود را اعلام نمود."
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            انصراف
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={isSubmitting}
            className="bg-[#0B1D35] hover:bg-[#0B1D35]/90 text-white font-bold"
          >
            {isSubmitting ? 'در حال ثبت...' : 'ثبت قطعی تأییدیه'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
