import React, { useState } from 'react';
import { Star, Send, ShieldCheck, CheckCircle2, MessageSquare } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { User } from '../../models/User';
import { SurveyorPublicProfile } from '../../models/Stage6Models';
import { surveyorReviewsRepository, surveyorSelectionsRepository } from '../../repositories';
import { getErrorMessage } from '../../utils/errors';

export interface SubmitReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyor: SurveyorPublicProfile | null;
  clientUser: User;
  onSuccess?: () => void;
}

export const SubmitReviewModal: React.FC<SubmitReviewModalProps> = ({
  isOpen,
  onClose,
  surveyor,
  clientUser,
  onSuccess,
}) => {
  const [overallRating, setOverallRating] = useState(5);
  const [accuracy, setAccuracy] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [pricingFairness, setPricingFairness] = useState(5);
  const [projectType, setProjectType] = useState('تهیه نقشه یو‌تی‌ام و امور ثبتی');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!surveyor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const actor = { userId: clientUser.id, role: 'client' as const, environment: 'demo' as const };
      const selections = await surveyorSelectionsRepository.getSelectionsForClient(actor);
      const completed = selections.find((item) => item.surveyorId === surveyor.userId && item.status === 'completed');
      if (!completed) throw new Error('امتیاز فقط پس از وضعیت همکاری انجام‌شده مجاز است.');
      await surveyorReviewsRepository.submitReview(actor, {
        surveyorId: surveyor.userId,
        clientId: clientUser.id,
        clientName: clientUser.fullName,
        selectionId: completed.id,
        overallRating,
        ratings: {
          accuracy,
          punctuality,
          communication,
          pricingFairness,
        },
        projectType,
        comment: comment.trim(),
      });

      setIsDone(true);
      if (onSuccess) onSuccess();
    } catch (e) {
      setErrorMessage(getErrorMessage(e, 'ثبت نظر انجام نشد.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAndReset = () => {
    setIsDone(false);
    onClose();
  };

  const renderStarSelector = (
    label: string,
    value: number,
    onChange: (v: number) => void
  ) => (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-b-0 text-xs">
      <span className="text-slate-700 font-medium">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-110 transition-transform cursor-pointer"
          >
            <Star
              className={`w-5 h-5 ${
                star <= value ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
              }`}
            />
          </button>
        ))}
        <span className="font-mono font-bold text-[#0B1D35] mr-1 w-4 text-center">
          {value}
        </span>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseAndReset}
      title={isDone ? 'امتیاز شما ثبت شد' : `ثبت نظر و امتیاز برای ${surveyor.fullName}`}
    >
      <div dir="rtl" className="space-y-4 pt-1">
        {isDone ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="text-base font-black text-slate-900">با تشکر از ثبت بازخورد شما</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                نظر و امتیاز شما با موفقیت در پروفایل عمومی مهندس {surveyor.fullName} ثبت گردید و به سایر کارفرمایان در انتخاب کارشناس شایسته کمک خواهد کرد.
              </p>
            </div>

            <div className="pt-2">
              <Button variant="primary" onClick={handleCloseAndReset} className="w-full">
                بستن و ادامه
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{errorMessage}</div>}
            
            {/* Overall Rating Box */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-center space-y-2">
              <span className="text-xs font-bold text-slate-800 block">امتیاز رضایت کلی شما:</span>
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallRating(star)}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= overallRating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-mono font-bold text-amber-900 block">
                {overallRating} از ۵ ستاره
              </span>
            </div>

            {/* Criteria Breakdowns */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
              <h5 className="text-xs font-bold text-slate-900 mb-1.5">ارزیابی بر اساس معیارهای فنی و رفتاری:</h5>
              {renderStarSelector('دقت فنی نقشه، پیاده‌سازی و برداشت', accuracy, setAccuracy)}
              {renderStarSelector('تعهد زمانی و تحویل به‌موقع کار', punctuality, setPunctuality)}
              {renderStarSelector('پاسخگویی، برخورد و اخلاق حرفه‌ای', communication, setCommunication)}
              {renderStarSelector('منصفانه بودن تعرفه نسبت به کیفیت', pricingFairness, setPricingFairness)}
            </div>

            <Input
              label="نوع خدمت یا پروژه انجام شده *"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              placeholder="مثال: نقشه یو‌تی‌ام UTM سند / نقشه‌برداری هوایی با پهپاد"
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                متن نظر و تجربه همکاری شما با این نقشه‌بردار *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="لطفاً نقاط قوت، دقت عملکرد، رفتار حرفه‌ای یا هر تجربه‌ای که برای سایر کارفرمایان مفید است را بنویسید..."
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1D35] outline-hidden text-slate-800 leading-relaxed"
                required
              />
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
                ثبت دیدگاه و امتیاز
              </Button>
            </div>

          </form>
        )}
      </div>
    </Modal>
  );
};
