import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, Plus, Trash2, Edit3, CheckCircle2, FileBadge2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { User } from '../../models/User';
import { SurveyorCredential, CredentialType } from '../../models/Stage6Models';
import { credentialsRepository } from '../../repositories';

export interface SurveyorCredentialsManagerProps {
  user: User;
}

export const SurveyorCredentialsManager: React.FC<SurveyorCredentialsManagerProps> = ({ user }) => {
  const [credentials, setCredentials] = useState<SurveyorCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCred, setEditingCred] = useState<SurveyorCredential | null>(null);

  // Form states
  const [type, setType] = useState<CredentialType>('engineering_license');
  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [credentialNumber, setCredentialNumber] = useState('');
  const [issueDateJalali, setIssueDateJalali] = useState('۱۳۹۸/۰۱/۰۱');
  const [expiryDateJalali, setExpiryDateJalali] = useState('۱۴۰۶/۰۱/۰۱');
  const [gradeOrBase, setGradeOrBase] = useState('پایه یک');
  const [isPublic, setIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await credentialsRepository.getCredentialsByUserId(user.id);
      setCredentials(data);
    } catch (e) {
      console.error('Failed to load credentials:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  const handleOpenAdd = () => {
    setEditingCred(null);
    setType('engineering_license');
    setTitle('');
    setIssuer('سازمان نظام مهندسی ساختمان');
    setCredentialNumber('');
    setIssueDateJalali('۱۳۹۸/۰۱/۰۱');
    setExpiryDateJalali('۱۴۰۶/۰۱/۰۱');
    setGradeOrBase('پایه یک');
    setIsPublic(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cred: SurveyorCredential) => {
    setEditingCred(cred);
    setType(cred.type);
    setTitle(cred.title);
    setIssuer(cred.issuer);
    setCredentialNumber(cred.credentialNumber);
    setIssueDateJalali(cred.issueDateJalali);
    setExpiryDateJalali(cred.expiryDateJalali || '');
    setGradeOrBase(cred.gradeOrBase || '');
    setIsPublic(cred.isPublic);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingCred) {
        await credentialsRepository.updateCredential(editingCred.id, {
          type,
          title,
          issuer,
          credentialNumber,
          issueDateJalali,
          expiryDateJalali: expiryDateJalali || undefined,
          gradeOrBase: gradeOrBase || undefined,
          isPublic,
        });
      } else {
        await credentialsRepository.addCredential({
          userId: user.id,
          type,
          title,
          issuer,
          credentialNumber,
          issueDateJalali,
          expiryDateJalali: expiryDateJalali || undefined,
          gradeOrBase: gradeOrBase || undefined,
          isVerified: false,
          isPublic,
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (e) {
      console.error('Failed to save credential:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('آیا از حذف این گواهینامه اطمینان دارید؟')) return;
    try {
      await credentialsRepository.deleteCredential(id);
      await loadData();
    } catch (e) {
      console.error('Failed to delete credential:', e);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 text-base">پروانه‌های اشتغال و مدارک حرفه‌ای</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            پروانه‌های نظام مهندسی، کارشناسی رسمی و گواهینامه‌های رسمی معتبر برای جلب اعتماد کارفرما
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAdd}
          rightIcon={<Plus className="w-4 h-4 text-teal-400" />}
        >
          ثبت گواهینامه جدید
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-slate-500">در حال بارگذاری مدارک...</div>
      ) : credentials.length === 0 ? (
        <EmptyState
          icon={<FileBadge2 className="w-10 h-10 text-slate-400" />}
          title="هیچ پروانه یا گواهینامه‌ای ثبت نشده است"
          description="با ثبت پروانه اشتغال نظام مهندسی یا کارشناسی رسمی، نشان «مدارک ثبت‌شده — بررسی نمایشی» روی پروفایل شما نمایش داده می‌شود."
          actionText="ثبت پروانه نظام مهندسی"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {credentials.map((cred) => (
            <Card key={cred.id} variant="default" className="p-4 relative hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{cred.title}</span>
                    {cred.isVerified && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        ثبت‌شده — بررسی نمایشی
                      </span>
                    )}
                    {cred.gradeOrBase && (
                      <Badge variant="accent" size="sm">
                        {cred.gradeOrBase}
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div>مرجع صادرکننده: <span className="font-semibold text-slate-800">{cred.issuer}</span></div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                      <span>شماره پروانه: {cred.credentialNumber}</span>
                      {cred.expiryDateJalali && <span>• انقضا: {cred.expiryDateJalali}</span>}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(cred)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                    title="ویرایش"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cred.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCred ? 'ویرایش گواهینامه یا پروانه' : 'ثبت گواهینامه یا پروانه جدید'}
      >
        <form onSubmit={handleSave} className="space-y-4 pt-1" dir="rtl">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">دسته‌بندی مدرک *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CredentialType)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1D35] outline-hidden text-slate-800"
            >
              <option value="engineering_license">پروانه نظام مهندسی ساختمان (پایه ۱، ۲، ۳ یا ارشد)</option>
              <option value="judicial_expert">پروانه کارشناس نقشه‌برداری با مدرک ثبت‌شده / قوه قضائیه</option>
              <option value="drone_pilot">گواهینامه خلبانی و نقشه‌برداری پهپاد</option>
              <option value="society_membership">عضویت جامعه صنفی مهندسان نقشه‌بردار</option>
              <option value="certificate">سایر گواهینامه‌های تخصصی و دوره‌های معتبر</option>
            </select>
          </div>

          <Input
            label="عنوان کامل مدرک *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: پروانه اشتغال به کار مهندسی پایه یک نظارت و طراحی"
            required
          />

          <Input
            label="مرجع و سازمان صادرکننده *"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder="مثال: سازمان نظام مهندسی ساختمان استان یزد"
            required
          />

          <Input
            label="شماره پروانه یا گواهینامه *"
            value={credentialNumber}
            onChange={(e) => setCredentialNumber(e.target.value)}
            placeholder="مثال: ن-۲۴۸۸۹-یزد"
            dir="ltr"
            className="font-mono text-center"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="تاریخ صدور *"
              value={issueDateJalali}
              onChange={(e) => setIssueDateJalali(e.target.value)}
              placeholder="۱۳۹۸/۰۱/۰۱"
              dir="ltr"
              className="font-mono text-center"
              required
            />
            <Input
              label="تاریخ اعتبار / انقضا"
              value={expiryDateJalali}
              onChange={(e) => setExpiryDateJalali(e.target.value)}
              placeholder="۱۴۰۶/۰۱/۰۱"
              dir="ltr"
              className="font-mono text-center"
            />
          </div>

          <Input
            label="پایه / درجه صلاحیت (اختیاری)"
            value={gradeOrBase}
            onChange={(e) => setGradeOrBase(e.target.value)}
            placeholder="مثال: پایه یک ارشد / صلاحیت کشوری"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublicCred"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
            />
            <label htmlFor="isPublicCred" className="text-xs text-slate-700 cursor-pointer select-none">
              نمایش در پروفایل عمومی کارفرمایان
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              انصراف
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
              ذخیره مدرک
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
