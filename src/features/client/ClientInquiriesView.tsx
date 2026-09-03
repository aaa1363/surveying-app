import React, { useState, useEffect } from 'react';
import { Send, Phone, MapPin, Calendar, Coins, CheckCircle2, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { User } from '../../models/User';
import { SurveyorSelection, SelectionStatus } from '../../models/Stage6Models';
import { surveyorSelectionsRepository } from '../../repositories';
import { formatToman, toPersianDigits, formatPhoneNumber } from '../../utils/formatters';

export interface ClientInquiriesViewProps {
  clientUser: User;
  onBrowseSurveyors?: () => void;
}

export const ClientInquiriesView: React.FC<ClientInquiriesViewProps> = ({
  clientUser,
  onBrowseSurveyors,
}) => {
  const [inquiries, setInquiries] = useState<SurveyorSelection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await surveyorSelectionsRepository.getSelectionsForClient({ userId: clientUser.id, role: 'client', environment: 'demo' });
      setInquiries(data);
    } catch (e) {
      console.error('Failed to load client inquiries:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clientUser.id]);

  const getStatusBadge = (status: SelectionStatus) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="info" size="sm">ثبت شده / در انتظار تماس</Badge>;
      case 'contacted':
        return <Badge variant="warning" size="sm">تماس حاصل شده</Badge>;
      case 'negotiating':
        return <Badge variant="accent" size="sm">در حال هماهنگی و مذاکره</Badge>;
      case 'completed':
        return <Badge variant="success" size="sm">همکاری انجام‌شده</Badge>;
      case 'archived':
        return <Badge variant="neutral" size="sm">آرشیو شده / خاتمه یافته</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-slate-500">در حال بارگذاری استعلام‌های شما...</div>;
  }

  if (inquiries.length === 0) {
    return (
      <EmptyState
        icon={<Send className="w-10 h-10 text-slate-400" />}
        title="هنوز هیچ استعلامی ثبت نکرده‌اید"
        description="با جستجو در لیست نقشه‌برداران، می‌توانید برای پروژه یا نقشه UTM خود استعلام قیمت و زمان ثبت کنید."
        actionText="مشاهده بانک نقشه‌برداران"
        onAction={onBrowseSurveyors}
      />
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
          سوابق استعلام‌ها و درخواست‌های انتخاب نقشه‌بردار ({toPersianDigits(inquiries.length)})
        </h3>
        <Badge variant="demo" size="sm">
          استعلام مستقیم کارفرما
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {inquiries.map((inq) => (
          <Card key={inq.id} variant="default" className="p-4 space-y-3 hover:border-slate-300 transition-colors">
            
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{inq.serviceRequestedTitle}</h4>
                <div className="text-xs text-slate-500 mt-0.5">
                  نقشه‌بردار: <span className="font-bold text-slate-800">{inq.surveyorName}</span>
                </div>
              </div>
              {getStatusBadge(inq.status)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="line-clamp-1">{inq.location}</span>
              </div>

              {inq.preferredDateJalali && (
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{inq.preferredDateJalali}</span>
                </div>
              )}

              {inq.approximateBudget && (
                <div className="col-span-2 flex items-center gap-1.5 font-mono text-[11px] text-[#0B1D35] font-bold">
                  <Coins className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>بودجه برآوردی: {formatToman(inq.approximateBudget)}</span>
                </div>
              )}
            </div>

            {inq.inquiryNotes && (
              <p className="text-xs text-slate-600 leading-relaxed bg-white p-2 rounded-lg border border-slate-100">
                {inq.inquiryNotes}
              </p>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono">{inq.createdAtJalali}</span>
              <span className="text-teal-700 font-medium">کد رهگیری: {inq.id.slice(-6)}</span>
            </div>

          </Card>
        ))}
      </div>
    </div>
  );
};
