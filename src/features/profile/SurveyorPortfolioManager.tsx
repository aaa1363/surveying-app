import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Edit3, Sparkles, MapPin, Calendar, Wrench, CheckCircle2, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { User } from '../../models/User';
import { PortfolioItem } from '../../models/Stage6Models';
import { portfolioRepository } from '../../repositories';

export interface SurveyorPortfolioManagerProps {
  user: User;
}

export const SurveyorPortfolioManager: React.FC<SurveyorPortfolioManagerProps> = ({ user }) => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('فتوگرامتری پهپاد');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('یزد');
  const [completionYearJalali, setCompletionYearJalali] = useState('۱۴۰۳');
  const [scaleOrVolume, setScaleOrVolume] = useState('');
  const [equipmentUsedStr, setEquipmentUsedStr] = useState('');
  const [description, setDescription] = useState('');
  const [deliverablesSummary, setDeliverablesSummary] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await portfolioRepository.getItemsByUserId(user.id);
      setItems(data);
    } catch (e) {
      console.error('Failed to load portfolio items:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setTitle('');
    setCategory('فتوگرامتری پهپاد');
    setClientName('');
    setLocation('یزد');
    setCompletionYearJalali('۱۴۰۳');
    setScaleOrVolume('');
    setEquipmentUsedStr('');
    setDescription('');
    setDeliverablesSummary('');
    setIsFeatured(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setCategory(item.category);
    setClientName(item.clientName || '');
    setLocation(item.location);
    setCompletionYearJalali(item.completionYearJalali);
    setScaleOrVolume(item.scaleOrVolume || '');
    setEquipmentUsedStr(item.equipmentUsed ? item.equipmentUsed.join('، ') : '');
    setDescription(item.description);
    setDeliverablesSummary(item.deliverablesSummary || '');
    setIsFeatured(item.isFeatured);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const equipmentUsed = equipmentUsedStr
        .split(/[،,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (editingItem) {
        await portfolioRepository.updateItem(editingItem.id, {
          title,
          category,
          clientName: clientName || undefined,
          location,
          completionYearJalali,
          scaleOrVolume: scaleOrVolume || undefined,
          equipmentUsed: equipmentUsed.length ? equipmentUsed : undefined,
          description,
          deliverablesSummary: deliverablesSummary || undefined,
          isFeatured,
        });
      } else {
        await portfolioRepository.addItem({
          userId: user.id,
          title,
          category,
          clientName: clientName || undefined,
          location,
          completionYearJalali,
          scaleOrVolume: scaleOrVolume || undefined,
          equipmentUsed: equipmentUsed.length ? equipmentUsed : undefined,
          description,
          deliverablesSummary: deliverablesSummary || undefined,
          isFeatured,
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (e) {
      console.error('Failed to save portfolio item:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('آیا از حذف این نمونه کار اطمینان دارید؟')) return;
    try {
      await portfolioRepository.deleteItem(id);
      await loadData();
    } catch (e) {
      console.error('Failed to delete portfolio item:', e);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 text-base">نمونه کارهای شاخص و پروژه‌های انجام شده</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            معرفی پروژه‌های موفق با ذکر ابزارها، حجم پروژه و خروجی‌های تحویل شده به کارفرما
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAdd}
          rightIcon={<Plus className="w-4 h-4 text-teal-400" />}
        >
          ثبت نمونه کار جدید
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-slate-500">در حال بارگذاری نمونه کارها...</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-10 h-10 text-slate-400" />}
          title="هنوز نمونه کاری ثبت نکرده‌اید"
          description="با نمایش پروژه‌های قبلی نقشه‌برداری، توان فنی و تجهیزاتی خود را به کارفرمایان اثبات کنید."
          actionText="ثبت اولین نمونه کار"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <Card key={item.id} variant="default" className="p-4 relative hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                    <Badge variant="info" size="sm">
                      {item.category}
                    </Badge>
                    {item.isFeatured && (
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-600 fill-amber-500" />
                        پروژه منتخب
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {item.location}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px] text-teal-700">
                      <Calendar className="w-3 h-3" />
                      سال {item.completionYearJalali}
                    </span>
                    {item.scaleOrVolume && (
                      <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-mono">
                        حجم: {item.scaleOrVolume}
                      </span>
                    )}
                  </div>

                  {item.clientName && (
                    <div className="text-xs text-slate-500">
                      کارفرما: <span className="font-semibold text-slate-700">{item.clientName}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-700 leading-relaxed pt-1">
                    {item.description}
                  </p>

                  {item.equipmentUsed && item.equipmentUsed.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-slate-600">
                      <Wrench className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-500">تجهیزات:</span>
                      {item.equipmentUsed.map((eq, i) => (
                        <span key={i} className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                          {eq}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.deliverablesSummary && (
                    <div className="bg-teal-50/70 border border-teal-100 rounded-lg p-2 text-[11px] text-teal-900 mt-2">
                      <span className="font-bold">خروجی‌های تحویل شده: </span>
                      {item.deliverablesSummary}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                    title="ویرایش"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'ویرایش مشخصات نمونه کار' : 'ثبت نمونه کار جدید'}
      >
        <form onSubmit={handleSave} className="space-y-4 pt-1" dir="rtl">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">دسته‌بندی تخصصی پروژه *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1D35] outline-hidden text-slate-800"
            >
              <option value="فتوگرامتری پهپاد">نقشه‌برداری هوایی و پهپاد (Photogrammetry & Drone)</option>
              <option value="تفکیک اراضی">تفکیک، کاداستر و قطعه‌بندی اراضی</option>
              <option value="نقشه UTM سند">تهیه نقشه یو‌تی‌ام UTM سند و اداره ثبت</option>
              <option value="مانیتورینگ سازه">مانیتورینگ دیواره گود و تغییرشکل سازه</option>
              <option value="نقشه‌برداری مسیر">راه‌سازی، خطوط انتقال و احجام عملیات خاکی</option>
              <option value="نقشه‌برداری صنعتی">پیاده‌سازی سازه‌های صنعتی و سوله‌ها</option>
            </select>
          </div>

          <Input
            label="عنوان پروژه / نمونه کار *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: نقشه توپوگرافی و ارتوفتو شهرک صنعتی یزد"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="کارفرما / سازمان (اختیاری)"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="مثال: شرکت شهرک‌های صنعتی"
            />
            <Input
              label="محل اجرای پروژه *"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="مثال: یزد - شهرک صنعتی"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="سال اتمام پروژه *"
              value={completionYearJalali}
              onChange={(e) => setCompletionYearJalali(e.target.value)}
              placeholder="۱۴۰۳"
              required
            />
            <Input
              label="مقیاس / حجم پروژه (اختیاری)"
              value={scaleOrVolume}
              onChange={(e) => setScaleOrVolume(e.target.value)}
              placeholder="مثال: ۶۵۰ هکتار / ۲۵ کیلومتر"
            />
          </div>

          <Input
            label="تجهیزات و نرم‌افزارهای مورد استفاده (با ویرگول جدا کنید)"
            value={equipmentUsedStr}
            onChange={(e) => setEquipmentUsedStr(e.target.value)}
            placeholder="مثال: پهپاد فانتوم ۴ RTK، گیرنده شمیم، Pix4D، Civil3D"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              شرح پروژه و چالش‌های فنی برطرف شده *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="توضیح دهید پروژه چگونه اجرا شد، چه دقتی حاصل شد و چه نیازی از کارفرما برطرف گردید..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1D35] outline-hidden text-slate-800"
              required
            />
          </div>

          <Input
            label="خلاصه خروجی‌های تحویل شده (اختیاری)"
            value={deliverablesSummary}
            onChange={(e) => setDeliverablesSummary(e.target.value)}
            placeholder="مثال: شیت‌های CAD توپوگرافی ۱:۱۰۰۰، فایل ارتوفتو ژئورفرنس، ابر نقاط"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeaturedCheck"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
            />
            <label htmlFor="isFeaturedCheck" className="text-xs text-slate-700 cursor-pointer select-none">
              نمایش به عنوان پروژه منتخب در بالای پروفایل عمومی
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              انصراف
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
              ذخیره نمونه کار
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
