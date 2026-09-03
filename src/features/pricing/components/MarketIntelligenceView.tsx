import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart3,
  Filter,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Trash2,
  Layers,
  HelpCircle,
  Activity,
} from 'lucide-react';
import { MarketPriceRecord, MarketStatistics, SurveyingService } from '../../../models';
import { marketPricesRepository, servicesRepository, pricingSettingsRepository } from '../../../repositories';
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatToman, toPersianDigits } from '../../../utils/formatters';
import { LoadingState } from '../../../components/ui/LoadingState';
import { MarketDataMode } from '../../../repositories/interfaces/IMarketPricesRepository';

export const MarketIntelligenceView: React.FC<{marketDataMode:MarketDataMode}> = ({marketDataMode}) => {
  const [services, setServices] = useState<SurveyingService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('sur_1');
  const [records, setRecords] = useState<MarketPriceRecord[]>([]);
  const [stats, setStats] = useState<MarketStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async (serviceId: string) => {
    setIsLoading(true);
    try {
      const [svcs, recs, st] = await Promise.all([
        servicesRepository.getServices(),
        marketPricesRepository.getMarketRecords(serviceId, marketDataMode),
        marketPricesRepository.getMarketStatistics(serviceId, marketDataMode),
      ]);
      setServices(svcs);
      setRecords(recs);
      setStats(st);
    } catch (e) {
      console.error('Failed to load market data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedServiceId);
  }, [selectedServiceId, marketDataMode]);

  const handleResetDemo = async () => {
    try {
      await marketPricesRepository.resetToDemo();
      await loadData(selectedServiceId);
      setActionMessage('داده‌های نمونه بازار به حالت آزمایشی اولیه بازنشانی شدند.');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (e) {
      console.error('Reset failed:', e);
    }
  };

  const handleClearDemo = async () => {
    try {
      await marketPricesRepository.clearDemoData();
      await loadData(selectedServiceId);
      setActionMessage('نمونه‌های آزمایشی پاکسازی شدند و فقط داده‌های واقعی باقی ماندند.');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (e) {
      console.error('Clear demo failed:', e);
    }
  };

  const currentService = services.find((s) => s.id === selectedServiceId);

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Header with Service Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#0B1D35]" />
            <h3 className="font-black text-slate-900 text-sm sm:text-base">
              تحلیل آماری بازار و داده‌های پرت (IQR)
            </h3>
            <Badge variant={marketDataMode==='demo'?'demo':'success'} size="sm">{marketDataMode==='demo'?'داده آزمایشی':'داده واقعی'}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ارزیابی توزیع آماری مبالغ پیشنهادی در بازار و محاسبه چارک‌های Q1، Q3 و میانه
          </p>
        </div>

        {/* Service Picker Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 shrink-0">انتخاب خدمت:</label>
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.unit})
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {isLoading ? (
        <LoadingState message="در حال محاسبه چارک‌ها و آمار بازار..." />
      ) : (
        <>
          {/* Key Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Median */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] text-slate-500 font-medium block">میانه قیمت واحد بازار</span>
              <span className="text-lg sm:text-xl font-black text-slate-900 block">
                {formatToman(stats?.medianPrice || 0)}
              </span>
              <span className="text-[10px] text-teal-700 font-semibold block">
                به ازای هر {currentService?.unit || 'واحد'}
              </span>
            </div>

            {/* Q1 & Q3 */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] text-slate-500 font-medium block">محدوده بین‌چارکی (Q1 تا Q3)</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                {formatToman(stats?.q1Price || 0)} الی {formatToman(stats?.q3Price || 0)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                دامنه ۵۰٪ مرکزی معاملات متعارف
              </span>
            </div>

            {/* Valid Samples Count */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] text-slate-500 font-medium block">نمونه‌های معتبر تحلیل</span>
              <span className="text-lg sm:text-xl font-black text-teal-700 block">
                {toPersianDigits(stats?.validSamples || 0)} نمونه
              </span>
              <span className="text-[10px] text-slate-500 block">
                {stats?.confidenceMessage}
              </span>
            </div>

            {/* Outliers */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] text-slate-500 font-medium block">داده‌های پرت شناسایی‌شده</span>
              <span className="text-lg sm:text-xl font-black text-amber-700 block">
                {toPersianDigits(stats?.outliersCount || 0)} مورد
              </span>
              <span className="text-[10px] text-amber-800 font-medium block">
                کنار گذاشته شده از محاسبه میانه (بدون حذف فیزیکی)
              </span>
            </div>

          </div>

          {/* Statistical IQR Range Card */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#0B1D35]" />
                <span>محدوده پذیرش متعارف بازار (IQR Fences)</span>
              </CardTitle>
              <Badge variant="neutral" size="sm">
                ضریب باکس‌پلات: ۱.۵ × IQR
              </Badge>
            </CardHeader>

            <div className="space-y-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">مرز پایین داده‌های نامتعارف (Lower Fence):</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {formatToman(stats?.lowerBound || 0)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">مرز بالای داده‌های نامتعارف (Upper Fence):</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {stats?.upperBound === Infinity ? 'نامحدود' : formatToman(stats?.upperBound || 0)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">دامنه چارک‌ها (IQR):</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {formatToman(stats?.iqr || 0)}
                  </span>
                </div>
              </div>

              {/* Records List Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                  <span>فهرست نمونه‌های ثبت‌شده برای این خدمت</span>
                  <span className="text-[11px] text-slate-500">
                    مجموع: {toPersianDigits(records.length)} رکورد
                  </span>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-all ${
                        record.isOutlier
                          ? 'bg-amber-50/60 border-amber-300/80 text-amber-950'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {formatToman(record.unitPrice)}
                          </span>
                          <span className="text-[10px] text-slate-500">/ {record.unit}</span>
                          {record.isOutlier ? (
                            <Badge variant="warning" size="sm">
                              داده پرت آماری (خارج از مرز IQR)
                            </Badge>
                          ) : (
                            <Badge variant="success" size="sm">
                              معتبر در محاسبه میانه
                            </Badge>
                          )}
                          {record.isDemo && (
                            <Badge variant="demo" size="sm">داده آزمایشی</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span>حجم: {toPersianDigits(record.quantity)} {record.unit}</span>
                          <span>مبلغ کل: {formatToman(record.totalPrice)}</span>
                          <span>وضعیت: {record.projectStatus === 'completed' ? 'تکمیل‌شده (وزن بالاتر)' : 'پیشنهاد قیمت'}</span>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(record.createdAt).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Dev Demo Controls */}
          <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-600" />
              <span className="text-slate-700 font-semibold">
                مدیریت نمونه‌های نمایشی در محیط آزمایشی (Demo)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDemo}
                rightIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                بازنشانی نمونه‌های پیش‌فرض
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearDemo}
                rightIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                className="text-rose-700 hover:bg-rose-50 border-rose-200"
              >
                حذف داده‌های نمایشی
              </Button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
