import React, { useState } from 'react';
import { UserPlus, ArrowLeft, Building2, User, Phone, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EntityType, UserRole } from '../../models/User';
import { authRepository } from '../../repositories';
import { isValidIranianMobile } from '../../utils/validators';
import { getErrorMessage } from '../../utils/errors';

export interface RegisterViewProps {
  onSuccess: () => void;
  onGoToLogin: () => void;
  onGoToWelcome: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onSuccess,
  onGoToLogin,
  onGoToWelcome,
}) => {
  const [entityType, setEntityType] = useState<EntityType>('individual');
  const [role, setRole] = useState<UserRole>('surveyor');

  // Individual fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('09');

  // Legal fields
  const [companyName, setCompanyName] = useState('');
  const [representativeName, setRepresentativeName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidIranianMobile(phone)) {
      setError('شماره تلفن همراه نامعتبر است. لطفاً شماره ۱۱ رقمی معتبر ایران را وارد نمایید.');
      return;
    }

    if (entityType === 'individual') {
      if (!firstName.trim() || !lastName.trim()) {
        setError('لطفاً نام و نام خانوادگی را وارد فرمایید.');
        return;
      }
    } else {
      if (!companyName.trim() || !representativeName.trim()) {
        setError('لطفاً نام شرکت و نام نماینده را وارد فرمایید.');
        return;
      }
    }

    setIsLoading(true);
    try {
      await authRepository.register({
        entityType,
        phone,
        role,
        firstName: entityType === 'individual' ? firstName : undefined,
        lastName: entityType === 'individual' ? lastName : undefined,
        companyName: entityType === 'legal' ? companyName : undefined,
        representativeName: entityType === 'legal' ? representativeName : undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'خطا در ثبت‌نام کاربر'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center p-4 sm:p-6" dir="rtl">
      <div className="max-w-md w-full mx-auto space-y-5">
        
        {/* Back button */}
        <button
          onClick={onGoToWelcome}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>بازگشت به صفحه خوش‌آمد</span>
        </button>

        <Card variant="engineering">
          {/* Header */}
          <div className="text-center space-y-1 mb-4">
            <div className="flex justify-center mb-2">
              <Badge variant="demo" size="sm">
                ثبت‌نام سریع در نسخه آزمایشی
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-slate-900">ایجاد حساب کاربری جدید</h2>
            <p className="text-xs text-slate-500">
              نوع حساب خود را انتخاب کرده و مشخصات اولیه را تکمیل فرمایید.
            </p>
          </div>

          {/* Entity Type Selector */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => setEntityType('individual')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                entityType === 'individual'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>شخص حقیقی</span>
            </button>

            <button
              type="button"
              onClick={() => setEntityType('legal')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                entityType === 'legal'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>شرکت حقوقی</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Conditional Form Fields */}
            {entityType === 'individual' ? (
              <div className="grid grid-cols-2 gap-2.5">
                <Input
                  label="نام"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="مثال: علیرضا"
                />
                <Input
                  label="نام خانوادگی"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="مثال: دهقانی"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  label="نام شرکت یا مهندسین مشاور"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="مثال: مهندسین مشاور نقشه‌آرا"
                  rightIcon={<Building2 className="w-4 h-4" />}
                />
                <Input
                  label="نام و نام خانوادگی نماینده"
                  type="text"
                  value={representativeName}
                  onChange={(e) => setRepresentativeName(e.target.value)}
                  placeholder="مثال: مهندس حسینی"
                />
              </div>
            )}

            {/* Mobile Number */}
            <Input
              label={entityType === 'individual' ? 'شماره موبایل' : 'شماره موبایل نماینده'}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09123456789"
              dir="ltr"
              className="text-center font-mono font-bold"
              rightIcon={<Phone className="w-4 h-4" />}
            />

            {/* Role Selection */}
            <div className="space-y-1 pt-1">
              <label className="block text-xs font-bold text-slate-700 text-right">
                جایگاه در سیستم:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('surveyor')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    role === 'surveyor'
                      ? 'bg-[#0B1D35] text-white border-[#0B1D35]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  مهندس نقشه‌بردار
                </button>
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    role === 'client'
                      ? 'bg-[#0B1D35] text-white border-[#0B1D35]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  کارفرما / سفارش‌دهنده
                </button>
              </div>
            </div>

            {/* Error notice */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 leading-relaxed font-medium">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              className="mt-2"
              rightIcon={<UserPlus className="w-5 h-5 text-teal-400" />}
            >
              تکمیل ثبت‌نام و ورود به پنل
            </Button>
          </form>

          {/* Switch to Login */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              قبلاً ثبت‌نام کرده‌اید؟{' '}
              <button
                onClick={onGoToLogin}
                className="text-[#0B1D35] font-bold hover:underline cursor-pointer"
              >
                ورود به حساب
              </button>
            </p>
          </div>
        </Card>

      </div>
    </div>
  );
};
