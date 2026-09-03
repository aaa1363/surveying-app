import React, { useState, useEffect } from 'react';
import { Coins, Plus, Trash2, Edit3, CheckCircle2, Clock, ShieldCheck, Tag, Eye, EyeOff } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { User } from '../../models/User';
import { PublishedPriceCard } from '../../models/Stage6Models';
import { publishedPricesRepository } from '../../repositories';
import { formatToman, toPersianDigits } from '../../utils/formatters';

export interface SurveyorPublishedPricesManagerProps {
  user: User;
}

export const SurveyorPublishedPricesManager: React.FC<SurveyorPublishedPricesManagerProps> = ({ user }) => {
  const [cards, setCards] = useState<PublishedPriceCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<PublishedPriceCard | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [serviceCategory, setServiceCategory] = useState('ثبتی و شهرداری');
  const [unit, setUnit] = useState('هر قطعه ملک');
  const [basePrice, setBasePrice] = useState<number>(4000000);
  const [priceRangeMax, setPriceRangeMax] = useState<number | undefined>(6000000);
  const [estimatedTurnaround, setEstimatedTurnaround] = useState('۲ الی ۳ روز کاری');
  const [conditionsStr, setConditionsStr] = useState('');
  const [notes, setNotes] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await publishedPricesRepository.getPriceCardsByUserId(user.id);
      setCards(data);
    } catch (e) {
      console.error('Failed to load published price cards:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  const handleOpenAdd = () => {
    setEditingCard(null);
    setTitle('');
    setServiceCategory('ثبتی و شهرداری');
    setUnit('هر قطعه ملک');
    setBasePrice(4000000);
    setPriceRangeMax(6000000);
    setEstimatedTurnaround('۲ الی ۳ روز کاری');
    setConditionsStr('برداشت با گیرنده شمیم\nتطبیق با اسناد مالکیت\nمهر کارشناس دارای مدرک ثبت‌شده');
    setNotes('');
    setIsPublished(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (card: PublishedPriceCard) => {
    setEditingCard(card);
    setTitle(card.title);
    setServiceCategory(card.serviceCategory);
    setUnit(card.unit);
    setBasePrice(card.basePrice);
    setPriceRangeMax(card.priceRangeMax);
    setEstimatedTurnaround(card.estimatedTurnaround);
    setConditionsStr(card.conditionsAndInclusions.join('\n'));
    setNotes(card.notes || '');
    setIsPublished(card.isPublished);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const conditions = conditionsStr
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      if (editingCard) {
        await publishedPricesRepository.updatePriceCard(editingCard.id, {
          title,
          serviceCategory,
          unit,
          basePrice: Number(basePrice) || 0,
          priceRangeMax: priceRangeMax ? Number(priceRangeMax) : undefined,
          estimatedTurnaround,
          conditionsAndInclusions: conditions,
          notes: notes || undefined,
          isPublished,
        });
      } else {
        await publishedPricesRepository.addPriceCard({
          userId: user.id,
          title,
          serviceCategory,
          unit,
          basePrice: Number(basePrice) || 0,
          priceRangeMax: priceRangeMax ? Number(priceRangeMax) : undefined,
          estimatedTurnaround,
          conditionsAndInclusions: conditions,
          notes: notes || undefined,
          isPublished,
          orderIndex: cards.length + 1,
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (e) {
      console.error('Failed to save price card:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (card: PublishedPriceCard) => {
    try {
      await publishedPricesRepository.updatePriceCard(card.id, {
        isPublished: !card.isPublished,
      });
      await loadData();
    } catch (e) {
      console.error('Failed to toggle publish status:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('آیا از حذف این کارت تعرفه اطمینان دارید؟')) return;
    try {
      await publishedPricesRepository.deletePriceCard(id);
      await loadData();
    } catch (e) {
      console.error('Failed to delete price card:', e);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 text-base">کارت‌های تعرفه و خدمات منتشرشده</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            تعرفه‌های شفاف برای خدمات استاندارد (تهیه UTM، تفکیک، پهپاد) جهت استعلام فوری کارفرمایان
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAdd}
          rightIcon={<Plus className="w-4 h-4 text-teal-400" />}
        >
          تعریف تعرفه جدید
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-slate-500">در حال بارگذاری تعرفه‌ها...</div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon={<Coins className="w-10 h-10 text-slate-400" />}
          title="هیچ تعرفه عمومی ثبت نشده است"
          description="با انتشار نرخ‌های پایه خدمات خود، کارفرمایان می‌توانند قبل از تماس از حدود هزینه‌ها مطلع شده و سریع‌تر درخواست ثبت کنند."
          actionText="انتشار اولین تعرفه"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <Card
              key={card.id}
              variant="default"
              className={`p-4 relative transition-all ${
                !card.isPublished ? 'opacity-70 bg-slate-50 border-dashed' : 'hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">

                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{card.title}</span>
                      <Badge variant={card.isPublished ? 'success' : 'warning'} size="sm">
                        {card.isPublished ? 'منتشرشده' : 'پیش‌نویس / مخفی'}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      دسته‌بندی: <span className="font-semibold text-slate-700">{card.serviceCategory}</span> • واحد: {card.unit}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleTogglePublish(card)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                      title={card.isPublished ? 'مخفی‌سازی از دید کارفرما' : 'انتشار عمومی'}
                    >
                      {card.isPublished ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(card)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                      title="ویرایش"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Price Display */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-500 block">نرخ پایه پیشنهادی:</span>
                    <div className="font-mono font-bold text-base text-[#0B1D35]">
                      {formatToman(card.basePrice)}
                      {card.priceRangeMax && (
                        <span className="text-xs font-normal text-slate-500 mr-1">
                          تا {formatToman(card.priceRangeMax)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-left text-[11px] text-teal-800 flex items-center gap-1 font-medium bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>{card.estimatedTurnaround}</span>
                  </div>
                </div>

                {/* Inclusions */}
                {card.conditionsAndInclusions.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-bold text-slate-700 block">خدمات و تعهدات شامل:</span>
                    <ul className="text-xs text-slate-600 space-y-1 list-none">
                      {card.conditionsAndInclusions.map((inc, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {card.notes && (
                  <p className="text-[11px] text-slate-500 bg-amber-50/70 p-2 rounded-lg border border-amber-100">
                    {card.notes}
                  </p>
                )}

              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCard ? 'ویرایش کارت تعرفه' : 'تعریف تعرفه خدمات جدید'}
      >
        <form onSubmit={handleSave} className="space-y-4 pt-1" dir="rtl">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">دسته‌بندی خدمت *</label>
            <select
              value={serviceCategory}
              onChange={(e) => setServiceCategory(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1D35] outline-hidden text-slate-800"
            >
              <option value="ثبتی و شهرداری">امور ثبتی، کاداستر و شهرداری (UTM سند)</option>
              <option value="فتوگرامتری پهپاد">نقشه‌برداری هوایی با پهپاد و ارتوفتو</option>
              <option value="ساختمانی و اجرایی">پیاده‌سازی آکس، فونداسیون و کنترل شاقولی</option>
              <option value="ژئوتکنیک و پایش">مانیتورینگ دیواره گود و تغییرشکل سازه</option>
              <option value="تفکیک و کاداستر">تفکیک اراضی و تسطیح</option>
              <option value="نقشه‌برداری مسیر">راه‌سازی، احجام خاکی و خطوط انتقال</option>
            </select>
          </div>

          <Input
            label="عنوان تعرفه / پکیج خدمت *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: تهیه نقشه یو‌تی‌ام UTM تک‌برگی سند"
            required
          />

          <Input
            label="واحد اندازه‌گیری / مبنای محاسبه *"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="مثال: هر قطعه ملک مسکونی (تا ۵۰۰ متر) / روزانه"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="قیمت پایه (تومان) *"
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              dir="ltr"
              className="font-mono text-center"
              required
            />
            <Input
              label="حداکثر بازه قیمت (تومان - اختیاری)"
              type="number"
              value={priceRangeMax || ''}
              onChange={(e) => setPriceRangeMax(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="اختیاری"
              dir="ltr"
              className="font-mono text-center"
            />
          </div>

          <Input
            label="زمان تقریبی تحویل خروجی *"
            value={estimatedTurnaround}
            onChange={(e) => setEstimatedTurnaround(e.target.value)}
            placeholder="مثال: ۲ الی ۳ روز کاری"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              آیتم‌ها و تعهدات شامل در این تعرفه (هر مورد در یک خط)
            </label>
            <textarea
              value={conditionsStr}
              onChange={(e) => setConditionsStr(e.target.value)}
              rows={4}
              placeholder="مثال:&#10;برداشت میدانی با گیرنده شمیم&#10;تطبیق با اسناد مالکیت&#10;مهر و امضای کارشناس رسمی"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1D35] outline-hidden text-slate-800 font-sans"
            />
          </div>

          <Input
            label="توضیحات و شرایط تکمیلی (اختیاری)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: ایاب و ذهاب برای خارج از حومه شهر به صورت توافقی محاسبه می‌شود."
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPubPriceCheck"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
            />
            <label htmlFor="isPubPriceCheck" className="text-xs text-slate-700 cursor-pointer select-none">
              انتشار مستقیم در لیست تعرفه‌های عمومی برای کارفرمایان
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              انصراف
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
              ذخیره تعرفه
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
