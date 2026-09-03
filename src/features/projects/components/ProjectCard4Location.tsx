import React, { useState } from 'react';
import { MapPin, Navigation, Compass, AlertCircle, Loader2, Map as MapIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { iranProvincesAndCities } from '../../../iran_data';
import { ProjectLocation } from '../../../models/Project';

interface ProjectCard4LocationProps {
  location: ProjectLocation;
  errors: Record<string, string>;
  onChange: (location: ProjectLocation) => void;
}

export const ProjectCard4Location: React.FC<ProjectCard4LocationProps> = ({
  location,
  errors,
  onChange,
}) => {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const provinces = Object.keys(iranProvincesAndCities);
  const availableCities = location.province ? iranProvincesAndCities[location.province] || [] : [];

  const handleProvinceChange = (province: string) => {
    onChange({
      ...location,
      province,
      city: '',
    });
  };

  const handleCityChange = (city: string) => {
    onChange({
      ...location,
      city,
    });
  };

  const handleGetCoordinates = () => {
    setGpsMessage(null);
    if (!navigator.geolocation) {
      setGpsMessage({
        type: 'error',
        text: 'مرورگر شما از قابلیت دریافت موقعیت مکانی (GPS) پشتیبانی نمی‌کند.',
      });
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false);
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        onChange({
          ...location,
          latitude: lat,
          longitude: lng,
        });
        setGpsMessage({
          type: 'success',
          text: `مختصات جغرافیایی با موفقیت دریافت شد: (عرض ${lat}، طول ${lng})`,
        });
      },
      (error) => {
        setGpsLoading(false);
        let errorMsg = 'خطا در خواندن موقعیت مکانی دستگاه.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'دسترسی به موقعیت مکانی در مرورگر تأیید نشد. لطفاً مجوز مکان را در تنظیمات مرورگر فعال کنید یا مختصات را دستی وارد فرمایید.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'سیگنال موقعیت مکانی در دسترس نیست. لطفاً دستی وارد کنید.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'زمان درخواست موقعیت به پایان رسید. لطفاً مجدداً امتحان فرمایید.';
        }
        setGpsMessage({
          type: 'error',
          text: errorMsg,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <Card variant="default" id="card-location-details" className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#0B1D35]" />
          <span>کارت ۴: موقعیت جغرافیایی و نشانی ملک</span>
        </CardTitle>
        <Badge variant="neutral" size="sm">مختصات WGS84 / UTM</Badge>
      </CardHeader>

      <div className="space-y-4 pt-1">
        
        {/* Province & City Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="space-y-1.5 text-right" dir="rtl">
            <label className="block text-xs font-bold text-slate-700">
              استان محل پروژه *
            </label>
            <select
              value={location.province}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className={`w-full bg-slate-50 border rounded-xl py-2.5 px-3 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${
                errors.province
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20'
                  : 'border-slate-300 focus:border-[#0B1D35] focus:ring-[#0B1D35]/15'
              }`}
            >
              <option value="">-- انتخاب استان --</option>
              {provinces.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
            {errors.province && (
              <p className="text-[11px] font-medium text-rose-600 leading-tight">
                {errors.province}
              </p>
            )}
          </div>

          <div className="space-y-1.5 text-right" dir="rtl">
            <label className="block text-xs font-bold text-slate-700">
              شهرستان / شهر محل پروژه *
            </label>
            <select
              value={location.city}
              onChange={(e) => handleCityChange(e.target.value)}
              disabled={!location.province}
              className={`w-full bg-slate-50 border rounded-xl py-2.5 px-3 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:bg-slate-100 ${
                errors.city
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20'
                  : 'border-slate-300 focus:border-[#0B1D35] focus:ring-[#0B1D35]/15'
              }`}
            >
              <option value="">-- انتخاب شهر --</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            {errors.city && (
              <p className="text-[11px] font-medium text-rose-600 leading-tight">
                {errors.city}
              </p>
            )}
          </div>

        </div>

        {/* Detailed Address */}
        <div className="space-y-1.5 text-right" dir="rtl">
          <label className="block text-xs font-bold text-slate-700">
            نشانی دقیق، معبر و پلاک ملک *
          </label>
          <textarea
            value={location.address}
            onChange={(e) => onChange({ ...location, address: e.target.value })}
            rows={2}
            placeholder="مثال: یزد، بلوار جمهوری اسلامی، نبش خیابان امام جعفر صادق، پلاک ۱۸"
            className={`w-full bg-slate-50 border rounded-xl p-3 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${
              errors.address
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900 bg-rose-50/20'
                : 'border-slate-300 focus:border-[#0B1D35] focus:ring-[#0B1D35]/15'
            }`}
          />
          {errors.address && (
            <p className="text-[11px] font-medium text-rose-600 leading-tight">
              {errors.address}
            </p>
          )}
        </div>

        {/* Coordinates Section */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-teal-600" />
              <span>مختصات مرکز ثقل یا بنچ‌مارک مبنا (WGS84 اعشاری) *</span>
            </span>

            <button
              type="button"
              onClick={handleGetCoordinates}
              disabled={gpsLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-[#0B1D35] text-slate-700 text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {gpsLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
              ) : (
                <Navigation className="w-3.5 h-3.5 text-teal-600" />
              )}
              <span>{gpsLoading ? 'دریافت سیگنال GPS...' : 'دریافت مختصات فعلی دستگاه'}</span>
            </button>
          </div>

          {gpsMessage && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                gpsMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{gpsMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <Input
              label="عرض جغرافیایی (Latitude) *"
              type="number"
              step="any"
              value={location.latitude !== null && location.latitude !== undefined ? location.latitude : ''}
              onChange={(e) => {
                const val = e.target.value.trim();
                onChange({ ...location, latitude: val === '' ? null : parseFloat(val) });
              }}
              placeholder="مثال: 31.897400"
              dir="ltr"
              className="font-mono text-center"
              error={errors.latitude}
              helperText="محدوده مجاز بین ۲۰ تا ۴۰ درجه (ایران)"
            />

            <Input
              label="طول جغرافیایی (Longitude) *"
              type="number"
              step="any"
              value={location.longitude !== null && location.longitude !== undefined ? location.longitude : ''}
              onChange={(e) => {
                const val = e.target.value.trim();
                onChange({ ...location, longitude: val === '' ? null : parseFloat(val) });
              }}
              placeholder="مثال: 54.356900"
              dir="ltr"
              className="font-mono text-center"
              error={errors.longitude}
              helperText="محدوده مجاز بین ۴۴ تا ۶۴ درجه (ایران)"
            />
          </div>

          {/* Map Preview Placeholder Box */}
          <div className="pt-2">
            <div className="w-full h-32 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-4 text-slate-500">
              <MapIcon className="w-8 h-8 text-slate-400 mb-1.5 stroke-[1.5]" />
              <p className="text-xs font-bold text-slate-700">
                پیش‌نمایش بصری موقعیت نقشه
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                نمایش نقشه در نسخه عملیاتی پس از انتخاب سرویس نقشه فعال می‌شود.
              </p>
            </div>
          </div>

        </div>

      </div>
    </Card>
  );
};
