import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Coins,
  Users,
  Wrench,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Info,
  Save,
  AlertCircle,
} from 'lucide-react';
import { User } from '../../models/User';
import {
  PersonalRatesProfile,
  LaborRateItem,
  EquipmentRateItem,
  MaterialRateItem,
} from '../../models/PersonalRates';
import { personalRatesRepository } from '../../repositories';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingState } from '../../components/ui/LoadingState';
import { formatToman, toEnglishDigits } from '../../utils/formatters';

interface PersonalRatesViewProps {
  user: User;
}

type ActiveSection = 'all' | 'labor' | 'equipment' | 'materials';

export const PersonalRatesView: React.FC<PersonalRatesViewProps> = ({ user }) => {
  const [rates, setRates] = useState<PersonalRatesProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>('all');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [rateErrors, setRateErrors] = useState<Record<string,string>>({});

  const parseOptionalRate = (value: string, key: string): number | undefined => {
    const clean = toEnglishDigits(value).replace(/[٬,\s]/g, '');
    if (!clean) { setRateErrors(prev => { const next={...prev}; delete next[key]; return next; }); return undefined; }
    const parsed = Number(clean);
    if (!Number.isFinite(parsed) || parsed <= 0) { setRateErrors(prev=>({...prev,[key]:'نرخ باید عددی مثبت و معتبر باشد.'})); return Number.NaN; }
    setRateErrors(prev => { const next={...prev}; delete next[key]; return next; });
    return Math.round(parsed);
  };

  // New Equipment Modal
  const [newEquipmentModalOpen, setNewEquipmentModalOpen] = useState(false);
  const [newEqName, setNewEqName] = useState('');
  const [newEqOwnership, setNewEqOwnership] = useState<'owned' | 'rented'>('owned');
  const [newEqDailyRate, setNewEqDailyRate] = useState<string>('');
  const [newEqDepreciation, setNewEqDepreciation] = useState<string>('');
  const [newEqNotes, setNewEqNotes] = useState('');

  // New Material Modal
  const [newMaterialModalOpen, setNewMaterialModalOpen] = useState(false);
  const [newMatName, setNewMatName] = useState('');
  const [newMatUnit, setNewMatUnit] = useState('عدد');
  const [newMatUnitRate, setNewMatUnitRate] = useState<string>('');
  const [newMatNotes, setNewMatNotes] = useState('');

  // Reset Confirmation Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Delete Item Confirmation Modal
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'equipment' | 'material'; id: string; name: string } | null>(null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef(true);

  // Load rates
  const loadRates = async () => {
    setIsLoading(true);
    try {
      const data = await personalRatesRepository.getPersonalRates(user.id);
      setRates(data);
    } catch (e) {
      console.error('Failed to load personal rates:', e);
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        isInitialMountRef.current = false;
      }, 300);
    }
  };

  useEffect(() => {
    loadRates();
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [user.id]);

  // Debounced auto-save
  const triggerAutoSave = useCallback((updated: PersonalRatesProfile) => {
    if (isInitialMountRef.current) return;
    setSaveStatus('dirty');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const saved = await personalRatesRepository.savePersonalRates(updated);
        setRates(saved);
        setSaveStatus('saved');
        const now = new Date();
        setLastSavedTime(now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        console.error('Auto-save rates failed:', err);
        setSaveStatus('error');
      }
    }, 800);
  }, []);

  const updateRates = (updater: (prev: PersonalRatesProfile) => PersonalRatesProfile) => {
    setRates((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      triggerAutoSave(updated);
      return updated;
    });
  };

  // 1. Labor Handlers
  const handleLaborChange = (
    index: number,
    field: 'fullDayRate' | 'halfDayRate' | 'hourlyRate' | 'fixedRate' | 'notes',
    value: string
  ) => {
    updateRates((prev) => {
      const nextLabor = [...prev.laborRates];
      const item = { ...nextLabor[index] };

      if (field === 'notes') {
        item.notes = value;
      } else {
        const numVal = parseOptionalRate(value, `labor-${index}-${field}`);
        item[field] = numVal;
      }

      nextLabor[index] = item;
      return { ...prev, laborRates: nextLabor };
    });
  };

  const handleLaborSettings = (index: number, field: 'enabled' | 'personCount' | 'calculationMethod', value: boolean | string) => {
    updateRates(prev => {
      const laborRates = [...prev.laborRates];
      const item = { ...laborRates[index] };
      if (field === 'enabled') {
        item.enabled = Boolean(value);
        if (!item.enabled) {
          item.fullDayRate = undefined; item.halfDayRate = undefined; item.hourlyRate = undefined; item.fixedRate = undefined;
        }
      } else if (field === 'personCount') {
        const count = Number(toEnglishDigits(String(value)));
        item.personCount = Number.isInteger(count) && count > 0 ? count : 1;
      } else item.calculationMethod = value as LaborRateItem['calculationMethod'];
      laborRates[index] = item;
      return { ...prev, laborRates };
    });
  };

  // 2. Equipment Handlers
  const handleEquipmentChange = (
    index: number,
    field: 'name' | 'ownershipType' | 'dailyRate' | 'depreciationDailyRate' | 'notes',
    value: string
  ) => {
    updateRates((prev) => {
      const nextEq = [...prev.equipmentRates];
      const item = { ...nextEq[index] };

      if (field === 'ownershipType') {
        item.ownershipType = value as 'owned' | 'rented';
        if (item.ownershipType === 'rented') {
          item.depreciationDailyRate = undefined;
        }
      } else if (field === 'dailyRate' || field === 'depreciationDailyRate') {
        const numVal = parseOptionalRate(value, `equipment-${index}-${field}`);
        item[field] = numVal;
      } else {
        item[field] = value;
      }

      nextEq[index] = item;
      return { ...prev, equipmentRates: nextEq };
    });
  };

  const handleAddEquipment = () => {
    if (!newEqName.trim()) return;
    const dailyRate = parseOptionalRate(newEqDailyRate, 'new-equipment-rate');
    const depreciation = newEqOwnership === 'owned'
      ? parseOptionalRate(newEqDepreciation, 'new-equipment-depreciation')
      : undefined;

    const newItem: EquipmentRateItem = {
      id: `eq_custom_${Date.now()}`,
      name: newEqName.trim(),
      ownershipType: newEqOwnership,
      dailyRate,
      depreciationDailyRate: depreciation,
      notes: newEqNotes.trim() || undefined,
      isCustom: true,
    };

    updateRates((prev) => ({
      ...prev,
      equipmentRates: [...prev.equipmentRates, newItem],
    }));

    setNewEqName('');
    setNewEqDailyRate('');
    setNewEqDepreciation('');
    setNewEqNotes('');
    setNewEquipmentModalOpen(false);
  };

  // 3. Material Handlers
  const handleMaterialChange = (
    index: number,
    field: 'name' | 'unit' | 'unitRate' | 'notes',
    value: string
  ) => {
    updateRates((prev) => {
      const nextMat = [...prev.materialRates];
      const item = { ...nextMat[index] };

      if (field === 'unitRate') {
        const numVal = parseOptionalRate(value, `material-${index}-unitRate`);
        item.unitRate = numVal;
      } else {
        item[field] = value;
      }

      nextMat[index] = item;
      return { ...prev, materialRates: nextMat };
    });
  };

  const handleAddMaterial = () => {
    if (!newMatName.trim()) return;
    const unitRate = parseOptionalRate(newMatUnitRate, 'new-material-rate');

    const newItem: MaterialRateItem = {
      id: `mat_custom_${Date.now()}`,
      name: newMatName.trim(),
      unit: newMatUnit.trim() || 'عدد',
      unitRate,
      notes: newMatNotes.trim() || undefined,
      isCustom: true,
    };

    updateRates((prev) => ({
      ...prev,
      materialRates: [...prev.materialRates, newItem],
    }));

    setNewMatName('');
    setNewMatUnit('عدد');
    setNewMatUnitRate('');
    setNewMatNotes('');
    setNewMaterialModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'equipment') {
      updateRates((prev) => ({
        ...prev,
        equipmentRates: prev.equipmentRates.filter((e) => e.id !== itemToDelete.id),
      }));
    } else {
      updateRates((prev) => ({
        ...prev,
        materialRates: prev.materialRates.filter((m) => m.id !== itemToDelete.id),
      }));
    }
    setItemToDelete(null);
    setDeleteConfirmModalOpen(false);
  };

  const handleResetDefaults = async () => {
    setIsLoading(true);
    try {
      const defaults = await personalRatesRepository.resetToDefaults(user.id);
      setRates(defaults);
      setSaveStatus('saved');
      setResetModalOpen(false);
    } catch (e) {
      console.error('Reset failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSave = async () => {
    if (!rates) return;
    setSaveStatus('saving');
    try {
      const saved = await personalRatesRepository.savePersonalRates(rates);
      setRates(saved);
      setSaveStatus('saved');
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
    }
  };

  if (isLoading || !rates) {
    return <LoadingState message="در حال بارگذاری نرخ‌های پایه و شخصی نقشه‌بردار..." className="py-20" />;
  }

  return (
    <div className="space-y-6 pb-16" dir="rtl">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-[#0B1D35] text-white shrink-0 shadow-xs">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-slate-900 text-base sm:text-lg">
                نرخ‌های پایه و شخصی نقشه‌بردار
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                کاملاً محرمانه
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              مبنای محاسبه و پیشنهاد اولیه هزینه‌های واقعی پروژه (نیروی انسانی، تجهیزات و مصالح)
            </p>
          </div>
        </div>

        {/* Auto-save & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap self-stretch md:self-auto justify-end">
          
          {/* Status badge */}
          <div className="text-xs">
            {saveStatus === 'saving' && (
              <span className="text-indigo-600 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                در حال ذخیره...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                ذخیره شد {lastSavedTime ? `(${lastSavedTime})` : ''}
              </span>
            )}
            {saveStatus === 'dirty' && (
              <span className="text-amber-600 font-medium flex items-center gap-1">
                تغییرات ثبت‌نشده...
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                خطا در ذخیره‌سازی
              </span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setResetModalOpen(true)}
            rightIcon={<RotateCcw className="w-3.5 h-3.5" />}
            title="بازنشانی به مبالغ اولیه"
          >
            پیش‌فرض‌ها
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleManualSave}
            rightIcon={<Save className="w-3.5 h-3.5" />}
            className="bg-[#0B1D35] hover:bg-[#0B1D35]/90 text-white font-bold"
          >
            ذخیره نرخ‌ها
          </Button>
        </div>
      </div>

      {/* Info notice */}
      <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl flex items-start gap-2.5 text-xs text-sky-900 leading-relaxed">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <strong>نکته کاربردی:</strong> نرخ‌های ثبت‌شده در این صفحه، تنها به عنوان <em>مقدار پیشنهادی اولیه</em> در کارت‌های هزینه پروژه درج می‌شوند. با تغییر نرخ در یک پروژه مشخص، نرخ‌های پایه شما یا پروژه‌های دیگر تغییری نخواهند کرد.
          <span className="block mt-1 font-bold">اختیاری — در صورت خالی‌بودن، تعرفه معتبر فعال ملاک خواهد بود.</span>
          {Object.values(rateErrors)[0] && <span role="alert" className="block mt-1 text-rose-700 font-bold">{Object.values(rateErrors)[0]}</span>}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveSection('all')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
            activeSection === 'all'
              ? 'bg-[#0B1D35] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          همه سرفصل‌ها
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('labor')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'labor'
              ? 'bg-[#0B1D35] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>نیروی انسانی ({rates.laborRates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('equipment')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'equipment'
              ? 'bg-[#0B1D35] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>تجهیزات و ابزار ({rates.equipmentRates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('materials')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'materials'
              ? 'bg-[#0B1D35] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>مصالح و ملزومات ({rates.materialRates.length})</span>
        </button>
      </div>

      {/* SECTION 1: LABOR (نیروی انسانی) */}
      {(activeSection === 'all' || activeSection === 'labor') && (
        <Card variant="default" className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  ۱. نرخ‌های پایه نیروی انسانی میدان
                </CardTitle>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  فقط ۳ نقش استاندارد فیلد: سرپرست اکیپ، کارشناس نقشه‌برداری و کمک‌نقشه‌بردار
                </p>
              </div>
            </div>
            <Badge variant="neutral" size="sm">
              ۳ نقش استاندارد
            </Badge>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {rates.laborRates.map((role, idx) => (
                <div
                  key={role.roleId}
                  className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#0B1D35] text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{role.title}</h4>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      محاسبه به واحد تومان برای هر نفر
                    </span>
                  </div>

                  <label className="labor-enabled"><input type="checkbox" checked={Boolean(role.enabled)} onChange={e => handleLaborSettings(idx, 'enabled', e.target.checked)} /><span>این نقش استفاده می‌شود</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <label className="numeric-field"><span>تعداد نفر</span><input type="text" inputMode="numeric" enterKeyHint="next" pattern="[0-9۰-۹٠-٩]*" disabled={!role.enabled} value={role.personCount || 1} onChange={e => handleLaborSettings(idx, 'personCount', e.target.value)} /></label>
                    <label className="numeric-field"><span>روش محاسبه</span><select disabled={!role.enabled} value={role.calculationMethod || 'full_day'} onChange={e => handleLaborSettings(idx, 'calculationMethod', e.target.value)}><option value="full_day">روز کامل</option><option value="half_day">نیم‌روز</option><option value="hourly">ساعتی</option><option value="fixed">مبلغ ثابت</option></select></label>
                  </div>
                  {role.enabled && (() => { const method = role.calculationMethod || 'full_day'; const field = method === 'full_day' ? 'fullDayRate' : method === 'half_day' ? 'halfDayRate' : method === 'hourly' ? 'hourlyRate' : 'fixedRate'; const title = method === 'full_day' ? 'نرخ روز کامل' : method === 'half_day' ? 'نرخ نیم‌روز' : method === 'hourly' ? 'نرخ ساعتی' : 'مبلغ ثابت'; return <label className="numeric-field"><span>{title}</span><div className="numeric-input-wrap"><input type="text" inputMode="numeric" enterKeyHint="next" pattern="[0-9۰-۹٠-٩]*" value={String(role[field] || '')} onChange={e => handleLaborChange(idx, field, e.target.value)} placeholder="۰" /><span>تومان</span></div>{rateErrors[`labor-${idx}-${field}`] && <small role="alert">{rateErrors[`labor-${idx}-${field}`]}</small>}</label>; })()}

                  {/* Notes */}
                  <div className="space-y-1 text-right">
                    <label className="block text-[11px] font-medium text-slate-500">
                      توضیحات اختیاری و مسئولیت‌های این نقش
                    </label>
                    <input
                      type="text"
                      value={role.notes || ''}
                      onChange={(e) => handleLaborChange(idx, 'notes', e.target.value)}
                      placeholder="مثال: کنترل کیفیت داده‌ها و بنچ‌مارک‌های عرصه..."
                      className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-[#0B1D35]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 2: EQUIPMENT (تجهیزات) */}
      {(activeSection === 'all' || activeSection === 'equipment') && (
        <Card variant="default" className="shadow-2xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  ۲. نرخ‌های پایه تجهیزات و ابزار مهندسی
                </CardTitle>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  تفکیک ملکی و اجاره‌ای؛ استهلاک فقط برای تجهیزات ملکی محاسبه می‌شود.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewEquipmentModalOpen(true)}
              rightIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              افزودن تجهیز جدید
            </Button>
          </CardHeader>

          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3.5">
              {rates.equipmentRates.map((eq, idx) => (
                <div
                  key={eq.id}
                  className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{eq.name}</span>
                      {eq.isCustom && (
                        <Badge variant="demo" size="sm">
                          سفارشی
                        </Badge>
                      )}
                    </div>

                    {/* Ownership switch */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                        <button
                          type="button"
                          onClick={() => handleEquipmentChange(idx, 'ownershipType', 'owned')}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                            eq.ownershipType === 'owned'
                              ? 'bg-[#0B1D35] text-white shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          ملکی (مالکیت شخصی)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEquipmentChange(idx, 'ownershipType', 'rented')}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                            eq.ownershipType === 'rented'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          اجاره‌ای (کرایه روزانه)
                        </button>
                      </div>

                      {eq.isCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            setItemToDelete({ type: 'equipment', id: eq.id, name: eq.name });
                            setDeleteConfirmModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="حذف تجهیز سفارشی"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Daily Rate */}
                    <div className="space-y-1 text-right">
                      <label className="block text-xs font-semibold text-slate-700">
                        {eq.ownershipType === 'owned' ? 'نرخ استفاده روزانه (تومان) *' : 'نرخ اجاره روزانه (تومان) *'}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={eq.dailyRate ? eq.dailyRate.toLocaleString('fa-IR') : ''}
                          onChange={(e) => handleEquipmentChange(idx, 'dailyRate', e.target.value)}
                          placeholder="۰"
                          className="w-full bg-white border border-slate-300 rounded-xl py-1.5 px-3 pl-14 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#0B1D35]"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
                          تومان
                        </span>
                      </div>
                    </div>

                    {/* Depreciation - ONLY IF OWNED */}
                    {eq.ownershipType === 'owned' ? (
                      <div className="space-y-1 text-right">
                        <label className="block text-xs font-semibold text-slate-700">
                          استهلاک روزانه تجهیز (تومان)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={
                              eq.depreciationDailyRate !== undefined && eq.depreciationDailyRate !== null
                                ? eq.depreciationDailyRate.toLocaleString('fa-IR')
                                : ''
                            }
                            onChange={(e) =>
                              handleEquipmentChange(idx, 'depreciationDailyRate', e.target.value)
                            }
                            placeholder="۰"
                            className="w-full bg-white border border-slate-300 rounded-xl py-1.5 px-3 pl-14 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#0B1D35]"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
                            تومان
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-800">
                        <span>برای تجهیزات اجاره‌ای، استهلاک جداگانه محاسبه نمی‌شود.</span>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-1 text-right sm:col-span-2 lg:col-span-1">
                      <label className="block text-[11px] font-medium text-slate-500">
                        توضیحات و مدل دستگاه
                      </label>
                      <input
                        type="text"
                        value={eq.notes || ''}
                        onChange={(e) => handleEquipmentChange(idx, 'notes', e.target.value)}
                        placeholder="مشخصات و دقت دستگاه..."
                        className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-[#0B1D35]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 3: MATERIALS (مصالح مصرفی) */}
      {(activeSection === 'all' || activeSection === 'materials') && (
        <Card variant="default" className="shadow-2xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  ۳. نرخ‌های پایه مصالح مصرفی
                </CardTitle>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  میخ چوبی، رنگ، پلاک، میخ فولادی و اقلام نشانه‌گذاری صحرایی
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewMaterialModalOpen(true)}
              rightIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              افزودن مصالح جدید
            </Button>
          </CardHeader>

          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3">
              {rates.materialRates.map((mat, idx) => (
                <div
                  key={mat.id}
                  className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-[140px]">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-bold text-slate-900 text-sm">{mat.name}</span>
                    {mat.isCustom && (
                      <Badge variant="demo" size="sm">
                        سفارشی
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
                    {/* Unit */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="text-slate-400 text-[11px]">واحد:</span>
                      <input
                        type="text"
                        value={mat.unit}
                        onChange={(e) => handleMaterialChange(idx, 'unit', e.target.value)}
                        className="w-24 bg-white border border-slate-300 rounded-lg py-1 px-2 text-xs font-bold text-slate-800 text-center"
                      />
                    </div>

                    {/* Unit Rate */}
                    <div className="relative">
                      <input
                        type="text"
                        value={mat.unitRate ? mat.unitRate.toLocaleString('fa-IR') : ''}
                        onChange={(e) => handleMaterialChange(idx, 'unitRate', e.target.value)}
                        placeholder="۰"
                        className="w-full bg-white border border-slate-300 rounded-lg py-1 px-2.5 pl-12 text-xs font-bold text-slate-900"
                      />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none">
                        تومان
                      </span>
                    </div>

                    {/* Notes */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={mat.notes || ''}
                        onChange={(e) => handleMaterialChange(idx, 'notes', e.target.value)}
                        placeholder="توضیحات..."
                        className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-[11px] text-slate-600"
                      />

                      {mat.isCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            setItemToDelete({ type: 'material', id: mat.id, name: mat.name });
                            setDeleteConfirmModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="حذف مصالح سفارشی"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal: Add Custom Equipment */}
      <Modal
        isOpen={newEquipmentModalOpen}
        onClose={() => setNewEquipmentModalOpen(false)}
        title="افزودن تجهیز یا ابزار جدید"
        size="md"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">نام تجهیز *</label>
            <input
              type="text"
              value={newEqName}
              onChange={(e) => setNewEqName(e.target.value)}
              placeholder="مثال: دوربین ترازیاب دیجیتال لایکا DNA03"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">نوع مالکیت *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewEqOwnership('owned')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  newEqOwnership === 'owned'
                    ? 'bg-[#0B1D35] text-white border-[#0B1D35]'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                ملکی (مالکیت شخصی)
              </button>
              <button
                type="button"
                onClick={() => setNewEqOwnership('rented')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  newEqOwnership === 'rented'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                اجاره‌ای (کرایه روزانه)
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">
              {newEqOwnership === 'owned' ? 'نرخ استفاده روزانه (تومان) *' : 'نرخ اجاره روزانه (تومان) *'}
            </label>
            <input
              type="text"
              value={newEqDailyRate}
              onChange={(e) => setNewEqDailyRate(e.target.value)}
              placeholder="مثال: ۱,۲۰۰,۰۰۰"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          {newEqOwnership === 'owned' && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                استهلاک روزانه (تومان)
              </label>
              <input
                type="text"
                value={newEqDepreciation}
                onChange={(e) => setNewEqDepreciation(e.target.value)}
                placeholder="مثال: ۲۰۰,۰۰۰"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">توضیحات اختیاری</label>
            <input
              type="text"
              value={newEqNotes}
              onChange={(e) => setNewEqNotes(e.target.value)}
              placeholder="دقت، متعلقات و شرایط استفاده..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setNewEquipmentModalOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddEquipment}
              disabled={!newEqName.trim()}
              className="bg-[#0B1D35] text-white font-bold"
            >
              افزودن تجهیز
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Add Custom Material */}
      <Modal
        isOpen={newMaterialModalOpen}
        onClose={() => setNewMaterialModalOpen(false)}
        title="افزودن مصالح یا قلم مصرفی جدید"
        size="md"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">نام مصالح *</label>
            <input
              type="text"
              value={newMatName}
              onChange={(e) => setNewMatName(e.target.value)}
              placeholder="مثال: رنگ روغنی شابلون‌زنی"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">واحد سنجش *</label>
              <input
                type="text"
                value={newMatUnit}
                onChange={(e) => setNewMatUnit(e.target.value)}
                placeholder="عدد / قوطی / متر / کیلوگرم..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">نرخ واحد (تومان) *</label>
              <input
                type="text"
                value={newMatUnitRate}
                onChange={(e) => setNewMatUnitRate(e.target.value)}
                placeholder="مثال: ۸۵,۰۰۰"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">توضیحات اختیاری</label>
            <input
              type="text"
              value={newMatNotes}
              onChange={(e) => setNewMatNotes(e.target.value)}
              placeholder="کیفیت، مصرف در هر پروژه و شرایط تهیه..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setNewMaterialModalOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddMaterial}
              disabled={!newMatName.trim()}
              className="bg-[#0B1D35] text-white font-bold"
            >
              افزودن مصالح
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Delete Item Confirmation */}
      <Modal
        isOpen={deleteConfirmModalOpen}
        onClose={() => setDeleteConfirmModalOpen(false)}
        title="تأیید حذف آیتم سفارشی"
        size="sm"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <p className="text-xs text-slate-700 leading-relaxed">
            آیا از حذف <strong className="text-[#0B1D35]">«{itemToDelete?.name}»</strong> از فهرست نرخ‌های شخصی خود اطمینان دارید؟
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmModalOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              حذف
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Reset to defaults */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="بازنشانی نرخ‌های پایه به مقادیر پیش‌فرض"
        size="sm"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <p className="text-xs text-slate-700 leading-relaxed">
            آیا مایلید تمام نرخ‌های نیروی انسانی، تجهیزات و مصالح به مقادیر پیش‌فرض اولیه سامانه بازنشانی شوند؟
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setResetModalOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleResetDefaults}
              className="bg-[#0B1D35] text-white font-bold"
            >
              تأیید بازنشانی
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
