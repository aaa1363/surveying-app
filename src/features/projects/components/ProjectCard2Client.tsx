import React, { useState, useEffect } from 'react';
import { User, Building2, Phone, CreditCard, MapPin, UserPlus, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { ClientType, ProjectClient } from '../../../models/Client';
import { clientRepository } from '../../../repositories';

interface ProjectCard2ClientProps {
  userId: string;
  clientId: string;
  clientSnapshot: ProjectClient;
  errors: Record<string, string>;
  onChange: (fields: { clientId?: string; clientSnapshot: ProjectClient }) => void;
}

export const ProjectCard2Client: React.FC<ProjectCard2ClientProps> = ({
  userId,
  clientId,
  clientSnapshot,
  errors,
  onChange,
}) => {
  const [existingClients, setExistingClients] = useState<ProjectClient[]>([]);
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');

  useEffect(() => {
    let isMounted = true;
    clientRepository.getClients(userId).then((list) => {
      if (isMounted) {
        setExistingClients(list);
        if (list.length === 0) {
          setClientMode('new');
        } else if (!clientId && list.length > 0 && !clientSnapshot.fullName && !clientSnapshot.companyName) {
          // If fresh draft, pre-select first client snapshot or keep empty
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleSelectExistingClient = (selectedId: string) => {
    const found = existingClients.find((c) => c.id === selectedId);
    if (found) {
      onChange({
        clientId: found.id,
        clientSnapshot: { ...found },
      });
    }
  };

  const handleTypeChange = (newType: ClientType) => {
    onChange({
      clientId: clientMode === 'new' ? '' : clientId,
      clientSnapshot: {
        ...clientSnapshot,
        type: newType,
      },
    });
  };

  const handleFieldChange = (field: keyof ProjectClient, value: string) => {
    onChange({
      clientId: clientMode === 'new' ? '' : clientId,
      clientSnapshot: {
        ...clientSnapshot,
        [field]: value,
      },
    });
  };

  const isLegal = clientSnapshot.type === 'legal';

  return (
    <Card variant="default" id="card-client-details" className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#0B1D35]" />
          <span>کارت ۲: مشخصات کارفرما و طرف قرارداد</span>
        </CardTitle>
        <Badge variant="demo" size="sm">ذخیره مستقل به‌صورت Snapshot</Badge>
      </CardHeader>

      <div className="space-y-5 pt-1">
        {/* Client Selection Mode: Existing vs New */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setClientMode('existing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                clientMode === 'existing'
                  ? 'bg-[#0B1D35] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>انتخاب از کارفرمایان قبلی ({existingClients.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setClientMode('new');
                onChange({
                  clientId: '',
                  clientSnapshot: {
                    id: '',
                    type: clientSnapshot.type || 'individual',
                    phone: '',
                    environment: 'demo',
                  },
                });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                clientMode === 'new'
                  ? 'bg-[#0B1D35] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>افزودن کارفرمای جدید</span>
            </button>
          </div>

          {/* Existing Client Dropdown if in 'existing' mode */}
          {clientMode === 'existing' && existingClients.length > 0 && (
            <div className="flex-1 max-w-xs">
              <select
                value={clientId}
                onChange={(e) => handleSelectExistingClient(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg py-1.5 px-3 text-xs text-slate-800 focus:border-[#0B1D35] focus:outline-none"
              >
                <option value="">-- انتخاب کارفرما از فهرست --</option>
                {existingClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type === 'legal' ? `[حقوقی] ${c.companyName} (${c.representativeName})` : `[حقیقی] ${c.fullName}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Client Type Toggle: Individual vs Legal */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            نوع شخصیت کارفرما *
          </label>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => handleTypeChange('individual')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                !isLegal
                  ? 'bg-teal-50/70 border-teal-500 text-[#0B1D35] ring-2 ring-teal-500/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User className={`w-4 h-4 ${!isLegal ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>شخص حقیقی (مالک / وکیل)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('legal')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                isLegal
                  ? 'bg-teal-50/70 border-teal-500 text-[#0B1D35] ring-2 ring-teal-500/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Building2 className={`w-4 h-4 ${isLegal ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>شخص حقوقی (شرکت / سازمان)</span>
            </button>
          </div>
        </div>

        {/* Client Fields Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {isLegal ? (
            /* Legal Client Fields */
            <>
              <Input
                label="نام کامل شرکت / سازمان / نهاد *"
                value={clientSnapshot.companyName || ''}
                onChange={(e) => handleFieldChange('companyName', e.target.value)}
                placeholder="مثال: شرکت عمران و سازه کویر"
                error={errors.clientName}
                rightIcon={<Building2 className="w-4 h-4 text-slate-400" />}
                helperText="نام ثبت‌شده در روزنامه رسمی"
              />

              <Input
                label="نام و نام خانوادگی نماینده تام‌الاختیار *"
                value={clientSnapshot.representativeName || ''}
                onChange={(e) => handleFieldChange('representativeName', e.target.value)}
                placeholder="مثال: مهندس محمدرضا شایق"
                error={errors.representativeName}
                rightIcon={<User className="w-4 h-4 text-slate-400" />}
                helperText="شخص امضاکننده قرارداد"
              />

              <Input
                label="سمت سازمانی نماینده (اختیاری)"
                value={clientSnapshot.representativePosition || ''}
                onChange={(e) => handleFieldChange('representativePosition', e.target.value)}
                placeholder="مثال: مدیرعامل / مدیر پروژه"
              />

              <Input
                label="شماره موبایل نماینده (۱۱ رقم با ۰۹) *"
                value={clientSnapshot.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="۰۹۱۳۱۵۱۲۳۴۵"
                dir="ltr"
                className="font-mono text-center"
                error={errors.clientPhone}
                rightIcon={<Phone className="w-4 h-4 text-slate-400" />}
                helperText="جهت هماهنگی و پیامک‌های اطلاع‌رسانی"
              />

              <Input
                label="شناسه ملی ۱۱ رقمی شرکت (اختیاری)"
                value={clientSnapshot.nationalIdentifier || ''}
                onChange={(e) => handleFieldChange('nationalIdentifier', e.target.value)}
                placeholder="۱۰۸۶۱۲۳۴۵۶۷"
                dir="ltr"
                className="font-mono text-center"
                rightIcon={<CreditCard className="w-4 h-4 text-slate-400" />}
              />

              <Input
                label="شماره ثبت شرکت (اختیاری)"
                value={clientSnapshot.registrationNumber || ''}
                onChange={(e) => handleFieldChange('registrationNumber', e.target.value)}
                placeholder="۸۹۴۲"
                dir="ltr"
                className="font-mono text-center"
              />

              <Input
                label="کد اقتصادی (اختیاری)"
                value={clientSnapshot.economicCode || ''}
                onChange={(e) => handleFieldChange('economicCode', e.target.value)}
                placeholder="در صورت وجود"
                dir="ltr"
                className="font-mono text-center"
              />

              <Input
                label="نشانی رسمی دفتر شرکت (اختیاری)"
                value={clientSnapshot.address || ''}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                placeholder="مثال: یزد، بلوار جمهوری، برج سپهر"
                rightIcon={<MapPin className="w-4 h-4 text-slate-400" />}
              />
            </>
          ) : (
            /* Individual Client Fields */
            <>
              <Input
                label="نام و نام خانوادگی کارفرما *"
                value={clientSnapshot.fullName || ''}
                onChange={(e) => handleFieldChange('fullName', e.target.value)}
                placeholder="مثال: دکتر محمد زارع‌زاده"
                error={errors.clientName}
                rightIcon={<User className="w-4 h-4 text-slate-400" />}
                helperText="نام کامل شخص حقیقی مالک یا وکیل"
              />

              <Input
                label="شماره موبایل کارفرما (۱۱ رقم با ۰۹) *"
                value={clientSnapshot.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="۰۹۱۳۳۵۳۴۵۶۷"
                dir="ltr"
                className="font-mono text-center"
                error={errors.clientPhone}
                rightIcon={<Phone className="w-4 h-4 text-slate-400" />}
                helperText="شماره مستقیم جهت هماهنگی‌های کارگاهی"
              />

              <Input
                label="کد ملی ۱۰ رقمی (اختیاری)"
                value={clientSnapshot.nationalId || ''}
                onChange={(e) => handleFieldChange('nationalId', e.target.value)}
                placeholder="۴۴۳۰۲۸۱۹۹۱"
                dir="ltr"
                className="font-mono text-center"
                rightIcon={<CreditCard className="w-4 h-4 text-slate-400" />}
                helperText="جهت درج در قرارداد داخلی و اسناد پروژه"
              />

              <Input
                label="نشانی محل سکونت / دفتر کارفرما (اختیاری)"
                value={clientSnapshot.address || ''}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                placeholder="مثال: یزد، صفائیه، بلوار دانشگاه"
                rightIcon={<MapPin className="w-4 h-4 text-slate-400" />}
              />
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
