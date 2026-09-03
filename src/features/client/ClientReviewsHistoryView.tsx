import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CornerDownLeft, ShieldCheck, CheckCircle2, Building } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { User } from '../../models/User';
import { SurveyorReview } from '../../models/Stage6Models';
import { surveyorReviewsRepository } from '../../repositories';
import { toPersianDigits } from '../../utils/formatters';

export interface ClientReviewsHistoryViewProps {
  clientUser: User;
  onBrowseSurveyors?: () => void;
}

export const ClientReviewsHistoryView: React.FC<ClientReviewsHistoryViewProps> = ({
  clientUser,
  onBrowseSurveyors,
}) => {
  const [reviews, setReviews] = useState<SurveyorReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await surveyorReviewsRepository.getReviewsByClient({ userId: clientUser.id, role: 'client', environment: 'demo' });
      setReviews(data);
    } catch (e) {
      console.error('Failed to load client reviews:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clientUser.id]);

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-slate-500">در حال بارگذاری نظرات شما...</div>;
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="w-10 h-10 text-slate-400" />}
        title="هنوز هیچ نظری ثبت نکرده‌اید"
        description="پس از همکاری با مهندسان نقشه‌بردار، تجربیات و امتیازهای شما در این بخش قابل مشاهده خواهد بود."
        actionText="مشاهده بانک نقشه‌برداران"
        onAction={onBrowseSurveyors}
      />
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
          نظرات و امتیازهای ثبت‌شده توسط شما ({toPersianDigits(reviews.length)})
        </h3>
        <Badge variant="demo" size="sm">
          تأثیرگذار بر رتبه‌بندی
        </Badge>
      </div>

      <div className="space-y-3">
        {reviews.map((rev) => (
          <Card key={rev.id} variant="default" className="p-4 sm:p-5 space-y-3">
            
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">خدمت: {rev.projectType}</span>
                  <div className="flex items-center gap-0.5 text-amber-500">
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
                <div className="text-xs text-slate-500 mt-0.5">
                  تاریخ ثبت: <span className="font-mono">{rev.createdAtJalali}</span>
                </div>
              </div>

              <Badge variant="success" size="sm">
                تأیید و منتشرشده
              </Badge>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              {rev.comment}
            </p>

            {/* Surveyor reply if present */}
            {rev.surveyorReply && (
              <div className="bg-teal-50/80 border border-teal-100 rounded-xl p-3 text-xs space-y-1 mr-4">
                <div className="flex items-center justify-between text-teal-900 font-bold">
                  <span className="flex items-center gap-1.5">
                    <CornerDownLeft className="w-3.5 h-3.5 text-teal-700" />
                    پاسخ مهندس نقشه‌بردار:
                  </span>
                  <span className="font-mono text-[10px] text-teal-700">{rev.surveyorReply.replyDateJalali}</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{rev.surveyorReply.text}</p>
              </div>
            )}

          </Card>
        ))}
      </div>
    </div>
  );
};
