import React from 'react';
import {
  Layers,
  Building2,
  Map,
  HardHat,
  Milestone,
  Compass,
  Camera,
  Globe,
  MoreHorizontal,
  Check,
  Star,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { SERVICES_CATALOG, ServiceCategory } from '../../../data/servicesCatalog';
import { ProjectServiceSelection } from '../../../models/Project';

interface ProjectCard3ServicesProps {
  services: ProjectServiceSelection;
  errors: Record<string, string>;
  onChange: (services: ProjectServiceSelection) => void;
}

export const ProjectCard3Services: React.FC<ProjectCard3ServicesProps> = ({
  services,
  errors,
  onChange,
}) => {
  const selectedCategory = SERVICES_CATALOG.find((c) => c.id === services.mainCategoryId);

  const getCategoryIcon = (iconName: string, active: boolean) => {
    const cls = `w-5 h-5 ${active ? 'text-teal-600' : 'text-slate-500'}`;
    switch (iconName) {
      case 'Building2':
        return <Building2 className={cls} />;
      case 'Map':
        return <Map className={cls} />;
      case 'HardHat':
        return <HardHat className={cls} />;
      case 'Milestone':
        return <Milestone className={cls} />;
      case 'Layers':
        return <Layers className={cls} />;
      case 'Compass':
        return <Compass className={cls} />;
      case 'Camera':
        return <Camera className={cls} />;
      case 'Globe':
        return <Globe className={cls} />;
      default:
        return <MoreHorizontal className={cls} />;
    }
  };

  const handleCategorySelect = (cat: ServiceCategory) => {
    // When changing category, clear subservices and require manual selection
    onChange({
      mainCategoryId: cat.id,
      selectedSubServiceIds: [],
      primarySubServiceId: '',
      customServiceTitle: services.customServiceTitle,
    });
  };

  const handleToggleSubService = (subId: string) => {
    const isSelected = services.selectedSubServiceIds.includes(subId);
    let updatedList: string[];

    if (isSelected) {
      updatedList = services.selectedSubServiceIds.filter((id) => id !== subId);
    } else {
      updatedList = [...services.selectedSubServiceIds, subId];
    }

    // Adjust primary if unselected
    let newPrimary = services.primarySubServiceId;
    if (newPrimary === subId && isSelected) {
      newPrimary = updatedList.length > 0 ? updatedList[0] : '';
    } else if (!newPrimary && updatedList.length > 0) {
      newPrimary = updatedList[0];
    }

    onChange({
      ...services,
      selectedSubServiceIds: updatedList,
      primarySubServiceId: newPrimary,
    });
  };

  const handleSetPrimary = (subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Ensure it is in selected list
    let updatedList = [...services.selectedSubServiceIds];
    if (!updatedList.includes(subId)) {
      updatedList.push(subId);
    }
    onChange({
      ...services,
      selectedSubServiceIds: updatedList,
      primarySubServiceId: subId,
    });
  };

  return (
    <Card variant="default" id="card-services-selection" className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#0B1D35]" />
          <span>کارت ۳: شاخه تخصصی و خدمات نقشه‌برداری</span>
        </CardTitle>
        <Badge variant="neutral" size="sm">۹ شاخه استاندارد مهندسی</Badge>
      </CardHeader>

      <div className="space-y-6 pt-1">
        
        {/* Step 1: Main Category Selection Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800">
              ۱. انتخاب شاخه اصلی عملیات نقشه‌برداری *
            </label>
            {selectedCategory && (
              <span className="text-[11px] text-slate-500">
                دسته‌بندی فعال: <strong className="text-[#0B1D35]">{selectedCategory.title}</strong>
              </span>
            )}
          </div>

          {errors.mainCategory && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
              {errors.mainCategory}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {SERVICES_CATALOG.map((cat) => {
              const isSelected = cat.id === services.mainCategoryId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={`p-3 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/70 border-teal-500 shadow-xs ring-2 ring-teal-500/20'
                      : 'bg-white border-slate-200/90 hover:bg-slate-50/80 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-white shadow-2xs' : 'bg-slate-100'}`}>
                    {getCategoryIcon(cat.iconName, isSelected)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#0B1D35]' : 'text-slate-800'}`}>
                        {cat.number}. {cat.title}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 leading-tight">
                      {cat.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Sub-services in Selected Category */}
        {selectedCategory ? (
          <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/90">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>۲. انتخاب ریزخدمات و تعیین «خدمت اصلی پروژه» *</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    (حداقل یک مورد و ستاره‌دار کردن خدمت اصلی)
                  </span>
                </h4>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>نشان ستاره = خدمت اصلی و مبنای قیمت‌گذاری</span>
              </div>
            </div>

            {errors.services && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                {errors.services}
              </p>
            )}

            <div className="space-y-2 pt-1">
              {selectedCategory.subServices.map((sub) => {
                const isChecked = services.selectedSubServiceIds.includes(sub.id);
                const isPrimary = services.primarySubServiceId === sub.id;

                return (
                  <div
                    key={sub.id}
                    onClick={() => handleToggleSubService(sub.id)}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isChecked
                        ? isPrimary
                          ? 'bg-white border-amber-300 ring-2 ring-amber-400/30 shadow-xs'
                          : 'bg-white border-teal-300 shadow-2xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                    }`}
                  >
                    {/* Checkbox and title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isChecked
                            ? 'bg-[#0B1D35] border-[#0B1D35] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <span className={`text-xs font-medium ${isChecked ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                        {sub.title}
                      </span>
                    </div>

                    {/* Primary Service Selector (Star / Badge) */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleSetPrimary(sub.id, e)}
                        title={isPrimary ? 'خدمت اصلی پروژه' : 'انتخاب به عنوان خدمت اصلی'}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isPrimary
                            ? 'bg-amber-500 text-white shadow-xs'
                            : isChecked
                              ? 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800'
                              : 'bg-transparent text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isPrimary ? 'fill-white' : ''}`} />
                        <span>{isPrimary ? 'خدمت اصلی پروژه' : 'انتخاب به عنوان اصلی'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* If custom subservice is chosen */}
            {services.selectedSubServiceIds.includes('oth_custom') && (
              <div className="pt-2">
                <Input
                  label="عنوان و شرح خدمت سفارشی شما *"
                  value={services.customServiceTitle || ''}
                  onChange={(e) => onChange({ ...services, customServiceTitle: e.target.value })}
                  placeholder="مثال: اندازه‌گیری ارتعاشات دقیق سازه‌ای توربین"
                  error={errors.customServiceTitle}
                  helperText="این عنوان در پیش‌فاکتور و شرح خدمات پروژه منعکس خواهد شد"
                />
              </div>
            )}

          </div>
        ) : (
          <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
            لطفاً ابتدا یکی از شاخه‌های اصلی بالا را انتخاب کنید تا ریزخدمات مربوطه نمایش داده شوند.
          </div>
        )}

      </div>
    </Card>
  );
};
