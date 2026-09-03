import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  Coins,
  TrendingUp,
  Scale,
  ShieldCheck,
  Eye,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Percent,
  Sliders,
  Sparkles,
  HelpCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  SurveyProject,
  SurveyingService,
  ServiceTariff,
  PricingSettings,
  ProjectPriceEstimate,
  PriceLevel,
  SurveyingUnit,
  EmployerPriceSummary,
  ProjectCostEstimate,
  calculateProjectCostSummary,
} from '../../../models';
import {
  projectRepository,
  servicesRepository,
  tariffsRepository,
  pricingSettingsRepository,
  marketPricesRepository,
  projectPricingRepository,
  projectCostsRepository,
} from '../../../repositories';
import { MarketDataMode } from '../../../repositories/interfaces/IMarketPricesRepository';
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { formatToman, toEnglishDigits, toPersianDigits } from '../../../utils/formatters';
import {
  calculateProjectPricing,
  buildEmployerPriceSummary,
  PricingCalculationResult,
} from '../../../utils/pricingEngine';
import { EmployerPreviewModal } from './EmployerPreviewModal';
import { LoadingState } from '../../../components/ui/LoadingState';

interface ProjectPricingEstimatorProps {
  userId: string;
  initialProjectId?: string;
  onNavigateToRates?: () => void;
  onNavigateToCosts?: (projectId: string) => void;
  onEditProjectServices?: (projectId: string) => void;
  marketDataMode: MarketDataMode;
}

export const ProjectPricingEstimator: React.FC<ProjectPricingEstimatorProps> = ({
  userId,
  initialProjectId,
  onNavigateToRates,
  onNavigateToCosts,
  onEditProjectServices,
  marketDataMode,
}) => {
  const [projects, setProjects] = useState<SurveyProject[]>([]);
  const [services, setServices] = useState<SurveyingService[]>([]);
  const [tariffs, setTariffs] = useState<ServiceTariff[]>([]);
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(typeof initialProjectId === 'string' ? initialProjectId : '');
  
  // Loading & Action State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Inputs
  const [selectedServiceId, setSelectedServiceId] = useState<string>('sur_1');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState<SurveyingUnit>('بلوک');
  const [locationCoeff, setLocationCoeff] = useState<number>(1.0);
  const [difficultyCoeff, setDifficultyCoeff] = useState<number>(1.0);
  const [riskCoeff, setRiskCoeff] = useState<number>(1.0);
  const [qualityCoeff, setQualityCoeff] = useState<number>(1.0);
  const [profitPercent, setProfitPercent] = useState<string>('20');
  const [taxesAndDeductions, setTaxesAndDeductions] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<PriceLevel>('standard');
  const [customPriceAmount, setCustomPriceAmount] = useState<string>('');

  // Actual cost from Stage 3
  const [actualCost, setActualCost] = useState<number>(0);
  const [hasCostEstimate, setHasCostEstimate] = useState<boolean>(false);

  // Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [employerSummary, setEmployerSummary] = useState<EmployerPriceSummary | null>(null);

  // Load initial global data
  useEffect(() => {
    const loadInitData = async () => {
      setIsLoading(true);
      try {
        const [projList, svcList, tariffList, sets] = await Promise.all([
          projectRepository.getProjects(userId),
          servicesRepository.getServices(),
          tariffsRepository.getTariffs(),
          pricingSettingsRepository.getSettings(),
        ]);
        setProjects(projList);
        setServices(svcList);
        setTariffs(tariffList);
        setSettings(sets);

        const contextProject = initialProjectId ? projList.find(project => project.id === initialProjectId) : undefined;
        if (contextProject?.services.primarySubServiceId && svcList.some(service => service.id === contextProject.services.primarySubServiceId)) {
          setSelectedServiceId(contextProject.services.primarySubServiceId);
        }
        if ((!selectedProjectId || !projList.some((project) => project.id === selectedProjectId)) && projList.length > 0) {
          setSelectedProjectId(projList[0].id);
        }
      } catch (e) {
        console.error('Failed to load pricing estimator data:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitData();
  }, [userId]);

  // Load project-specific data (Actual costs from stage 3 & previous price estimate)
  useEffect(() => {
    if (!selectedProjectId) return;

    const loadProjectEstimateAndCosts = async () => {
      try {
        // 1. Fetch actual costs from Stage 3
        const costEst = await projectCostsRepository.getProjectCost(userId, selectedProjectId);
        if (costEst && costEst.items && costEst.items.length > 0) {
          const summary = calculateProjectCostSummary(costEst);
          setActualCost(summary.grandTotal);
          setHasCostEstimate(true);
        } else {
          setActualCost(0);
          setHasCostEstimate(false);
        }

        // 2. Fetch existing price estimate for this project if saved before
        const existingPriceEst = await projectPricingRepository.getEstimate(userId, selectedProjectId);
        if (existingPriceEst) {
          if (!initialProjectId) setSelectedServiceId(existingPriceEst.serviceId);
          setQuantity(existingPriceEst.quantity.toString());
          setUnit(existingPriceEst.unit);
          setLocationCoeff(existingPriceEst.locationCoefficient || 1.0);
          setDifficultyCoeff(existingPriceEst.difficultyCoefficient || 1.0);
          setRiskCoeff(existingPriceEst.riskCoefficient || 1.0);
          setQualityCoeff(existingPriceEst.qualityCoefficient || 1.0);
          setProfitPercent(existingPriceEst.profitPercent?.toString() || '20');
          setTaxesAndDeductions(existingPriceEst.taxesAndDeductions?.toString() || '0');
          setNotes(existingPriceEst.notes || '');
          setSelectedLevel(existingPriceEst.selectedLevel || 'standard');
          if (existingPriceEst.customPriceAmount) {
            setCustomPriceAmount(existingPriceEst.customPriceAmount.toString());
          }
        }
      } catch (e) {
        console.error('Failed to load project pricing estimate:', e);
      }
    };

    loadProjectEstimateAndCosts();
  }, [userId, selectedProjectId]);

  // When service changes, update default unit
  const activeService = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId) || services[0];
  }, [services, selectedServiceId]);
  const activeTariff = useMemo(() => tariffs.find((t) => t.serviceId === selectedServiceId && t.isActive), [tariffs, selectedServiceId]);

  useEffect(() => {
    if (activeService) {
      setUnit(activeService.unit);
    }
  }, [activeService]);

  // Market stats for active service
  const [marketStats, setMarketStats] = useState<any>(null);

  useEffect(() => {
    const fetchMarket = async () => {
      if (!selectedServiceId) return;
      const stats = await marketPricesRepository.getMarketStatistics(selectedServiceId, marketDataMode, { projectId: selectedProjectId, estimateId: `est_${selectedProjectId}` });
      setMarketStats(stats);
    };
    fetchMarket();
  }, [selectedServiceId, selectedProjectId, marketDataMode]);

  // Real-time Pricing Calculation
  const calculationResult: PricingCalculationResult | null = useMemo(() => {
    if (!activeService || !activeTariff || !settings || !marketStats) return null;

    const qtyNum = parseFloat(toEnglishDigits(quantity));
    const profitNum = parseFloat(toEnglishDigits(profitPercent));
    const taxesNum = parseFloat(toEnglishDigits(taxesAndDeductions));
    const customNum = customPriceAmount ? parseFloat(toEnglishDigits(customPriceAmount)) : undefined;

    try { return calculateProjectPricing(
      {
        actualCost,
        quantity: qtyNum,
        unit,
        baseRate: activeTariff.baseRate,
        minAmount: activeTariff.minAmount,
        locationCoefficient: locationCoeff,
        difficultyCoefficient: difficultyCoeff,
        riskCoefficient: riskCoeff,
        qualityCoefficient: qualityCoeff,
        profitPercent: profitNum,
        taxesAndDeductions: taxesNum,
        selectedLevel,
        customPriceAmount: customNum,
      },
      marketStats,
      settings
    ); } catch { return null; }
  }, [
    activeService,
    activeTariff,
    settings,
    marketStats,
    actualCost,
    quantity,
    unit,
    locationCoeff,
    difficultyCoeff,
    riskCoeff,
    qualityCoeff,
    profitPercent,
    taxesAndDeductions,
    selectedLevel,
    customPriceAmount,
  ]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const handleSave = async () => {
    if (!selectedProjectId || !calculationResult || !activeService || !activeTariff) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(null);

    try {
      const estimateToSave: ProjectPriceEstimate = {
        id: `est_${selectedProjectId}`,
        userId,
        projectId: selectedProjectId,
        serviceId: activeService.id,
        serviceTitle: activeService.title,
        quantity: parseFloat(toEnglishDigits(quantity)),
        unit,
        locationCoefficient: locationCoeff,
        difficultyCoefficient: difficultyCoeff,
        riskCoefficient: riskCoeff,
        qualityCoefficient: qualityCoeff,
        profitPercent: parseFloat(toEnglishDigits(profitPercent)),
        taxesAndDeductions: parseFloat(toEnglishDigits(taxesAndDeductions)),
        actualCost,
        costBasedPrice: calculationResult.costBasedPrice,
        baseRate: activeTariff.baseRate,
        minAmount: activeTariff.minAmount,
        calculatedTariff: calculationResult.calculatedTariff,
        adjustedTariff: calculationResult.adjustedTariff,
        marketMedian: calculationResult.marketMedian,
        marketTotalMedian: calculationResult.marketTotalMedian,
        referencePrice: calculationResult.referencePrice,
        sampleCount: calculationResult.sampleCount,
        confidenceLevel: calculationResult.confidenceLevel,
        economicPrice: calculationResult.economicPrice,
        standardPrice: calculationResult.standardPrice,
        specializedPrice: calculationResult.specializedPrice,
        selectedLevel,
        finalPrice: calculationResult.finalPrice,
        customPriceAmount: customPriceAmount ? parseFloat(toEnglishDigits(customPriceAmount)) : undefined,
        comparisonLabel: calculationResult.comparisonLabel,
        notes: notes.trim() || undefined,
        warnings: calculationResult.warnings,
        currency: 'TOMAN',
        schemaVersion: 1,
        isDemo: marketDataMode === 'demo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await projectPricingRepository.saveEstimate(estimateToSave);
      setSaveSuccess(`برآورد قیمت پروژه «${selectedProject?.title || ''}» با موفقیت ذخیره شد.`);
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (e) {
      console.error('Failed to save price estimate:', e);
      setErrorMessage('خطا در ذخیره برآورد قیمت پروژه');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEmployerPreview = () => {
    if (!calculationResult || !activeService) return;
    const summary = buildEmployerPriceSummary(
      selectedProjectId,
      activeService.title,
      calculationResult,
      notes,
      parseFloat(toEnglishDigits(quantity)),
      unit
    );
    setEmployerSummary(summary);
    setPreviewModalOpen(true);
  };

  if (isLoading) {
    return <LoadingState message="در حال بارگذاری موتور برآورد و قیمت‌گذاری..." />;
  }

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* 1. Top Project Selector Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#0B1D35]" />
            <h2 className="font-black text-slate-900 text-base sm:text-lg">
              برآورد و قیمت‌گذاری مهندسی خدمات نقشه‌برداری
            </h2>
            <Badge variant="demo" size="sm">مرحله چهارم فعال</Badge>
          </div>
          <p className="text-xs text-slate-500">
            تلفیق بهای تمام‌شده واقعی، تعرفه مرجع، ضرایب محیطی و میانه آماری بازار
          </p>
        </div>

        {/* Project Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 shrink-0">پروژه هدف:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.projectCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Actual Cost Banner (from Stage 3) */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
        hasCostEstimate
          ? 'bg-teal-50/70 border-teal-200 text-teal-950'
          : 'bg-amber-50/70 border-amber-200 text-amber-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            hasCostEstimate ? 'bg-teal-600/15 text-teal-700' : 'bg-amber-600/15 text-amber-700'
          }`}>
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs">
                بهای تمام‌شده واقعی پروژه (مرحله سوم):
              </span>
              <span className="font-black text-sm text-slate-900">
                {formatToman(actualCost)}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {hasCostEstimate
                ? 'محاسبه شده بر مبنای نرخ‌های شخصی، کارکرد اکیپ، استهلاک تجهیزات و سربار'
                : 'برای این پروژه هنوز جدول هزینه ثبت نشده است؛ جهت برآورد دقیق‌تر می‌توانید هزینه واقعی را ثبت کنید.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onNavigateToCosts && selectedProjectId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToCosts(selectedProjectId)}
              rightIcon={<Scale className="w-3.5 h-3.5" />}
            >
              مدیریت هزینه‌های پروژه
            </Button>
          )}
          {onNavigateToRates && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onNavigateToRates}
              rightIcon={<Coins className="w-3.5 h-3.5" />}
            >
              نرخ‌های شخصی من
            </Button>
          )}
        </div>
      </div>

      {/* 3. Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Inputs Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Service Selection Card */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0B1D35]" />
                <span>۱. انتخاب خدمت و مشخصات احجام</span>
              </CardTitle>
              <Badge variant="neutral" size="sm">برداشت و تهیه نقشه</Badge>
            </CardHeader>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  عنوان خدمت نقشه‌برداری *
                </label>
                {initialProjectId ? <div className="service-snapshot-readonly"><strong>{activeService?.title || 'خدمت ثبت‌شده پروژه'}</strong><span>واحد فعلی: {activeService?.unit || unit}</span><Button type="button" variant="outline" size="sm" onClick={() => onEditProjectServices?.(selectedProjectId)}>ویرایش خدمات پروژه</Button></div> : <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} (نرخ پایه: {formatToman(tariffs.find(t => t.serviceId === s.id && t.isActive)?.baseRate || 0)} / {s.unit})
                    </option>
                  ))}
                </select>}
                {activeService?.description && (
                  <p className="text-[11px] text-slate-500 mt-1">{activeService.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    مقدار / حجم کار *
                  </label>
                  <Input
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="مثلاً ۱"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    واحد محاسبه
                  </label>
                  <Input value={unit} disabled className="bg-slate-100/70" />
                </div>
              </div>
            </div>
          </Card>

          {/* Environmental Coefficients Card */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-600" />
                <span>۲. ضرایب تعدیل محیطی، سختی و ریسک</span>
              </CardTitle>
              <Badge variant="neutral" size="sm">دامنه: ۰.۵ تا ۳.۰</Badge>
            </CardHeader>

            <div className="space-y-4 pt-2">
              {/* Location */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">ضریب موقعیت جغرافیایی و دسترسی</span>
                  <span className="font-black text-teal-700">{toPersianDigits(locationCoeff.toFixed(2))}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  value={locationCoeff}
                  onChange={(e) => setLocationCoeff(parseFloat(e.target.value))}
                  className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">
                  فاصله تا مرکز شهر، راه‌های صعب‌العبور، کار در مناطق کوهستانی
                </span>
              </div>

              {/* Difficulty */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">ضریب سختی کار و شرایط محیطی</span>
                  <span className="font-black text-teal-700">{toPersianDigits(difficultyCoeff.toFixed(2))}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  value={difficultyCoeff}
                  onChange={(e) => setDifficultyCoeff(parseFloat(e.target.value))}
                  className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">
                  دید نامناسب، تراکم بالای عوارض کالبدی، شیب تند یا کار در شب
                </span>
              </div>

              {/* Risk */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">ضریب ریسک و مسئولیت حقوقی</span>
                  <span className="font-black text-teal-700">{toPersianDigits(riskCoeff.toFixed(2))}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  value={riskCoeff}
                  onChange={(e) => setRiskCoeff(parseFloat(e.target.value))}
                  className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">
                  حساسیت املاک مجاور، پرونده‌های اختلافی دادگستری و مخاطرات حین کار
                </span>
              </div>

              {/* Quality */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">ضریب کیفیت و سطح تحویل داده</span>
                  <span className="font-black text-teal-700">{toPersianDigits(qualityCoeff.toFixed(2))}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  value={qualityCoeff}
                  onChange={(e) => setQualityCoeff(parseFloat(e.target.value))}
                  className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">
                  دقت میلی‌متری، تهیه نقشه‌های ۳ بعدی، فرمت‌های تخصصی GIS و گزارش تحلیلی
                </span>
              </div>
            </div>
          </Card>

          {/* Profit & Deductions Card */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-600" />
                <span>۳. حاشیه سود، کسورات و حدود اعلامی نقشه‌بردار</span>
              </CardTitle>
            </CardHeader>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    درصد سود منطقی (%)
                  </label>
                  <Input
                    value={profitPercent}
                    onChange={(e) => setProfitPercent(e.target.value)}
                    placeholder="20"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    اعمال مستقیم بر بهای تمام‌شده واقعی
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    مالیات و کسورات قانونی (تومان - اختیاری)
                  </label>
                  <Input
                    value={taxesAndDeductions}
                    onChange={(e) => setTaxesAndDeductions(e.target.value)}
                    placeholder="0"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    معادل: {formatToman(taxesAndDeductions)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  توضیحات و مشخصات اجرایی (اختیاری - در پیش‌نمایش کارفرما نمایش داده می‌شود)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="نکات فنی، شرایط تحویل فایل و تعهدات اجرایی..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </Card>

        </div>

        {/* Right Output & Breakdown Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Main Calculation Card */}
          <div className="bg-gradient-to-b from-slate-900 to-[#0B1D35] text-white p-5 rounded-2xl shadow-md space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div>
                <span className="text-xs text-teal-300 font-semibold block">مبلغ نهایی محاسبه‌شده</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {formatToman(calculationResult?.finalPrice || 0)}
                </h3>
              </div>
              <Badge variant="demo" size="sm">
                {calculationResult?.comparisonLabelText || 'در حال محاسبه'}
              </Badge>
            </div>

            {/* Intermediate Mathematical Breakdown */}
            <div className="space-y-2 text-xs divide-y divide-slate-800">
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-300">قیمت بر مبنای هزینه (Cost-Based):</span>
                <span className="font-bold text-slate-100">
                  {formatToman(calculationResult?.costBasedPrice || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-300">تعرفه تعدیل‌شده (Adjusted Tariff):</span>
                <span className="font-bold text-slate-100">
                  {formatToman(calculationResult?.adjustedTariff || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-300">میانه کل بازار برای مقدار انتخاب‌شده ({toPersianDigits(calculationResult?.sampleCount || 0)} نمونه):</span>
                <span className="font-bold text-slate-100">
                  {formatToman(calculationResult?.marketTotalMedian || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-300">قیمت مرجع تلفیقی:</span>
                <span className="font-bold text-teal-300">
                  {formatToman(calculationResult?.referencePrice || 0)}
                </span>
              </div>
            </div>

            {/* Level Selector Buttons */}
            <div className="pt-2 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 block">
                سطح پیشنهادی مورد نظر خود را انتخاب کنید:
              </span>

              <div className="grid grid-cols-3 gap-2">
                
                {/* Economic */}
                <button
                  type="button"
                  onClick={() => setSelectedLevel('economic')}
                  className={`p-2.5 rounded-xl border text-right transition-all ${
                    selectedLevel === 'economic'
                      ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold shadow-xs'
                      : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                  }`}
                >
                  <span className="text-[11px] block">اقتصادی (-۱۰٪)</span>
                  <span className="text-xs font-black block mt-0.5">
                    {formatToman(calculationResult?.economicPrice || 0)}
                  </span>
                </button>

                {/* Standard */}
                <button
                  type="button"
                  onClick={() => setSelectedLevel('standard')}
                  className={`p-2.5 rounded-xl border text-right transition-all ${
                    selectedLevel === 'standard'
                      ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold shadow-xs'
                      : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                  }`}
                >
                  <span className="text-[11px] block">استاندارد</span>
                  <span className="text-xs font-black block mt-0.5">
                    {formatToman(calculationResult?.standardPrice || 0)}
                  </span>
                </button>

                {/* Specialized */}
                <button
                  type="button"
                  onClick={() => setSelectedLevel('specialized')}
                  className={`p-2.5 rounded-xl border text-right transition-all ${
                    selectedLevel === 'specialized'
                      ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold shadow-xs'
                      : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                  }`}
                >
                  <span className="text-[11px] block">تخصصی (+۱۵٪)</span>
                  <span className="text-xs font-black block mt-0.5">
                    {formatToman(calculationResult?.specializedPrice || 0)}
                  </span>
                </button>

              </div>

              {/* Custom Price Input Option */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLevel('custom')}
                  className={`w-full p-2.5 rounded-xl border text-right text-xs transition-all ${
                    selectedLevel === 'custom'
                      ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span>ورود مبلغ نهایی سفارشی / توافقی</span>
                </button>

                {selectedLevel === 'custom' && (
                  <div className="mt-2 space-y-1">
                    <Input
                      value={customPriceAmount}
                      onChange={(e) => setCustomPriceAmount(e.target.value)}
                      placeholder="مبلغ نهایی مدنظر شما (تومان)"
                      className="bg-white text-slate-900 text-xs"
                    />
                    {customPriceAmount && (
                      <span className="text-[10px] text-teal-300 block">
                        معادل: {formatToman(customPriceAmount)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-700/60">
              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                isLoading={isSaving}
                className="w-full bg-teal-400 text-slate-950 hover:bg-teal-300 font-black"
                rightIcon={<Save className="w-4 h-4" />}
              >
                ذخیره برآورد قیمت پروژه
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={handleOpenEmployerPreview}
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                rightIcon={<Eye className="w-4 h-4" />}
              >
                مشاهده پیش‌نمایش کارفرما (بدون نمایش هزینه‌ها)
              </Button>
            </div>

          </div>

          {/* Calculation Warnings Box */}
          {calculationResult && calculationResult.warnings.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>نکات و هشدارهای محاسباتی:</span>
              </div>
              <ul className="space-y-1 text-xs text-amber-900 pr-4 list-disc">
                {calculationResult.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Statistical Intelligence Summary Box */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-700" />
                <span>ارزیابی آماری و وضعیت اطمینان</span>
              </CardTitle>
            </CardHeader>
            <div className="space-y-2.5 pt-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">سطح اطمینان داده‌های بازار:</span>
                <Badge
                  variant={
                    calculationResult?.confidenceLevel === 'high'
                      ? 'success'
                      : calculationResult?.confidenceLevel === 'medium'
                      ? 'neutral'
                      : 'warning'
                  }
                  size="sm"
                >
                  {calculationResult?.confidenceLevel === 'high'
                    ? 'زیاد (۲۰+ نمونه)'
                    : calculationResult?.confidenceLevel === 'medium'
                    ? 'متوسط (۵ تا ۱۹ نمونه)'
                    : 'کم (< ۵ نمونه)'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">تعداد نمونه‌های معتبر بازار:</span>
                <span className="font-bold text-slate-900">
                  {toPersianDigits(calculationResult?.sampleCount || 0)} مورد
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">میانه واحد نرخ بازار:</span>
                <span className="font-bold text-slate-900">
                  {formatToman(calculationResult?.marketMedian || 0)} / {unit}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                {calculationResult?.confidenceMessage}
              </p>
            </div>
          </Card>

        </div>

      </div>

      {/* 4. Employer Deliverable Preview Modal */}
      <EmployerPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        summary={employerSummary}
        projectTitle={selectedProject?.title}
        clientName={selectedProject?.clientSnapshot?.name}
      />

    </div>
  );
};
