import React, { useState } from 'react';
import {
  Calculator,
  Sliders,
  TrendingUp,
  Coins,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { ProjectPricingEstimator } from './components/ProjectPricingEstimator';
import { AdminTariffSettings } from './components/AdminTariffSettings';
import { MarketIntelligenceView } from './components/MarketIntelligenceView';
import { Badge } from '../../components/ui/Badge';
import { UserRole } from '../../models';
import { MarketDataMode } from '../../repositories/interfaces/IMarketPricesRepository';
import { canViewTariffs } from '../../utils/pricingAccess';

export type PricingTab = 'estimator' | 'admin_tariffs' | 'market_intelligence';

interface PricingViewProps {
  userId: string;
  userName?: string;
  userRole: UserRole;
  initialProjectId?: string;
  initialTab?: PricingTab;
  onNavigateToRates?: () => void;
  onNavigateToCosts?: (projectId: string) => void;
  onBackToDashboard?: () => void;
  onEditProjectServices?: (projectId: string) => void;
}

export const PricingView: React.FC<PricingViewProps> = ({
  userId,
  userName = 'مهندس نقشه‌بردار',
  userRole,
  initialProjectId,
  initialTab = 'estimator',
  onNavigateToRates,
  onNavigateToCosts,
  onBackToDashboard,
  onEditProjectServices,
}) => {
  const [activeTab, setActiveTab] = useState<PricingTab>(initialTab);
  const [marketDataMode,setMarketDataMode]=useState<MarketDataMode>('demo');

  if(!canViewTariffs(userRole)) return <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 font-bold">دسترسی کارفرما به تنظیمات قیمت‌گذاری مجاز نیست.</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" dir="rtl">
      
      {/* Navigation Tabs Header */}
      <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        
        <div className="flex items-center gap-1.5 overflow-x-auto p-0.5">
          {/* Tab 1: Estimator */}
          <button
            type="button"
            onClick={() => setActiveTab('estimator')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'estimator'
                ? 'bg-[#0B1D35] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>برآورد قیمت پروژه</span>
          </button>

          {/* Tab 2: Admin Tariffs */}
          <button
            type="button"
            onClick={() => setActiveTab('admin_tariffs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'admin_tariffs'
                ? 'bg-[#0B1D35] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>تعرفه مرجع و ضرایب مدیر</span>
          </button>

          {/* Tab 3: Market Intelligence */}
          <button
            type="button"
            onClick={() => setActiveTab('market_intelligence')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'market_intelligence'
                ? 'bg-[#0B1D35] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>تحلیل آماری بازار (IQR)</span>
          </button>
        </div>

        {/* Action Link: Back to Dashboard */}
        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <span>بازگشت به داشبورد</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs"><span className="font-bold">منبع داده بازار</span><div className="flex gap-2"><button type="button" onClick={()=>setMarketDataMode('demo')} className={`px-3 py-1.5 rounded-lg ${marketDataMode==='demo'?'bg-amber-600 text-white':'bg-slate-100'}`}>داده آزمایشی</button><button type="button" onClick={()=>setMarketDataMode('real')} className={`px-3 py-1.5 rounded-lg ${marketDataMode==='real'?'bg-emerald-700 text-white':'bg-slate-100'}`}>داده واقعی</button></div></div>

      {/* Tab Content Display */}
      {activeTab === 'estimator' && (
        <ProjectPricingEstimator
          userId={userId}
          initialProjectId={initialProjectId}
          onNavigateToRates={onNavigateToRates}
          onNavigateToCosts={onNavigateToCosts}
          marketDataMode={marketDataMode}
          onEditProjectServices={onEditProjectServices}
        />
      )}

      {activeTab === 'admin_tariffs' && (
        <AdminTariffSettings currentUser={{id:userId,name:userName,role:userRole}} />
      )}

      {activeTab === 'market_intelligence' && (
        <MarketIntelligenceView marketDataMode={marketDataMode} />
      )}

    </div>
  );
};
