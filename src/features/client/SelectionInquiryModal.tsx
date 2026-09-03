import React, { useState } from 'react';
import { Send, Phone, MapPin, Calendar, Coins, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { User } from '../../models/User';
import { SurveyorPublicProfile, PublishedPriceCard } from '../../models/Stage6Models';
import { surveyorSelectionsRepository } from '../../repositories';
import { formatPhoneNumber, formatToman } from '../../utils/formatters';

export interface SelectionInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyor: SurveyorPublicProfile | null;
  clientUser: User;
  preselectedPriceCard?: PublishedPriceCard | null;
  onSuccess?: () => void;
}

export const SelectionInquiryModal: React.FC<SelectionInquiryModalProps> = ({
  isOpen,
  onClose,
  surveyor,
  clientUser,
  preselectedPriceCard,
  onSuccess,
}) => {
  const [serviceRequestedTitle, setServiceRequestedTitle] = useState(
    preselectedPriceCard ? preselectedPriceCard.title : 'تهیه نقشه یو‌تی‌ام UTM سند تک‌برگ'
  );
  const [location, setLocation] = useState(surveyor?.city || 'یزد');
  const [approximateBudget, setApproximateBudget] = useState<number | undefined>(
    preselectedPriceCard ? preselectedPriceCard.basePrice : 5000000
  );
  const [preferredDateJalali, setPreferredDateJalali] = useState('۱۴۰۵/۰۱/۱۵');
  const [inquiryNotes, setInquiryNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState<string>('');

  if (!surveyor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await surveyorSelectionsRepository.createSelection({ userId: clientUser.id, role: 'client', environment: 'demo' }, {
        clientId: clientUser.id,
        clientName: clientUser.fullName,
        clientPhone: clientUser.phone,
        surveyorId: surveyor.userId,
        surveyorName: surveyor.fullName,
        serviceRequestedTitle,
        location,
        approximateBudget: approximateBudget ? Number(approximateBudget) : undefined,
        preferredDateJalali: preferredDateJalali || undefined,
        inquiryNotes: inquiryNotes || 'درخواست استعلام تعرفه و هماهنگی جهت بازدید میدانی',
      });

      setSubmittedPhone(created.surveyorPhone || surveyor.phone || '');
      setIsSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (e) {
      console.error('Failed to submit selection inquiry:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setSubmittedPhone('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={isSubmitted ? 'استعلام شما با موفقیت ثبت شد' : `ثبت درخواست استعلام از ${surveyor.fullName}`}
    >
      <div dir="rtl" className="space-y-4 pt-1">
        {isSubmitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="text-base font-black text-slate-900">درخواست استعلام شما ارسال شد</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                مشخصات نیاز نقشه‌برداری شما در کارتابل {surveyor.fullName} ثبت گردید. جهت تسریع در هماهنگی می‌توانید مستقیماً با ایشان تماس تلفنی حاصل فرمایید.
              </p>
            </div>

            {/* Direct Phone Box */}
            {submittedPhone && (
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 max-w-sm mx-auto text-center space-y-1">
                <span className="text-xs text-teal-800 font-semibold block">شماره تماس مستقیم نقشه‌بردار:</span>
                <a
                  href={`tel:${submittedPhone}`}
                  className="text-lg font-bold font-mono text-[#0B1D35] hover:underline inline-flex items-center gap-2"
                  dir="ltr"
                >
                  <Phone className="w-4 h-4 text-teal-600" />
                  {formatPhoneNumber(submittedPhone)}
                </a>
              </div>
            )}

            {/* Security Isolation Notice */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 text-right leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                <strong>ضمانت حریم خصوصی:</strong> این درخواست صرفاً یک رکورد استعلام است و بدون انعقاد قرارداد هیچ تعهد مالی برای شما ایجاد نمی‌کند.
              </span>
            </div>

            <div className="pt-2">
              <Button variant="primary" onClick={handleResetAndClose} className="w-full">
                متوجه شدم و بازگشت به پنل
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Surveyor Summary Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-500">نقشه‌بردار منتخب:</span>
                <div className="font-bold text-slate-900">{surveyor.fullName} ({surveyor.city})</div>
              </div>
              {surveyor.phone ? (
                <div className="text-left font-mono font-bold text-teal-700" dir="ltr">
                  {formatPhoneNumber(surveyor.phone)}
                </div>
              ) : (
                <div className="text-xs text-amber-700 flex items-center gap-1 font-medium">
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>شماره تماس پس از ثبت استعلام نمایش داده می‌شود</span>
                </div>
              )}
            </div>

            <Input
              label="عنوان خدمت مورد نیاز *"
              value={serviceRequestedTitle}
              onChange={(e) => setServiceRequestedTitle(e.target.value)}
              placeholder="مثال: نقشه یو‌تی‌ام سند مسکونی ۴۰۰ متری"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="محل / آدرس ملک یا پروژه *"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="مثال: یزد، صفائیه"
                rightIcon={<MapPin className="w-4 h-4" />}
                required
              />

              <Input
                label="تاریخ پیشنهادی شروع / بازدید میدانی"
                value={preferredDateJalali}
                onChange={(e) => setPreferredDateJalali(e.target.value)}
                placeholder="۱۴۰۵/۰۱/۱۵"
                rightIcon={<Calendar className="w-4 h-4" />}
                dir="ltr"
                className="font-mono text-center"
              />
            </div>

            <Input
              label="بودجه تقریبی پیشنهادی (تومان - اختیاری)"
              type="number"
              value={approximateBudget || ''}
              onChange={(e) => setApproximateBudget(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="مثال: ۵۰۰۰۰۰۰"
              rightIcon={<Coins className="w-4 h-4" />}
              dir="ltr"
              className="font-mono text-center"
              helperText={approximateBudget ? `معادل: ${formatToman(approximateBudget)}` : undefined}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                توضیحات و جزئیات تکمیلی ملک / پروژه
              </label>
              <textarea
                value={inquiryNotes}
                onChange={(e) => setInquiryNotes(e.target.value)}
                rows={3}
                placeholder="مثال: زمین دارای سند دفترچه‌ای قدیمی است، نیاز به استعلام ابعاد و تحدید حدود از اداره ثبت داریم..."
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1D35] outline-hidden text-slate-800 leading-relaxed"
              />
            </div>

            {/* Note */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
              با ثبت این فرم، اطلاعات تماس شما ({clientUser.fullName} - {formatPhoneNumber(clientUser.phone)}) جهت هماهنگی در اختیار مهندس نقشه‌بردار قرار خواهد گرفت.
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={onClose}>
                انصراف
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isSubmitting}
                rightIcon={<Send className="w-4 h-4 text-teal-400" />}
              >
                ارسال درخواست استعلام
              </Button>
            </div>

          </form>
        )}
      </div>
    </Modal>
  );
};
