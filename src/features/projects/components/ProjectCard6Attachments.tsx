import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Trash2, Info, FileCode2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { ProjectAttachment } from '../../../models/Project';

interface ProjectCard6AttachmentsProps {
  attachments: ProjectAttachment[];
  onChange: (attachments: ProjectAttachment[]) => void;
}

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf', 'dwg', 'dxf'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const ProjectCard6Attachments: React.FC<ProjectCard6AttachmentsProps> = ({
  attachments,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} بایت`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} کیلوبایت`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`;
  };

  const processFile = (file: File) => {
    setUploadError(null);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError(`فرمت فایل «.${ext}» مجاز نیست. فرمت‌های مجاز: JPG, PNG, PDF, DWG, DXF`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`حجم فایل «${file.name}» بیشتر از سقف مجاز ۱۰ مگابایت است.`);
      return;
    }

    const newAttachment: ProjectAttachment = {
      id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      title: file.name.replace(/\.[^/.]+$/, ''),
      description: '',
      mimeType: file.type || `application/${ext}`,
      size: file.size,
      extension: ext,
      environment: 'demo',
    };

    onChange([...attachments, newAttachment]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files as FileList).forEach((file: File) => processFile(file));
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files as FileList).forEach((file: File) => processFile(file));
    }
  };

  const handleRemove = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id));
  };

  const handleUpdateItem = (id: string, fields: Partial<ProjectAttachment>) => {
    onChange(
      attachments.map((a) => (a.id === id ? { ...a, ...fields } : a))
    );
  };

  const getFileIcon = (ext: string) => {
    if (['jpg', 'jpeg', 'png'].includes(ext)) {
      return <ImageIcon className="w-5 h-5 text-sky-600" />;
    }
    if (['dwg', 'dxf'].includes(ext)) {
      return <FileCode2 className="w-5 h-5 text-amber-600" />;
    }
    return <FileText className="w-5 h-5 text-rose-600" />;
  };

  return (
    <Card variant="default" id="card-attachments" className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-[#0B1D35]" />
          <span>کارت ۶: مدارک و پیوست‌های اولیه پروژه</span>
        </CardTitle>
        <Badge variant="neutral" size="sm">{attachments.length} مدرک پیوست</Badge>
      </CardHeader>

      <div className="space-y-4 pt-1">
        
        {/* Demo Notice Banner */}
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-xs leading-relaxed">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>توجه:</strong> در نسخه آزمایشی، محتوای فایل روی سرور بارگذاری نمی‌شود و فقط مشخصات، عنوان و متادیتای آن ذخیره می‌گردد. (فرمت‌های مجاز: PDF, DWG, DXF, PNG, JPG - حداکثر ۱۰MB)
          </p>
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
            isDragOver
              ? 'border-teal-500 bg-teal-50/50 scale-[0.99]'
              : 'border-slate-300 hover:border-[#0B1D35] bg-slate-50/50 hover:bg-white'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg"
            className="hidden"
          />

          <div className="p-3 rounded-full bg-slate-100 text-[#0B1D35]">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <p className="text-xs font-bold text-slate-800">
              کلیک برای انتخاب فایل یا رها کردن فایل‌ها در این ناحیه
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              اسناد مالکیت، دستور نقشه، کروکی اولیه، فایل‌های DWG/DXF وضع موجود
            </p>
          </div>
        </div>

        {uploadError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Attached Files List */}
        {attachments.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-800">
              فهرست پیوست‌های ثبت‌شده:
            </h4>

            <div className="space-y-3">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-100 shrink-0">
                        {getFileIcon(att.extension)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate" dir="ltr">
                          {att.name}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="uppercase font-mono font-bold text-slate-600">{att.extension}</span>
                          <span>•</span>
                          <span>{formatFileSize(att.size)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(att.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="حذف پیوست"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Attachment metadata inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                    <Input
                      label="عنوان مدرک (جهت بایگانی و نمایش)"
                      value={att.title || ''}
                      onChange={(e) => handleUpdateItem(att.id, { title: e.target.value })}
                      placeholder="مثال: سند مالکیت تک برگ"
                      className="text-xs py-1.5"
                    />

                    <Input
                      label="توضیحات تکمیلی (اختیاری)"
                      value={att.description || ''}
                      onChange={(e) => handleUpdateItem(att.id, { description: e.target.value })}
                      placeholder="مثال: صفحه اول و دوم حاوی پلاک ثبتی"
                      className="text-xs py-1.5"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Card>
  );
};
