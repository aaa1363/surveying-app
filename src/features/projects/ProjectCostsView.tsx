import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Calculator,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
  Wrench,
  Package,
  Car,
  Utensils,
  Laptop,
  Coins,
  ChevronDown,
  ChevronUp,
  Save,
  HelpCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { User } from '../../models/User';
import { SurveyProject } from '../../models/Project';
import {
  ProjectCostEstimate,
  CostLineItem,
  CostCategory,
  calculateProjectCostSummary,
} from '../../models/ProjectCost';
import { PersonalRatesProfile } from '../../models/PersonalRates';
import {
  projectRepository,
  personalRatesRepository,
  projectCostsRepository,
} from '../../repositories';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingState } from '../../components/ui/LoadingState';
import { formatToman, toEnglishDigits } from '../../utils/formatters';

interface ProjectCostsViewProps {
  user: User;
  projectId: string;
  onBack: () => void;
}

export const ProjectCostsView: React.FC<ProjectCostsViewProps> = ({
  user,
  projectId,
  onBack,
}) => {
  const [project, setProject] = useState<SurveyProject | null>(null);
  const [personalRates, setPersonalRates] = useState<PersonalRatesProfile | null>(null);
  const [costEstimate, setCostEstimate] = useState<ProjectCostEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Accordion collapsed state for 7 categories
  const [openSections, setOpenSections] = useState<Record<CostCategory, boolean>>({
    labor: true,
    equipment: true,
    materials: true,
    transportation: true,
    accommodation: true,
    office: true,
    other: true,
  });

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingCostRef = useRef<ProjectCostEstimate | null>(null);
  const isInitialMountRef = useRef(true);

  // Modal: Add Quick Item
  const [quickAddCategory, setQuickAddCategory] = useState<CostCategory | null>(null);
  const [quickItemTitle, setQuickItemTitle] = useState('');
  const [quickItemQty, setQuickItemQty] = useState<string>('1');
  const [quickItemUnit, setQuickItemUnit] = useState('روز');
  const [quickItemRate, setQuickItemRate] = useState<string>('');
  const [quickItemNotes, setQuickItemNotes] = useState('');
  const [quickEquipmentOwnership, setQuickEquipmentOwnership] = useState<'owned' | 'rented'>('owned');
  const [quickEquipmentBaseRate, setQuickEquipmentBaseRate] = useState(0);
  const [quickEquipmentDepreciation, setQuickEquipmentDepreciation] = useState(0);
  const [numericDrafts, setNumericDrafts] = useState<Record<string, string>>({});
  const [numericErrors, setNumericErrors] = useState<Record<string, string>>({});

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string } | null>(null);

  // Load Data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [proj, rates, cost] = await Promise.all([
          projectRepository.getProjectById(user.id, projectId),
          personalRatesRepository.getPersonalRates(user.id),
          projectCostsRepository.getProjectCost(user.id, projectId),
        ]);
        setProject(proj);
        setPersonalRates(rates);
        setCostEstimate(cost);
        pendingCostRef.current = cost;
      } catch (err) {
        console.error('Failed to load project cost data:', err);
        setSaveStatus('error');
      } finally {
        setIsLoading(false);
        setTimeout(() => {
          isInitialMountRef.current = false;
        }, 300);
      }
    };

    fetchData();

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      // Flush pending changes before unmount
      if (pendingCostRef.current && saveStatus === 'dirty') {
        projectCostsRepository.saveProjectCost(pendingCostRef.current);
      }
    };
  }, [user.id, projectId]);

  // Debounced auto-save
  const triggerAutoSave = useCallback((updated: ProjectCostEstimate) => {
    if (isInitialMountRef.current) return;
    pendingCostRef.current = updated;
    setSaveStatus('dirty');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const saved = await projectCostsRepository.saveProjectCost(updated);
        setCostEstimate(saved);
        pendingCostRef.current = saved;
        setSaveStatus('saved');
        const now = new Date();
        setLastSavedTime(now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
        console.error('Auto-save project cost failed:', e);
        setSaveStatus('error');
      }
    }, 700);
  }, []);

  const updateCost = (updater: (prev: ProjectCostEstimate) => ProjectCostEstimate) => {
    setCostEstimate((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      triggerAutoSave(updated);
      return updated;
    });
  };

  const parseNonNegativeMoney = (value: string): number => {
    const normalized = toEnglishDigits(value).trim();
    if (normalized.startsWith('-')) return 0;
    return Math.max(0, parseInt(normalized.replace(/\D/g, ''), 10) || 0);
  };

  const isNegativeInput = (value: string) => /^\s*[-−]/.test(toEnglishDigits(value));

  const setNumericValidation = (key: string, value: string): boolean => {
    const isNegative = isNegativeInput(value);
    setNumericDrafts((prev) => ({ ...prev, [key]: value }));
    setNumericErrors((prev) => {
      const next = { ...prev };
      if (isNegative) next[key] = 'مبلغ نمی‌تواند منفی باشد';
      else delete next[key];
      return next;
    });
    return !isNegative;
  };

  const numericValue = (key: string, value: number | string) =>
    numericDrafts[key] ?? value;

  const clearNumericDraft = (key: string) => setNumericDrafts((prev) => {
    const next = { ...prev }; delete next[key]; return next;
  });

  const NegativeError = ({ fieldKey }: { fieldKey: string }) =>
    numericErrors[fieldKey] ? (
      <p className="mt-1 text-[10px] font-semibold text-rose-600" role="alert">
        {numericErrors[fieldKey]}
      </p>
    ) : null;

  const handleBack = async () => {
    if (pendingCostRef.current) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      try {
        await projectCostsRepository.saveProjectCost(pendingCostRef.current);
      } catch (e) {
        console.error('Flush save failed:', e);
      }
    }
    onBack();
  };

  const toggleSection = (category: CostCategory) => {
    setOpenSections((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  // Line Item Update
  const handleLineItemChange = (
    itemId: string,
    field: 'title' | 'quantity' | 'unit' | 'unitRate' | 'finalAmount' | 'notes',
    value: string
  ) => {
    if (field === 'quantity' || field === 'unitRate' || field === 'finalAmount') {
      if (!setNumericValidation(`${itemId}.${field}`, value)) return;
    }
    updateCost((prev) => {
      const nextItems = prev.items.map((item) => {
        if (item.id !== itemId) return item;

        const updated = { ...item };

        if (field === 'title' || field === 'unit' || field === 'notes') {
          updated[field] = value;
        } else if (field === 'quantity') {
          const clean = toEnglishDigits(value).replace(/[^0-9.]/g, '');
          const qty = Math.max(0, parseFloat(clean) || 0);
          updated.quantity = qty;
          const calc = Math.round(qty * updated.unitRate);
          updated.calculatedAmount = calc;
          if (!updated.isManuallyEdited) {
            updated.finalAmount = calc;
          }
        } else if (field === 'unitRate') {
          const rate = parseNonNegativeMoney(value);
          updated.unitRate = rate;
          if (updated.category === 'equipment') {
            updated.baseRate = Math.max(0, rate - (updated.depreciationAmount || 0));
          }
          const calc = Math.round(updated.quantity * rate);
          updated.calculatedAmount = calc;
          if (!updated.isManuallyEdited) {
            updated.finalAmount = calc;
          }
        } else if (field === 'finalAmount') {
          const finalVal = parseNonNegativeMoney(value);
          updated.finalAmount = finalVal;
          // Mark as manually edited if differs from auto-calc
          updated.isManuallyEdited = finalVal !== updated.calculatedAmount;
        }

        return updated;
      });

      return { ...prev, items: nextItems };
    });
  };

  const handleEquipmentDetailsChange = (
    itemId: string,
    ownership: 'owned' | 'rented',
    depreciationValue?: string
  ) => {
    if (depreciationValue !== undefined && !setNumericValidation(`${itemId}.depreciationAmount`, depreciationValue)) {
      return;
    }
    updateCost((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const previousDepreciation = item.depreciationAmount || 0;
        const baseRate = item.baseRate ?? Math.max(0, item.unitRate - previousDepreciation);
        const depreciation = ownership === 'owned'
          ? parseNonNegativeMoney(depreciationValue ?? String(previousDepreciation))
          : 0;
        const unitRate = baseRate + depreciation;
        const calculatedAmount = Math.round(item.quantity * unitRate);
        return {
          ...item,
          equipmentOwnership: ownership,
          baseRate,
          depreciationAmount: depreciation,
          unitRate,
          calculatedAmount,
          finalAmount: item.isManuallyEdited ? item.finalAmount : calculatedAmount,
        };
      }),
    }));
  };

  const handleResetToCalculated = (itemId: string) => {
    updateCost((prev) => {
      const nextItems = prev.items.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          finalAmount: item.calculatedAmount,
          isManuallyEdited: false,
        };
      });
      return { ...prev, items: nextItems };
    });
  };

  const handleDeleteItemClick = (id: string, title: string) => {
    setItemToDelete({ id, title });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    updateCost((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== itemToDelete.id),
    }));
    setItemToDelete(null);
    setDeleteModalOpen(false);
  };

  // Quick Add Item
  const handleOpenQuickAdd = (cat: CostCategory) => {
    setQuickAddCategory(cat);
    setQuickItemTitle('');
    setQuickItemQty('1');
    setQuickItemNotes('');
    setNumericValidation('quick.quantity', '1');
    setNumericValidation('quick.rate', '0');
    setNumericValidation('quick.depreciation', '0');

    if (cat === 'labor') {
      setQuickItemUnit('روز');
      setQuickItemRate(personalRates?.laborRates[0]?.fullDayRate?.toString() || '');
    } else if (cat === 'equipment') {
      setQuickItemUnit('روز');
      const firstEq = personalRates?.equipmentRates[0];
      const ownership = firstEq?.ownershipType || 'owned';
      const baseRate = firstEq?.dailyRate || 0;
      const depreciation = ownership === 'owned' ? (firstEq?.depreciationDailyRate || 0) : 0;
      const rate = baseRate + depreciation;
      setQuickEquipmentOwnership(ownership);
      setQuickEquipmentBaseRate(baseRate);
      setQuickEquipmentDepreciation(depreciation);
      setQuickItemRate(rate.toString());
    } else if (cat === 'materials') {
      setQuickItemUnit('عدد');
      setQuickItemRate(personalRates?.materialRates[0]?.unitRate?.toString() || '');
    } else if (cat === 'transportation') {
      setQuickItemUnit('روز');
      setQuickItemRate('500000');
    } else if (cat === 'accommodation') {
      setQuickItemUnit('شب');
      setQuickItemRate('800000');
    } else {
      setQuickItemUnit('مورد');
      setQuickItemRate('500000');
    }
  };

  const handleApplyPresetLabor = (roleId: string, isHalfDay = false) => {
    const role = personalRates?.laborRates.find((r) => r.roleId === roleId);
    if (!role) return;
    setQuickItemTitle(`${role.title} (${isHalfDay ? 'نیم‌روز' : 'تمام‌روز'})`);
    setQuickItemUnit(isHalfDay ? 'نیم‌روز' : 'روز');
    setQuickItemRate((isHalfDay ? role.halfDayRate : role.fullDayRate)?.toString() || '');
    setQuickItemNotes(role.notes || '');
  };

  const handleApplyPresetEquipment = (eqId: string) => {
    const eq = personalRates?.equipmentRates.find((e) => e.id === eqId);
    if (!eq) return;
    const totalUnitRate = (eq.dailyRate || 0) + (eq.ownershipType === 'owned' ? (eq.depreciationDailyRate || 0) : 0);
    setQuickEquipmentOwnership(eq.ownershipType);
    setQuickEquipmentBaseRate(eq.dailyRate || 0);
    setQuickEquipmentDepreciation(eq.ownershipType === 'owned' ? (eq.depreciationDailyRate || 0) : 0);
    setQuickItemTitle(`${eq.name} (${eq.ownershipType === 'owned' ? 'ملکی' : 'اجاره‌ای'})`);
    setQuickItemUnit('روز');
    setQuickItemRate(totalUnitRate.toString());
    setQuickItemNotes(eq.notes || '');
  };

  const handleApplyPresetMaterial = (matId: string) => {
    const mat = personalRates?.materialRates.find((m) => m.id === matId);
    if (!mat) return;
    setQuickItemTitle(mat.name);
    setQuickItemUnit(mat.unit);
    setQuickItemRate(mat.unitRate?.toString() || '');
    setQuickItemNotes(mat.notes || '');
  };

  const handleSaveQuickItem = () => {
    if (!quickAddCategory || !quickItemTitle.trim()) return;

    if (
      isNegativeInput(quickItemQty) ||
      isNegativeInput(quickItemRate) ||
      (quickAddCategory === 'equipment' && quickEquipmentOwnership === 'owned' && numericErrors['quick.depreciation'])
    ) return;

    const qty = Math.max(0, parseFloat(toEnglishDigits(quickItemQty).replace(/[^0-9.]/g, '')) || 0);
    const rate = parseNonNegativeMoney(quickItemRate);
    if (qty <= 0 || rate <= 0) return;
    const calc = Math.round(qty * rate);

    const newItem: CostLineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      category: quickAddCategory,
      title: quickItemTitle.trim(),
      quantity: qty,
      unit: quickItemUnit.trim() || 'واحد',
      unitRate: rate,
      calculatedAmount: calc,
      finalAmount: calc,
      isManuallyEdited: false,
      notes: quickItemNotes.trim() || undefined,
      ...(quickAddCategory === 'equipment' ? {
        equipmentOwnership: quickEquipmentOwnership,
        baseRate: quickEquipmentBaseRate,
        depreciationAmount: quickEquipmentOwnership === 'owned' ? quickEquipmentDepreciation : 0,
      } : {}),
    };

    updateCost((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setQuickAddCategory(null);
  };

  // Office Operations Handlers
  const handleOfficeCostChange = (field: 'totalAmount' | 'notes', value: string) => {
    if (field === 'totalAmount' && !setNumericValidation('office.totalAmount', value)) return;
    updateCost((prev) => {
      const office = { ...prev.officeCost };
      if (field === 'totalAmount') {
        office.totalAmount = parseNonNegativeMoney(value);
      } else {
        office.notes = value;
      }
      return { ...prev, officeCost: office };
    });
  };

  // Lump-sum toggles for transport & accommodation
  const handleLumpSumToggle = (category: 'transportation' | 'accommodation', enabled: boolean) => {
    updateCost((prev) => {
      if (category === 'transportation') {
        return {
          ...prev,
          transportationLumpSum: {
            enabled,
            totalAmount: prev.transportationLumpSum?.totalAmount || 0,
            notes: prev.transportationLumpSum?.notes || '',
          },
        };
      } else {
        return {
          ...prev,
          accommodationLumpSum: {
            enabled,
            totalAmount: prev.accommodationLumpSum?.totalAmount || 0,
            notes: prev.accommodationLumpSum?.notes || '',
          },
        };
      }
    });
  };

  const handleLumpSumValueChange = (
    category: 'transportation' | 'accommodation',
    field: 'totalAmount' | 'notes',
    value: string
  ) => {
    if (field === 'totalAmount' && !setNumericValidation(`${category}.totalAmount`, value)) return;
    updateCost((prev) => {
      if (category === 'transportation') {
        const current = prev.transportationLumpSum || { enabled: true, totalAmount: 0, notes: '' };
        return {
          ...prev,
          transportationLumpSum: {
            ...current,
            [field]:
              field === 'totalAmount'
                ? parseNonNegativeMoney(value)
                : value,
          },
        };
      } else {
        const current = prev.accommodationLumpSum || { enabled: true, totalAmount: 0, notes: '' };
        return {
          ...prev,
          accommodationLumpSum: {
            ...current,
            [field]:
              field === 'totalAmount'
                ? parseNonNegativeMoney(value)
                : value,
          },
        };
      }
    });
  };

  if (isLoading || !project || !costEstimate) {
    return <LoadingState message="در حال استخراج هزینه‌های واقعی پروژه..." className="py-20" />;
  }

  const summary = calculateProjectCostSummary(costEstimate);

  // Helper to render Category Line Items Table
  const renderCategoryItems = (cat: CostCategory, catTitle: string, icon: React.ReactNode) => {
    const items = costEstimate.items.filter((i) => i.category === cat);
    const isOpen = openSections[cat];

    let categoryTotal = items.reduce((sum, item) => sum + (Number(item.finalAmount) || 0), 0);
    if (cat === 'transportation' && costEstimate.transportationLumpSum?.enabled) {
      categoryTotal += Number(costEstimate.transportationLumpSum.totalAmount) || 0;
    }
    if (cat === 'accommodation' && costEstimate.accommodationLumpSum?.enabled) {
      categoryTotal += Number(costEstimate.accommodationLumpSum.totalAmount) || 0;
    }

    return (
      <Card variant="default" className="shadow-2xs overflow-hidden border-slate-200">
        <div
          onClick={() => toggleSection(cat)}
          className="flex items-center justify-between p-4 bg-slate-50/90 border-b border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white text-[#0B1D35] border border-slate-200 shadow-2xs">
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">{catTitle}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-semibold">
                  {items.length} ردیف
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                جمع ردیف‌ها: <strong className="text-slate-800">{formatToman(categoryTotal)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenQuickAdd(cat);
              }}
              rightIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs bg-white"
            >
              افزودن ردیف
            </Button>

            <button type="button" onClick={(event) => { event.stopPropagation(); toggleSection(cat); }} aria-label={`${isOpen ? 'بستن' : 'بازکردن'} بخش ${catTitle}`} aria-expanded={isOpen} className="p-1.5 text-slate-400 hover:text-slate-700">
              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="p-4 space-y-4">
            {/* Lump sum controls for transportation or accommodation */}
            {cat === 'transportation' && (
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-indigo-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={costEstimate.transportationLumpSum?.enabled || false}
                      onChange={(e) => handleLumpSumToggle('transportation', e.target.checked)}
                      className="w-4 h-4 rounded text-[#0B1D35]"
                    />
                    <span>ثبت مبلغ کلی ایاب‌وذهاب و سوخت (علاوه بر ردیف‌ها یا به تنهایی)</span>
                  </label>
                </div>
                {costEstimate.transportationLumpSum?.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <div className="relative">
                      <input
                        type="text"
                        value={numericValue('transportation.totalAmount', costEstimate.transportationLumpSum.totalAmount ? costEstimate.transportationLumpSum.totalAmount.toLocaleString('fa-IR') : '')}
                        onChange={(e) =>
                          handleLumpSumValueChange('transportation', 'totalAmount', e.target.value)
                        }
                        placeholder="مبلغ کلی تردد به تومان"
                        className="w-full bg-white border border-slate-300 rounded-lg py-1.5 px-3 pl-12 text-xs font-bold"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                        تومان
                      </span>
                      </div>
                      <NegativeError fieldKey="transportation.totalAmount" />
                    </div>
                    <input
                      type="text"
                      value={costEstimate.transportationLumpSum.notes || ''}
                      onChange={(e) =>
                        handleLumpSumValueChange('transportation', 'notes', e.target.value)
                      }
                      placeholder="توضیحات سوخت و استهلاک تردد..."
                      className="w-full bg-white border border-slate-300 rounded-lg py-1.5 px-3 text-xs text-slate-700"
                    />
                  </div>
                )}
              </div>
            )}

            {cat === 'accommodation' && (
              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={costEstimate.accommodationLumpSum?.enabled || false}
                      onChange={(e) => handleLumpSumToggle('accommodation', e.target.checked)}
                      className="w-4 h-4 rounded text-[#0B1D35]"
                    />
                    <span>ثبت مبلغ کلی اقامت و غذا (علاوه بر ردیف‌ها یا به تنهایی)</span>
                  </label>
                </div>
                {costEstimate.accommodationLumpSum?.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <div className="relative">
                      <input
                        type="text"
                        value={numericValue('accommodation.totalAmount', costEstimate.accommodationLumpSum.totalAmount ? costEstimate.accommodationLumpSum.totalAmount.toLocaleString('fa-IR') : '')}
                        onChange={(e) =>
                          handleLumpSumValueChange('accommodation', 'totalAmount', e.target.value)
                        }
                        placeholder="مبلغ کلی اقامت و تغذیه به تومان"
                        className="w-full bg-white border border-slate-300 rounded-lg py-1.5 px-3 pl-12 text-xs font-bold"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                        تومان
                      </span>
                      </div>
                      <NegativeError fieldKey="accommodation.totalAmount" />
                    </div>
                    <input
                      type="text"
                      value={costEstimate.accommodationLumpSum.notes || ''}
                      onChange={(e) =>
                        handleLumpSumValueChange('accommodation', 'notes', e.target.value)
                      }
                      placeholder="توضیحات هتل و رستوران اکیپ..."
                      className="w-full bg-white border border-slate-300 rounded-lg py-1.5 px-3 text-xs text-slate-700"
                    />
                  </div>
                )}
              </div>
            )}

            {items.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                <p className="text-xs text-slate-500 font-medium">
                  هنوز ردیف هزینه‌ای برای {catTitle} ثبت نشده است.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenQuickAdd(cat)}
                  rightIcon={<Plus className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  افزودن اولین ردیف
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleLineItemChange(item.id, 'title', e.target.value)}
                          placeholder="عنوان هزینه..."
                          className="w-full bg-transparent font-bold text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none px-1.5 py-0.5 rounded"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {item.isManuallyEdited && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                            title="مبلغ نهایی با فرمول محاسبه تفاوت دارد"
                          >
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            ویرایش دستی
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteItemClick(item.id, item.title)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="حذف این ردیف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Numeric Calculation Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center">
                      
                      {/* Quantity & Unit */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">
                          تعداد / مدت
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={numericValue(`${item.id}.quantity`, item.quantity || '')}
                            onChange={(e) =>
                              handleLineItemChange(item.id, 'quantity', e.target.value)
                            }
                            placeholder="۱"
                            className="w-16 bg-white border border-slate-300 rounded-lg py-1 px-2 text-xs font-bold text-center text-slate-900"
                          />
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleLineItemChange(item.id, 'unit', e.target.value)}
                            placeholder="واحد"
                            className="w-20 bg-white border border-slate-300 rounded-lg py-1 px-2 text-xs text-center text-slate-700"
                          />
                        </div>
                        <NegativeError fieldKey={`${item.id}.quantity`} />
                      </div>

                      {/* Unit Rate */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">
                          نرخ واحد (تومان)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={numericValue(`${item.id}.unitRate`, item.unitRate ? item.unitRate.toLocaleString('fa-IR') : '')}
                            inputMode="numeric"
                            onChange={(e) => { setNumericValidation(`${item.id}.unitRate`, e.target.value); }}
                            onBlur={(e) => { const key=`${item.id}.unitRate`; if (!isNegativeInput(e.target.value)) handleLineItemChange(item.id, 'unitRate', e.target.value); clearNumericDraft(key); }}
                            placeholder="۰"
                            className="w-full bg-white border border-slate-300 rounded-lg py-1 px-2.5 pl-10 text-xs font-bold text-slate-900"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">
                            تومان
                          </span>
                        </div>
                        <NegativeError fieldKey={`${item.id}.unitRate`} />
                      </div>

                      {/* Calculated Amount */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">
                          مبلغ محاسبه‌شده
                        </label>
                        <div className="py-1 px-2.5 rounded-lg bg-slate-100/90 border border-slate-200 text-xs font-bold text-slate-700 text-left" dir="ltr">
                          {formatToman(item.calculatedAmount)}
                        </div>
                      </div>

                      {/* Final Amount (Editable) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-slate-900">
                            مبلغ نهایی (تومان) *
                          </label>
                          {item.isManuallyEdited && (
                            <button
                              type="button"
                              onClick={() => handleResetToCalculated(item.id)}
                              className="text-[10px] text-indigo-600 hover:underline"
                            >
                              بازنشانی به فرمول
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={numericValue(`${item.id}.finalAmount`, item.finalAmount ? item.finalAmount.toLocaleString('fa-IR') : '')}
                            onChange={(e) =>
                              handleLineItemChange(item.id, 'finalAmount', e.target.value)
                            }
                            placeholder="۰"
                            className={`w-full border rounded-lg py-1 px-2.5 pl-10 text-xs font-black ${
                              item.isManuallyEdited
                                ? 'bg-amber-50/70 border-amber-400 text-amber-950 focus:border-amber-500'
                                : 'bg-white border-slate-300 text-slate-900 focus:border-[#0B1D35]'
                            }`}
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">
                            تومان
                          </span>
                        </div>
                        <NegativeError fieldKey={`${item.id}.finalAmount`} />
                      </div>

                    </div>

                    {cat === 'equipment' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-lg border border-indigo-100 bg-indigo-50/50 p-2.5">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-indigo-900">وضعیت تجهیز</label>
                          <select
                            value={item.equipmentOwnership || 'owned'}
                            onChange={(e) => handleEquipmentDetailsChange(item.id, e.target.value as 'owned' | 'rented')}
                            className="w-full bg-white border border-indigo-200 rounded-lg py-1 px-2 text-xs"
                          >
                            <option value="owned">ملکی</option>
                            <option value="rented">اجاره‌ای</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-indigo-900">استهلاک روزانه (تومان)</label>
                          <input
                            type="text"
                            value={item.equipmentOwnership === 'rented' ? '' : numericValue(`${item.id}.depreciationAmount`, (item.depreciationAmount || '').toLocaleString('fa-IR'))}
                            onChange={(e) => handleEquipmentDetailsChange(item.id, 'owned', e.target.value)}
                            disabled={item.equipmentOwnership === 'rented'}
                            placeholder={item.equipmentOwnership === 'rented' ? 'برای تجهیز اجاره‌ای ندارد' : '۰'}
                            className="w-full bg-white border border-indigo-200 rounded-lg py-1 px-2 text-xs disabled:bg-slate-100 disabled:text-slate-400"
                          />
                          <NegativeError fieldKey={`${item.id}.depreciationAmount`} />
                        </div>
                      </div>
                    )}

                    {/* Notes Row */}
                    <div className="pt-1 border-t border-slate-100 flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 shrink-0">توضیحات:</span>
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => handleLineItemChange(item.id, 'notes', e.target.value)}
                        placeholder="توضیحات اختیاری این ردیف هزینه..."
                        className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-[11px] text-slate-600 focus:outline-none focus:border-[#0B1D35]"
                      />
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6 pb-28" dir="rtl">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <button
            onClick={handleBack}
            className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-[#0B1D35] hover:text-white transition-colors cursor-pointer"
            title="بازگشت به فهرست پروژه‌ها"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-slate-900 text-base sm:text-lg">
                هزینه‌های واقعی پروژه: {project.title}
              </h2>
              <span className="font-mono text-xs px-2.5 py-0.5 bg-slate-100 text-slate-800 font-bold rounded-md">
                {project.projectCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ثبت و تفکیک ۷ سرفصل بهای تمام‌شده و هزینه‌های عملیاتی صحرایی و دفتری
            </p>
          </div>
        </div>

        {/* Auto-Save & Manual Save */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
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
            variant="primary"
            size="sm"
            onClick={async () => {
              if (costEstimate) {
                setSaveStatus('saving');
                try {
                  const saved = await projectCostsRepository.saveProjectCost(costEstimate);
                  setCostEstimate(saved);
                  setSaveStatus('saved');
                  const now = new Date();
                  setLastSavedTime(now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
                } catch (e) {
                  console.error(e);
                  setSaveStatus('error');
                }
              }
            }}
            rightIcon={<Save className="w-3.5 h-3.5" />}
            className="bg-[#0B1D35] hover:bg-[#0B1D35]/90 text-white font-bold"
          >
            ذخیره دستی
          </Button>
        </div>
      </div>

      {/* 7 CATEGORY SECTIONS */}
      <div className="space-y-4">
        {/* 1. نیروی انسانی */}
        {renderCategoryItems('labor', '۱. نیروی انسانی (اکیپ صحرایی)', <Users className="w-5 h-5 text-teal-600" />)}

        {/* 2. تجهیزات */}
        {renderCategoryItems('equipment', '۲. تجهیزات و ابزار مهندسی', <Wrench className="w-5 h-5 text-indigo-600" />)}

        {/* 3. مصالح مصرفی */}
        {renderCategoryItems('materials', '۳. مصالح و اقلام مصرفی', <Package className="w-5 h-5 text-amber-600" />)}

        {/* 4. رفت‌وآمد */}
        {renderCategoryItems('transportation', '۴. رفت‌وآمد و ترابری', <Car className="w-5 h-5 text-sky-600" />)}

        {/* 5. اقامت و غذا */}
        {renderCategoryItems('accommodation', '۵. اقامت و تغذیه', <Utensils className="w-5 h-5 text-rose-600" />)}

        {/* 6. عملیات دفتری (فقط مبلغ کلی و توضیحات) */}
        <Card variant="default" className="shadow-2xs overflow-hidden border-slate-200">
          <div
            onClick={() => toggleSection('office')}
            className="flex items-center justify-between p-4 bg-slate-50/90 border-b border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white text-emerald-700 border border-slate-200 shadow-2xs">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">۶. عملیات دفتری و پردازش</h3>
                  <Badge variant="neutral" size="sm">
                    مبلغ کلی
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ترسیم نقشه‌ها، محاسبه احجام، ژئورفرنس و آماده‌سازی خروجی‌ها: <strong className="text-slate-800">{formatToman(costEstimate.officeCost?.totalAmount || 0)}</strong>
                </p>
              </div>
            </div>

            <button type="button" onClick={(event) => { event.stopPropagation(); toggleSection('office'); }} aria-label={`${openSections.office ? 'بستن' : 'بازکردن'} بخش عملیات دفتری`} aria-expanded={openSections.office} className="p-1.5 text-slate-400 hover:text-slate-700">
              {openSections.office ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {openSections.office && (
            <div className="p-4 space-y-3.5 bg-white">
              <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  برای عملیات دفتری بر مبنای استاندارد، صرفاً یک مبلغ کلی به همراه شرح فرآیندهای دفتری ثبت می‌گردد.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900">
                    مبلغ کلی عملیات دفتری و کارتوگرافی (تومان) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={numericValue('office.totalAmount', costEstimate.officeCost?.totalAmount ? costEstimate.officeCost.totalAmount.toLocaleString('fa-IR') : '')}
                      onChange={(e) => handleOfficeCostChange('totalAmount', e.target.value)}
                      placeholder="۰"
                      className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 pl-14 text-sm font-bold text-slate-900 focus:border-[#0B1D35]"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                      تومان
                    </span>
                  </div>
                  <NegativeError fieldKey="office.totalAmount" />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-600">
                    توضیحات اختیاری عملیات دفتری
                  </label>
                  <input
                    type="text"
                    value={costEstimate.officeCost?.notes || ''}
                    onChange={(e) => handleOfficeCostChange('notes', e.target.value)}
                    placeholder="مثال: ترسیم ازبیلت اتوکد، محاسبه مساحت‌ها و گزارش تفکیک..."
                    className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-700 focus:border-[#0B1D35]"
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* 7. سایر هزینه‌ها */}
        {renderCategoryItems('other', '۷. سایر هزینه‌های متفرقه', <Coins className="w-5 h-5 text-purple-600" />)}
      </div>

      {/* DETAILED SUMMARY CARDS */}
      <Card variant="default" className="shadow-2xs bg-slate-50/50 border-slate-200">
        <CardHeader className="border-b border-slate-200 pb-3">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-teal-600" />
            <span>خلاصه تفکیک بهای تمام‌شده پروژه</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 block text-[11px]">جمع نیروی انسانی:</span>
              <span className="font-bold text-slate-900 block">{formatToman(summary.totalLabor)}</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 block text-[11px]">جمع تجهیزات:</span>
              <span className="font-bold text-slate-900 block">{formatToman(summary.totalEquipment)}</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 block text-[11px]">جمع مصالح:</span>
              <span className="font-bold text-slate-900 block">{formatToman(summary.totalMaterials)}</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 block text-[11px]">جمع رفت‌وآمد:</span>
              <span className="font-bold text-slate-900 block">{formatToman(summary.totalTransportation)}</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 block text-[11px]">جمع اقامت و غذا:</span>
              <span className="font-bold text-slate-900 block">{formatToman(summary.totalAccommodation)}</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 block text-[11px]">جمع عملیات دفتری:</span>
              <span className="font-bold text-slate-900 block">{formatToman(summary.totalOffice)}</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 block text-[11px]">جمع سایر هزینه‌ها:</span>
              <span className="font-bold text-slate-900 block">{formatToman(summary.totalOther)}</span>
            </div>

            <div className="p-3 bg-[#0B1D35] text-white rounded-xl space-y-1 shadow-xs">
              <span className="text-slate-300 block text-[11px]">جمع کل بهای تمام‌شده:</span>
              <span className="font-black text-sm block">{formatToman(summary.grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FIXED BOTTOM STICKY BAR FOR GRAND TOTAL */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl py-3 px-4" dir="rtl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0B1D35] text-white shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">جمع کل هزینه واقعی پروژه:</span>
              <span className="text-base sm:text-lg font-black text-[#0B1D35]">
                {formatToman(summary.grandTotal)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              onClick={handleBack}
              className="flex-1 sm:flex-none"
            >
              بازگشت به پروژه‌ها
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={async () => {
                await projectCostsRepository.saveProjectCost(costEstimate);
                setSaveStatus('saved');
                onBack();
              }}
              className="flex-1 sm:flex-none bg-[#0B1D35] hover:bg-[#0B1D35]/90 text-white font-bold"
            >
              ذخیره و خروج
            </Button>
          </div>
        </div>
      </div>

      {/* MODAL: QUICK ADD ITEM */}
      <Modal
        isOpen={quickAddCategory !== null}
        onClose={() => setQuickAddCategory(null)}
        title={`افزودن ردیف به سرفصل هزینه`}
        size="md"
      >
        <div className="space-y-4 text-right" dir="rtl">
          
          {/* Presets from personal rates */}
          {quickAddCategory === 'labor' && personalRates && (
            <div className="space-y-1.5 bg-teal-50/70 p-3 rounded-xl border border-teal-200/80">
              <span className="block text-[11px] font-bold text-teal-900">
                انتخاب سریع از نرخ‌های پایه نیروی انسانی:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                {personalRates.laborRates.filter(role => role.enabled !== false && (role.fullDayRate || role.halfDayRate || role.hourlyRate || role.fixedRate)).map((role) => (
                  <div key={role.roleId} className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => handleApplyPresetLabor(role.roleId, false)}
                      className="p-1.5 bg-white border border-teal-300 rounded-lg text-[11px] font-bold text-teal-900 hover:bg-teal-100 transition-colors text-right"
                    >
                      {role.title} (روز کامل)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetLabor(role.roleId, true)}
                      className="p-1 bg-white/80 border border-teal-200 rounded-lg text-[10px] text-teal-800 hover:bg-teal-100 transition-colors text-right"
                    >
                      {role.title} (نیم‌روز)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {quickAddCategory === 'equipment' && personalRates && (
            <div className="space-y-3 bg-indigo-50/70 p-3 rounded-xl border border-indigo-200/80">
              <span className="block text-[11px] font-bold text-indigo-900">
                انتخاب سریع از تجهیزات پایه شما:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap max-h-32 overflow-y-auto">
                {personalRates.equipmentRates.map((eq) => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => handleApplyPresetEquipment(eq.id)}
                    className="p-1.5 bg-white border border-indigo-300 rounded-lg text-[11px] font-bold text-indigo-900 hover:bg-indigo-100 transition-colors"
                  >
                    {eq.name}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label="وضعیت تجهیز جدید"
                  value={quickEquipmentOwnership}
                  onChange={(e) => {
                    const ownership = e.target.value as 'owned' | 'rented';
                    const depreciation = ownership === 'owned' ? quickEquipmentDepreciation : 0;
                    setQuickEquipmentOwnership(ownership);
                    if (ownership === 'rented') setQuickEquipmentDepreciation(0);
                    setQuickItemRate(String(quickEquipmentBaseRate + depreciation));
                  }}
                  className="bg-white border border-indigo-200 rounded-lg py-1.5 px-2 text-xs"
                >
                  <option value="owned">ملکی</option>
                  <option value="rented">اجاره‌ای</option>
                </select>
                <input
                  aria-label="استهلاک تجهیز جدید"
                  type="text"
                  value={quickEquipmentOwnership === 'owned' ? numericValue('quick.depreciation', quickEquipmentDepreciation.toLocaleString('fa-IR')) : ''}
                  onChange={(e) => {
                    if (!setNumericValidation('quick.depreciation', e.target.value)) return;
                    const depreciation = parseNonNegativeMoney(e.target.value);
                    setQuickEquipmentDepreciation(depreciation);
                    setQuickItemRate(String(quickEquipmentBaseRate + depreciation));
                  }}
                  disabled={quickEquipmentOwnership === 'rented'}
                  placeholder={quickEquipmentOwnership === 'rented' ? 'بدون استهلاک' : 'استهلاک روزانه'}
                  className="bg-white border border-indigo-200 rounded-lg py-1.5 px-2 text-xs disabled:bg-slate-100"
                />
                <NegativeError fieldKey="quick.depreciation" />
              </div>
            </div>
          )}

          {quickAddCategory === 'materials' && personalRates && (
            <div className="space-y-1.5 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80">
              <span className="block text-[11px] font-bold text-amber-900">
                انتخاب سریع از مصالح پایه شما:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap max-h-32 overflow-y-auto">
                {personalRates.materialRates.map((mat) => (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => handleApplyPresetMaterial(mat.id)}
                    className="p-1.5 bg-white border border-amber-300 rounded-lg text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition-colors"
                  >
                    {mat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">عنوان هزینه *</label>
            <input
              type="text"
              value={quickItemTitle}
              onChange={(e) => setQuickItemTitle(e.target.value)}
              placeholder="مثال: سرپرست اکیپ / توتال استیشن / میخ فلزی..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">تعداد یا مدت *</label>
              <input
                type="text"
                value={quickItemQty}
                onChange={(e) => {
                  setQuickItemQty(e.target.value);
                  setNumericValidation('quick.quantity', e.target.value);
                }}
                placeholder="۱"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-center text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              />
              <NegativeError fieldKey="quick.quantity" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">واحد سنجش *</label>
              <input
                type="text"
                value={quickItemUnit}
                onChange={(e) => setQuickItemUnit(e.target.value)}
                placeholder="روز / عدد / قوطی..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-center text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">نرخ واحد (تومان) *</label>
            <div className="relative">
              <input
                type="text"
                value={isNegativeInput(quickItemRate) ? quickItemRate : (quickItemRate ? parseNonNegativeMoney(quickItemRate).toLocaleString('fa-IR') : '')}
                onChange={(e) => {
                  setQuickItemRate(e.target.value);
                  if (!setNumericValidation('quick.rate', e.target.value)) return;
                  if (quickAddCategory === 'equipment') {
                    const totalRate = parseNonNegativeMoney(e.target.value);
                    setQuickEquipmentBaseRate(Math.max(0, totalRate - quickEquipmentDepreciation));
                  }
                }}
                placeholder="مثال: ۱,۵۰۰,۰۰۰"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 pl-12 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                تومان
              </span>
            </div>
            <NegativeError fieldKey="quick.rate" />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">توضیحات اختیاری</label>
            <input
              type="text"
              value={quickItemNotes}
              onChange={(e) => setQuickItemNotes(e.target.value)}
              placeholder="جزئیات این ردیف هزینه..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setQuickAddCategory(null)}>
              انصراف
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveQuickItem}
              disabled={!quickItemTitle.trim()}
              className="bg-[#0B1D35] text-white font-bold"
            >
              افزودن ردیف
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: DELETE CONFIRMATION */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="تأیید حذف ردیف هزینه"
        size="sm"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <p className="text-xs text-slate-700 leading-relaxed">
            آیا از حذف ردیف هزینه <strong className="text-[#0B1D35]">«{itemToDelete?.title}»</strong> از این پروژه اطمینان دارید؟
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              حذف ردیف
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
