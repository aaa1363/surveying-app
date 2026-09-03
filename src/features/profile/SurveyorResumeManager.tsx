import React, { useState, useEffect } from 'react';
import { GraduationCap, Briefcase, Plus, Trash2, Edit3, Award, Calendar, MapPin, Building, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { User } from '../../models/User';
import { SurveyorResumeItem, ResumeType } from '../../models/Stage6Models';
import { surveyorResumeRepository } from '../../repositories';

export interface SurveyorResumeManagerProps {
  user: User;
}

export const SurveyorResumeManager: React.FC<SurveyorResumeManagerProps> = ({ user }) => {
  const [items, setItems] = useState<SurveyorResumeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SurveyorResumeItem | null>(null);

  // Form states
  const [type, setType] = useState<ResumeType>('work');
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [location, setLocation] = useState('');
  const [startYearJalali, setStartYearJalali] = useState('۱۴۰۰');
  const [endYearJalali, setEndYearJalali] = useState('تاکنون');
  const [isCurrent, setIsCurrent] = useState(true);
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await surveyorResumeRepository.getItemsByUserId(user.id);
      setItems(data);
    } catch (e) {
      console.error('Failed to load resume items:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setType('work');
    setTitle('');
    setOrganization('');
    setLocation('');
    setStartYearJalali('۱۴۰۰');
    setEndYearJalali('تاکنون');
    setIsCurrent(true);
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: SurveyorResumeItem) => {
    setEditingItem(item);
    setType(item.type);
    setTitle(item.title);
    setOrganization(item.organization);
    setLocation(item.location || '');
    setStartYearJalali(item.startYearJalali);
    setEndYearJalali(item.endYearJalali || (item.isCurrent ? 'تاکنون' : ''));
    setIsCurrent(item.isCurrent);
    setDescription(item.description || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingItem) {
        await surveyorResumeRepository.updateItem(editingItem.id, {
          type,
          title,
          organization,
          location: location || undefined,
          startYearJalali,
          endYearJalali: isCurrent ? 'تاکنون' : endYearJalali,
          isCurrent,
          description: description || undefined,
        });
      } else {
        await surveyorResumeRepository.addItem({
          userId: user.id,
          type,
          title,
          organization,
          location: location || undefined,
          startYearJalali,
          endYearJalali: isCurrent ? 'تاکنون' : endYearJalali,
          isCurrent,
          description: description || undefined,
          orderIndex: items.length + 1,
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (e) {
      console.error('Failed to save resume item:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('آیا از حذف این مورد از سوابق اطمینان دارید؟')) return;
    try {
      await surveyorResumeRepository.deleteItem(id);
      await loadData();
    } catch (e) {
      console.error('Failed to delete resume item:', e);
    }
  };

  const workItems = items.filter((i) => i.type === 'work' || i.type === 'project');
  const eduItems = items.filter((i) => i.type === 'education' || i.type === 'award');

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 text-base">سوابق شغلی، پروژه‌ای و تحصیلی</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ثبت تجربیات کاری و مدارک دانشگاهی جهت ارزیابی کارفرمایان و اثبات صلاحیت فنی
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAddModal}
          rightIcon={<Plus className="w-4 h-4 text-teal-400" />}
        >
          افزودن سابقه جدید
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-slate-500">در حال بارگذاری سوابق...</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-10 h-10 text-slate-400" />}
          title="هنوز سابقه‌ای ثبت نشده است"
          description="با افزودن تجربیات کاری و مدارک تحصیلی، اعتماد کارفرمایان را برای واگذاری پروژه‌ها جلب کنید."
          actionText="ثبت اولین سابقه"
          onAction={handleOpenAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Work Experience Column */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#0B1D35]" />
              <span>سوابق کاری و مسئولیت‌های اجرایی ({workItems.length})</span>
            </h4>

            {workItems.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                موردی در این دسته ثبت نشده است.
              </div>
            ) : (
              workItems.map((item) => (
                <Card key={item.id} variant="default" className="p-4 relative hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                        {item.isCurrent && (
                          <Badge variant="success" size="sm">
                            مشغول به کار
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {item.organization}
                        </span>
                        {item.location && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {item.location}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-teal-700 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {item.startYearJalali} تا {item.endYearJalali || 'تاکنون'}
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-600 pt-1 leading-relaxed border-t border-slate-100 mt-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(item)}
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
              ))
            )}
          </div>

          {/* Education & Academic Column */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-teal-700" />
              <span>تحصیلات و افتخارات دانشگاهی ({eduItems.length})</span>
            </h4>

            {eduItems.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                موردی در این دسته ثبت نشده است.
              </div>
            ) : (
              eduItems.map((item) => (
                <Card key={item.id} variant="default" className="p-4 relative hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                        {item.type === 'award' && (
                          <Badge variant="accent" size="sm">
                            افتخار / جایزه
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {item.organization}
                        </span>
                        {item.location && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {item.location}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-teal-700 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {item.startYearJalali} تا {item.endYearJalali || 'فارغ‌التحصیل'}
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-600 pt-1 leading-relaxed border-t border-slate-100 mt-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(item)}
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
              ))
            )}
          </div>

        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'ویرایش سابقه شغلی / تحصیلی' : 'ثبت سابقه شغلی یا مدرک جدید'}
      >
        <form onSubmit={handleSave} className="space-y-4 pt-1" dir="rtl">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">نوع سابقه *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ResumeType)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1D35] outline-hidden text-slate-800"
            >
              <option value="work">سابقه کاری / سمت اجرایی</option>
              <option value="education">مدرک تحصیلی دانشگاهی</option>
              <option value="project">پروژه کلان مشاوره‌ای</option>
              <option value="award">افتخار، رتبه برتر یا جایزه علمی</option>
            </select>
          </div>

          <Input
            label={type === 'education' ? 'مدرک و رشته تحصیلی *' : 'عنوان سمت یا مسئولیت شغلی *'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'education' ? 'مثال: کارشناسی ارشد مهندسی نقشه‌برداری ژئودزی' : 'مثال: مدیر فنی پروژه‌های کاداستر'}
            required
          />

          <Input
            label={type === 'education' ? 'نام دانشگاه یا مؤسسه آموزشی *' : 'نام شرکت، سازمان یا ارگان کارفرما *'}
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder={type === 'education' ? 'مثال: دانشگاه تهران' : 'مثال: مهندسین مشاور نقشه‌نگار'}
            required
          />

          <Input
            label="شهر / موقعیت مکانی (اختیاری)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="مثال: تهران / یزد"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="سال شروع *"
              value={startYearJalali}
              onChange={(e) => setStartYearJalali(e.target.value)}
              placeholder="۱۳۹۵"
              required
            />

            {!isCurrent ? (
              <Input
                label="سال پایان *"
                value={endYearJalali}
                onChange={(e) => setEndYearJalali(e.target.value)}
                placeholder="۱۴۰۰"
                required
              />
            ) : (
              <div className="flex flex-col justify-center pt-5">
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 text-center">
                  هم‌اکنون ادامه دارد
                </span>
              </div>
            )}
          </div>

          {type === 'work' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isCurrentCheck"
                checked={isCurrent}
                onChange={(e) => setIsCurrent(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
              <label htmlFor="isCurrentCheck" className="text-xs text-slate-700 cursor-pointer select-none">
                همچنان در این سمت مشغول به فعالیت هستم
              </label>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              شرح وظایف یا دستاوردها (اختیاری)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="توضیح مختصری از دستاوردها، پایان‌نامه، یا جزئیات پروژه..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1D35] outline-hidden text-slate-800"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              انصراف
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
              ذخیره سابقه
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
