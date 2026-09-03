import React, { useState } from 'react';
import { Phone, KeyRound, ArrowLeft, Info, Briefcase, Building2, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { UserRole } from '../../models/User';
import { authRepository } from '../../repositories';
import { isValidIranianMobile } from '../../utils/validators';
import { getErrorMessage } from '../../utils/errors';

export interface LoginViewProps {
  onSuccess: () => void;
  onGoToRegister: () => void;
  onGoToWelcome: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onSuccess,
  onGoToRegister,
  onGoToWelcome,
}) => {
  const [phone, setPhone] = useState('09123456789');
  const [otp, setOtp] = useState('12345');
  const [role, setRole] = useState<UserRole>('surveyor');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidIranianMobile(phone)) {
      setError('شماره موبایل وارد شده معتبر نیست. لطفاً شماره ۱۱ رقمی معتبر ایران (مثلاً ۰۹۱۲۳۴۵۶۷۸۹) را وارد نمایید.');
      return;
    }

    if (!otp || otp.trim() !== '12345') {
      setError('کد تأیید آزمایشی نادرست است. لطفاً عدد ثابت ۱۲۳۴۵ را وارد نمایید.');
      return;
    }

    setIsLoading(true);
    try {
      await authRepository.loginWithDemoOtp(phone, otp, role);
      onSuccess();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'خطا در برقراری ارتباط با سرویس ورود'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center p-4 sm:p-6" dir="rtl">
      <div className="max-w-md w-full mx-auto space-y-5">
        
        {/* Back navigation */}
        <button
          onClick={onGoToWelcome}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>بازگشت به صفحه خوش‌آمد</span>
        </button>

        <Card variant="engineering">
          {/* Header */}
          <div className="text-center space-y-1 mb-5">
            <div className="flex justify-center mb-2">
              <Badge variant="demo" size="sm">
                محیط شبیه‌سازی ورود (بدون ارسال پیامک واقعی)
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-slate-900">ورود به سامانه نقشه‌برداری</h2>
            <p className="text-xs text-slate-500">
              جهت تست سریع، شماره همراه و کد آزمایشی ثابت را وارد کنید.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mobile input */}
            <Input
              label="شماره تلفن همراه"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError(null);
              }}
              placeholder="09123456789"
              dir="ltr"
              className="text-center font-mono font-bold tracking-wider"
              rightIcon={<Phone className="w-4 h-4" />}
            />

            {/* Fixed Demo OTP */}
            <div className="space-y-1">
              <Input
                label="کد تأیید آزمایشی (ثابت)"
                type="text"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setError(null);
                }}
                placeholder="12345"
                dir="ltr"
                className="text-center font-mono font-bold text-base tracking-widest"
                rightIcon={<KeyRound className="w-4 h-4" />}
                helperText="کد ورود تست به صورت ثابت ۱۲۳۴۵ تنظیم شده است."
              />
            </div>

            {/* Role selector for demo purpose */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700 text-right">
                نقش کاربری جهت بررسی (Demo):
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('surveyor')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    role === 'surveyor'
                      ? 'bg-[#0B1D35] text-white border-[#0B1D35] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-teal-400" />
                  <span>نقشه‌بردار (کامل)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    role === 'client'
                      ? 'bg-[#0B1D35] text-white border-[#0B1D35] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>کارفرما (موقت)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    role === 'admin' ? 'bg-amber-700 text-white border-amber-700 shadow-xs' : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>مدیر</span>
                  <span className="text-[9px] opacity-80">ورود نمایشی</span>
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 leading-relaxed font-medium">
                {error}
              </div>
            )}

            {/* Developer architectural notice */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>یادداشت معماری:</strong> در نسخه عملیاتی، این بخش به سرویس OTP پیامکی مورد تأیید متصل خواهد شد.
              </p>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              rightIcon={<CheckCircle className="w-5 h-5 text-teal-400" />}
            >
              تأیید و ورود به پنل
            </Button>
          </form>

          {/* Switch to Register */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              هنوز حسابی ایجاد نکرده‌اید؟{' '}
              <button
                onClick={onGoToRegister}
                className="text-[#0B1D35] font-bold hover:underline cursor-pointer"
              >
                ثبت‌نام سریع
              </button>
            </p>
          </div>
        </Card>

      </div>
    </div>
  );
};
