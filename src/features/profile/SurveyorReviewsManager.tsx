import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CornerDownLeft, AlertTriangle, ShieldCheck, CheckCircle2, UserCheck, Flag } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { EmptyState } from '../../components/ui/EmptyState';
import { User } from '../../models/User';
import { SurveyorReview, ReviewAggregate } from '../../models/Stage6Models';
import { surveyorReviewsRepository } from '../../repositories';
import { toJalaliDate } from '../../utils/jalaliDate';
import { toPersianDigits } from '../../utils/formatters';

export interface SurveyorReviewsManagerProps {
  user: User;
}

export const SurveyorReviewsManager: React.FC<SurveyorReviewsManagerProps> = ({ user }) => {
  const [reviews, setReviews] = useState<SurveyorReview[]>([]);
  const [aggregate, setAggregate] = useState<ReviewAggregate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Reply modal
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [activeReviewForReply, setActiveReviewForReply] = useState<SurveyorReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // Report modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeReviewForReport, setActiveReviewForReport] = useState<SurveyorReview | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [revs, agg] = await Promise.all([
        surveyorReviewsRepository.getReviewsForSurveyor(user.id, { userId: user.id, role: user.role, environment: 'demo' }, false),
        surveyorReviewsRepository.getReviewAggregate(user.id),
      ]);
      setReviews(revs);
      setAggregate(agg);
    } catch (e) {
      console.error('Failed to load reviews:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  const handleOpenReply = (review: SurveyorReview) => {
    setActiveReviewForReply(review);
    setReplyText(review.surveyorReply?.text || '');
    setReplyModalOpen(true);
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReviewForReply || !replyText.trim()) return;
    setIsReplying(true);
    try {
      const now = new Date();
      const jalali = toJalaliDate(now);
      await surveyorReviewsRepository.replyToReview(activeReviewForReply.id, replyText.trim(), jalali);
      setReplyModalOpen(false);
      await loadData();
    } catch (e) {
      console.error('Failed to save reply:', e);
    } finally {
      setIsReplying(false);
    }
  };

  const handleOpenReport = (review: SurveyorReview) => {
    setActiveReviewForReport(review);
    setReportReason('');
    setReportModalOpen(true);
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReviewForReport || !reportReason.trim()) return;
    setIsReporting(true);
    try {
      await surveyorReviewsRepository.reportReview(activeReviewForReport.id, reportReason.trim());
      setReportModalOpen(false);
      await loadData();
    } catch (e) {
      console.error('Failed to submit report:', e);
    } finally {
      setIsReporting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-500">در حال بارگذاری نظرات و بازخوردها...</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">

      {/* Aggregate Overview Card */}
      {aggregate && aggregate.totalReviews > 0 && (
        <Card variant="engineering" className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">

            {/* Average Score Block */}
            <div className="text-center md:border-l md:border-slate-200 md:pl-6 space-y-2">
              <span className="text-xs text-slate-500 font-semibold block">میانگین امتیاز کلی</span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-black text-[#0B1D35] font-mono">
                  {aggregate.averageRating}
                </span>
                <span className="text-xs text-slate-400">از ۵</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(aggregate.averageRating)
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-600 block">
                بر اساس {toPersianDigits(aggregate.totalReviews)} نظر ثبت‌شده کارفرمایان
              </span>
            </div>

            {/* Criteria Breakdown */}
            <div className="space-y-2.5 md:col-span-2">
              <h4 className="text-xs font-bold text-slate-800 mb-2">امتیاز تفکیکی بر اساس معیارهای سنجش کیفیت:</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">دقت فنی نقشه و پیاده‌سازی</span>
                    <span className="font-bold text-[#0B1D35] font-mono">{aggregate.categoryAverages.accuracy} / ۵</span>
                  </div>
                  <ProgressBar
                    percentage={(aggregate.categoryAverages.accuracy / 5) * 100}
                    color="emerald"
                    size="sm"
                    showPercentText={false}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">تعهد زمانی و تحویل به‌موقع</span>
                    <span className="font-bold text-[#0B1D35] font-mono">{aggregate.categoryAverages.punctuality} / ۵</span>
                  </div>
                  <ProgressBar
                    percentage={(aggregate.categoryAverages.punctuality / 5) * 100}
                    color="emerald"
                    size="sm"
                    showPercentText={false}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">پاسخگویی و اخلاق حرفه‌ای</span>
                    <span className="font-bold text-[#0B1D35] font-mono">{aggregate.categoryAverages.communication} / ۵</span>
                  </div>
                  <ProgressBar
                    percentage={(aggregate.categoryAverages.communication / 5) * 100}
                    color="emerald"
                    size="sm"
                    showPercentText={false}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">منصفانه بودن تعرفه خدمات</span>
                    <span className="font-bold text-[#0B1D35] font-mono">{aggregate.categoryAverages.pricingFairness} / ۵</span>
                  </div>
                  <ProgressBar
                    percentage={(aggregate.categoryAverages.pricingFairness / 5) * 100}
                    color="emerald"
                    size="sm"
                    showPercentText={false}
                  />
                </div>
              </div>

            </div>

          </div>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">
            دیدگاه‌ها و بازخوردهای دریافتی ({reviews.length})
          </h3>
          <Badge variant="demo" size="sm">
            شفافیت و پاسخگویی
          </Badge>
        </div>

        {reviews.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-10 h-10 text-slate-400" />}
            title="هنوز نظری برای شما ثبت نشده است"
            description="پس از انجام پروژه‌ها و تعامل با کارفرمایان، نظرات و امتیازهای آن‌ها در این بخش قرار می‌گیرد."
          />
        ) : (
          reviews.map((rev) => (
            <Card key={rev.id} variant="default" className="p-4 sm:p-5 space-y-3">

              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{rev.clientName}</span>
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.overallRating ? 'fill-amber-400 text-amber-500' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>نوع پروژه: <span className="text-slate-700 font-medium">{rev.projectType}</span></span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">{rev.createdAtJalali}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {rev.isReported && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Flag className="w-3 h-3 text-amber-600" />
                      در حال بررسی نظارتی
                    </span>
                  )}
                  <button
                    onClick={() => handleOpenReport(rev)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs"
                    title="گزارش نظر نامربوط یا توهین‌آمیز به مدیریت سامانه"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Comment Content */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                {rev.comment}
              </p>

              {/* Existing Reply or Reply Button */}
              {rev.surveyorReply ? (
                <div className="bg-teal-50/80 border border-teal-100 rounded-xl p-3 text-xs space-y-1.5 mr-4 sm:mr-6">
                  <div className="flex items-center justify-between text-teal-900 font-bold">
                    <span className="flex items-center gap-1.5">
                      <CornerDownLeft className="w-3.5 h-3.5 text-teal-700" />
                      پاسخ شما به عنوان نقشه‌بردار:
                    </span>
                    <span className="font-mono text-[10px] font-normal text-teal-700">
                      {rev.surveyorReply.replyDateJalali}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {rev.surveyorReply.text}
                  </p>
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => handleOpenReply(rev)}
                      className="text-[11px] text-teal-700 hover:underline cursor-pointer"
                    >
                      ویرایش پاسخ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenReply(rev)}
                    rightIcon={<CornerDownLeft className="w-3.5 h-3.5 text-teal-600" />}
                  >
                    پاسخ به این نظر
                  </Button>
                </div>
              )}

            </Card>
          ))
        )}
      </div>

      {/* Reply Modal */}
      <Modal
        isOpen={replyModalOpen}
        onClose={() => setReplyModalOpen(false)}
        title="ارسال پاسخ به نظر کارفرما"
      >
        <form onSubmit={handleSaveReply} className="space-y-4 pt-1" dir="rtl">
          {activeReviewForReply && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900">{activeReviewForReply.clientName}:</span>
              <p className="line-clamp-2 italic">«{activeReviewForReply.comment}»</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              متن پاسخ شما (در پروفایل عمومی نمایش داده می‌شود) *
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              placeholder="با تشکر از همکاری صمیمانه..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1D35] outline-hidden text-slate-800 leading-relaxed"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setReplyModalOpen(false)}>
              انصراف
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isReplying}>
              ثبت و انتشار پاسخ
            </Button>
          </div>
        </form>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="گزارش بازبینی نظر به مدیریت سامانه"
      >
        <form onSubmit={handleSaveReport} className="space-y-4 pt-1" dir="rtl">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <span className="font-bold">توجه:</span>
            <p>
              در صورتی که نظر حاوی اطلاعات نادرست، تبلیغات نامربوط یا کلمات غیراخلاقی است، دلیل خود را بنویسید تا توسط مدیر سامانه بررسی شود.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">دلیل گزارش تخلف *</label>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
              placeholder="شرح دلیل درخواست حذف یا بررسی نظر..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1D35] outline-hidden text-slate-800"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setReportModalOpen(false)}>
              انصراف
            </Button>
            <Button variant="danger" size="sm" type="submit" isLoading={isReporting}>
              ارسال گزارش به مدیر
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
