import React from 'react';
import { AlertTriangle, Ban, FileQuestion } from 'lucide-react';
import { Button } from './Button';

const StateCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onRetry?: () => void }> = ({ title, description, icon, onRetry }) => (
  <section className="max-w-xl mx-auto my-10 p-6 rounded-2xl border border-slate-200 bg-white text-center space-y-3" role="status">
    <div className="flex justify-center text-slate-500">{icon}</div>
    <h2 className="font-black text-slate-900">{title}</h2>
    <p className="text-sm text-slate-600">{description}</p>
    {onRetry && <Button type="button" onClick={onRetry}>تلاش دوباره</Button>}
  </section>
);

export const ErrorState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => <StateCard title="بارگذاری این بخش انجام نشد" description="لطفاً دوباره تلاش کنید. در صورت تداوم خطا، داده‌های ورودی را بررسی کنید." icon={<AlertTriangle className="w-9 h-9" />} onRetry={onRetry} />;
export const UnauthorizedState: React.FC = () => <StateCard title="دسترسی مجاز نیست" description="نقش کاربری شما اجازه مشاهده این بخش را ندارد." icon={<Ban className="w-9 h-9" />} />;
export const NotFoundState: React.FC = () => <StateCard title="صفحه یافت نشد" description="مسیر یا بخش درخواستی در این نسخه وجود ندارد." icon={<FileQuestion className="w-9 h-9" />} />;
