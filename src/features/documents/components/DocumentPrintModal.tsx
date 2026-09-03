import React, {useEffect, useId, useRef, useState} from 'react';
import { Printer, X, ShieldAlert, FileText, CheckCircle2, Building2, User as UserIcon, Phone, MapPin, CreditCard, Award, Download, Share2 } from 'lucide-react';
import {
  ProformaInvoice,
  Contract,
  ProgressStatement,
  ServiceInvoice,
  DocumentType,
} from '../../../models';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { formatToman, numberToPersianWords, toPersianDigits } from '../../../utils/formatters';
import {generateDocumentPdf, issueOnlyAfterPdfPreflight, safeDocumentFileName, saveOrSharePdf} from '../../../utils/documentPdf';

interface DocumentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: DocumentType;
  proforma?: ProformaInvoice | null;
  contract?: Contract | null;
  statement?: ProgressStatement | null;
  invoice?: ServiceInvoice | null;
  onIssueAfterPdfPreflight?: () => Promise<void>;
}

export const DocumentPrintModal: React.FC<DocumentPrintModalProps> = ({
  isOpen,
  onClose,
  documentType,
  proforma,
  contract,
  statement,
  invoice,
  onIssueAfterPdfPreflight,
}) => {
  const paperRef=useRef<HTMLDivElement>(null);
  const dialogRef=useRef<HTMLDivElement>(null);
  const returnFocusRef=useRef<HTMLElement|null>(null);
  const onCloseRef=useRef(onClose);
  onCloseRef.current=onClose;
  const titleId=useId();
  const [pdfState,setPdfState]=useState<'idle'|'loading'|'success'|'error'>('idle');
  const [pdfMessage,setPdfMessage]=useState('');
  useEffect(()=>{
    if(!isOpen)return;
    returnFocusRef.current=document.activeElement as HTMLElement|null;
    const dialog=dialogRef.current;
    const focusable=()=>{
      const nodes:HTMLElement[]=dialog?Array.from(dialog.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')):[];
      return nodes.filter(item=>!item.hasAttribute('disabled'));
    };
    focusable()[0]?.focus();
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();onCloseRef.current();return;}
      if(event.key!=='Tab')return;
      const items=focusable();if(!items.length)return;
      const first=items[0],last=items[items.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    document.addEventListener('keydown',onKey);
    return()=>{document.removeEventListener('keydown',onKey);returnFocusRef.current?.focus();};
  },[isOpen]);
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handlePdf=async()=>{
    if(pdfState==='loading'||!paperRef.current)return;
    setPdfState('loading');setPdfMessage('در حال تولید PDF…');
    try{
      if(onIssueAfterPdfPreflight){
        await issueOnlyAfterPdfPreflight(
          ()=>generateDocumentPdf(paperRef.current!,safeDocumentFileName(documentType,docNumber)),
          onIssueAfterPdfPreflight,
        );
        setPdfState('success');
        setPdfMessage('پیش‌نمایش PDF با موفقیت کنترل و سند صادر شد. برای دریافت نسخه شماره‌دار، «دانلود / اشتراک PDF» را دوباره انتخاب کنید.');
        return;
      }
      const result=await generateDocumentPdf(paperRef.current,safeDocumentFileName(documentType,docNumber));
      const action=await saveOrSharePdf(result);
      setPdfState('success');setPdfMessage(action==='shared'?`PDF ${result.pages.toLocaleString('fa-IR')} صفحه‌ای آماده ارسال یا چاپ شد.`:`PDF ${result.pages.toLocaleString('fa-IR')} صفحه‌ای دانلود شد.`);
    }catch{setPdfState('error');setPdfMessage('تولید PDF انجام نشد؛ وضعیت سند تغییری نکرد.');}
  };

  const getDocTitle = () => {
    switch (documentType) {
      case 'proforma':
        return 'پیش‌فاکتور خدمات مهندسی نقشه‌برداری';
      case 'contract':
        return 'قرارداد ارائه خدمات مهندسی نقشه‌برداری';
      case 'statement':
        return 'صورت‌وضعیت پیشرفت کار خدمات نقشه‌برداری';
      case 'invoice':
        return 'صورتحساب خدمات مهندسی نقشه‌برداری';
    }
  };

  const docNumber =
    proforma?.documentNumber ||
    contract?.documentNumber ||
    statement?.documentNumber ||
    invoice?.documentNumber ||
    'پیش‌نویس بدون شماره';

  const docDate =
    proforma?.issueDateJalali ||
    contract?.startDateJalali ||
    statement?.statementDateJalali ||
    invoice?.issueDateJalali ||
    '---';

  const partySnapshot =
    proforma?.partySnapshot ||
    contract?.partySnapshot ||
    invoice?.partySnapshot;

  const surveyor = partySnapshot?.surveyor;
  const client = partySnapshot?.client;
  const isLegal = client?.type === 'legal';

  const totalAmount =
    proforma?.totalProposedAmount ||
    contract?.totalAmount ||
    statement?.currentStageAmount ||
    invoice?.totalAmount ||
    0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static" dir="rtl">

      {/* Modal Card */}
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">

        {/* Top Action Bar (Hidden on Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-teal-400" />
            <h3 id={titleId} className="font-bold text-sm sm:text-base">نمای چاپی استاندارد A4 (سند داخلی)</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={()=>void handlePdf()} isLoading={pdfState==='loading'} rightIcon={<Download className="w-4 h-4" />} className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold">{onIssueAfterPdfPreflight?'کنترل PDF و صدور سند':'دانلود / اشتراک PDF'}</Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              rightIcon={<Printer className="w-4 h-4" />}
              className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
            >
              چاپ Preview
            </Button>
            <button
              onClick={onClose}
              aria-label="بستن پیش‌نمایش چاپ"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {pdfMessage&&<p role="status" className={`print:hidden px-4 py-2 text-xs font-bold ${pdfState==='error'?'bg-rose-50 text-rose-700':'bg-emerald-50 text-emerald-700'}`}>{pdfMessage}</p>}

        {/* Printable Paper Body */}
        <div ref={paperRef} className="document-print-paper p-6 sm:p-10 overflow-y-auto print:p-6 print:overflow-visible space-y-6 text-slate-900 bg-white font-sans text-xs sm:text-sm">

          {/* Header Banner with Logo & Number */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#0B1D35] inline-block"></span>
                <h1 className="text-base sm:text-xl font-black text-[#0B1D35]">{getDocTitle()}</h1>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                سامانه هوشمند مدیریت عملیات و قراردادهای نقشه‌برداری
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1 self-stretch sm:self-auto min-w-[200px]">
              <div className="flex justify-between items-center gap-3">
                <span className="text-slate-500">شماره سند:</span>
                <span className="font-mono font-bold text-slate-900">{docNumber}</span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="text-slate-500">تاریخ صدور:</span>
                <span className="font-mono font-bold text-slate-900">{toPersianDigits(docDate)}</span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="text-slate-500">واحد پول:</span>
                <span className="font-bold text-teal-700">تومان</span>
              </div>
            </div>
          </div>

          {/* Parties Snapshot Info (Two-Column Table) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-200 rounded-xl p-4 bg-slate-50/50">

            {/* Surveyor Box */}
            <div className="space-y-2 border-b md:border-b-0 md:border-l border-slate-200 pb-3 md:pb-0 md:pl-4">
              <div className="flex items-center gap-1.5 font-black text-slate-900 border-b border-slate-200 pb-1.5 text-xs">
                <Award className="w-4 h-4 text-teal-600" />
                <span>طرف اول: مشخصات مهندس نقشه‌بردار</span>
              </div>
              <div className="space-y-1 text-xs text-slate-700">
                <div><span className="text-slate-500">نام و نام خانوادگی:</span> <strong>{surveyor?.fullName || 'ثبت‌نشده در پروفایل'}</strong></div>
                <div><span className="text-slate-500">شماره تماس:</span> <span className="font-mono">{toPersianDigits(surveyor?.phone || '---')}</span></div>
                {surveyor?.engineerLicenseNumber && (
                  <div><span className="text-slate-500">پروانه نظام مهندسی:</span> <span className="font-mono">{toPersianDigits(surveyor.engineerLicenseNumber)}</span></div>
                )}
                {surveyor?.judicialExpertNumber && (
                  <div><span className="text-slate-500">کارشناس رسمی دادگستری:</span> <span className="font-mono">{toPersianDigits(surveyor.judicialExpertNumber)}</span></div>
                )}
              </div>
            </div>

            {/* Client Box */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-black text-slate-900 border-b border-slate-200 pb-1.5 text-xs">
                {isLegal ? <Building2 className="w-4 h-4 text-slate-700" /> : <UserIcon className="w-4 h-4 text-slate-700" />}
                <span>طرف دوم: مشخصات کارفرما {isLegal ? '(حقوقی)' : '(حقیقی)'}</span>
              </div>
              <div className="space-y-1 text-xs text-slate-700">
                {isLegal ? (
                  <>
                    <div><span className="text-slate-500">نام شرکت/سازمان:</span> <strong>{client?.companyName || '---'}</strong></div>
                    <div><span className="text-slate-500">نام نماینده:</span> <strong>{client?.representativeName || '---'}</strong> {client?.representativePosition ? `(${client.representativePosition})` : ''}</div>
                    {client?.nationalIdentifier && (
                      <div><span className="text-slate-500">شناسه ملی:</span> <span className="font-mono">{toPersianDigits(client.nationalIdentifier)}</span></div>
                    )}
                    {client?.registrationNumber && (
                      <div><span className="text-slate-500">شماره ثبت:</span> <span className="font-mono">{toPersianDigits(client.registrationNumber)}</span></div>
                    )}
                  </>
                ) : (
                  <>
                    <div><span className="text-slate-500">نام و نام خانوادگی:</span> <strong>{client?.fullName || '---'}</strong></div>
                    {client?.nationalId && (
                      <div><span className="text-slate-500">کد ملی:</span> <span className="font-mono">{toPersianDigits(client.nationalId)}</span></div>
                    )}
                  </>
                )}
                <div><span className="text-slate-500">شماره تماس:</span> <span className="font-mono">{toPersianDigits(client?.phone || '---')}</span></div>
                {client?.address && (
                  <div><span className="text-slate-500">نشانی:</span> <span>{client.address}</span></div>
                )}
              </div>
            </div>

          </div>

          {/* Document Type Specific Content */}
          {documentType === 'proforma' && proforma && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-1.5">شرح خدمات و توافقات</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div><span className="text-slate-500">عنوان پروژه:</span> <strong>{proforma.projectTitle}</strong></div>
                  <div><span className="text-slate-500">اعتبار پیشنهاد:</span> <span className="font-mono font-bold">{toPersianDigits(proforma.validityDateJalali || '---')}</span></div>
                  <div className="sm:col-span-2"><span className="text-slate-500">شرح کلی خدمت:</span> <p className="mt-1 text-slate-800 leading-relaxed">{proforma.serviceDescription}</p></div>
                  <div className="sm:col-span-2"><span className="text-slate-500">مدت تقریبی انجام:</span> <span>{proforma.estimatedDuration || 'طبق توافق'}</span></div>
                  <div className="sm:col-span-2"><span className="text-slate-500">شرایط پرداخت:</span> <span>{proforma.paymentTerms || 'طبق برنامه پرداخت مرحله‌ای'}</span></div>
                  {proforma.notes && (
                    <div className="sm:col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                      <strong>توضیحات:</strong> {proforma.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {documentType === 'contract' && contract && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-1.5">مفاد و شرایط اختصاصی</h4>
                <div className="space-y-3 text-xs leading-relaxed text-slate-800">
                  <div><strong>موضوع قرارداد:</strong> <p>{contract.subject}</p></div>
                  <div><strong>محدوده خدمات:</strong> <p>{contract.scopeOfServices}</p></div>
                  <div><strong>تحویل‌دادنی‌ها:</strong> <p>{contract.deliverables}</p></div>
                  <div><strong>مدت و زمان‌بندی:</strong> <p>{contract.durationDaysOrMonths} (شروع از تاریخ: {toPersianDigits(contract.startDateJalali)})</p></div>

                  {contract.sections && contract.sections.map((sec) => (
                    <div key={sec.id} className="pt-2 border-t border-slate-100">
                      <strong className="text-slate-900">{sec.title}:</strong>
                      <p className="mt-0.5">{sec.content}</p>
                    </div>
                  ))}

                  <div className="pt-2 border-t border-slate-100">
                    <strong className="text-slate-900">تعهدات نقشه‌بردار:</strong>
                    <p className="mt-0.5">{contract.surveyorObligations}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <strong className="text-slate-900">تعهدات کارفرما:</strong>
                    <p className="mt-0.5">{contract.clientObligations}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {documentType === 'statement' && statement && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-1.5">ریز اقلام صورت‌وضعیت</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div><span className="text-slate-500">عنوان مرحله/تحویل:</span> <strong>{statement.stageTitle}</strong></div>
                  <div><span className="text-slate-500">درصد پیشرفت:</span> <strong>{statement.progressPercentage ? `${toPersianDigits(statement.progressPercentage)}%` : '---'}</strong></div>
                  <div><span className="text-slate-500">کل مبلغ قابل‌مطالبه:</span> <span className="font-mono font-bold">{formatToman(statement.totalClaimableAmount)}</span></div>
                  <div><span className="text-slate-500">مبالغ مطالبه‌شده قبلی:</span> <span className="font-mono">{formatToman(statement.previousClaimedAmount)}</span></div>
                  <div><span className="text-slate-500">مبلغ خالص این مرحله:</span> <strong className="font-mono text-teal-700 text-sm">{formatToman(statement.currentStageAmount)}</strong></div>
                  <div><span className="text-slate-500">مانده تعهد:</span> <span className="font-mono">{formatToman(statement.remainingBalance)}</span></div>
                  {statement.notes && (
                    <div className="sm:col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                      <strong>توضیحات:</strong> {statement.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {documentType === 'invoice' && invoice && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-1.5">شرح خدمات و مبالغ صورتحساب</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div><span className="text-slate-500">پروژه:</span> <strong>{invoice.projectTitle}</strong></div>
                  <div><span className="text-slate-500">تاریخ سررسید:</span> <span className="font-mono font-bold">{toPersianDigits(invoice.dueDateJalali || '---')}</span></div>
                  <div className="sm:col-span-2"><span className="text-slate-500">شرح خدمت:</span> <p className="mt-1 text-slate-800">{invoice.serviceDescription}</p></div>
                  <div><span className="text-slate-500">کل مبلغ خدمات:</span> <span className="font-mono font-bold">{formatToman(invoice.totalAmount)}</span></div>
                  <div><span className="text-slate-500">مبلغ پرداخت‌شده:</span> <span className="font-mono text-emerald-700">{formatToman(invoice.paidAmount)}</span></div>
                  <div><span className="text-slate-500">مانده قابل‌پرداخت:</span> <strong className="font-mono text-rose-700 text-sm">{formatToman(invoice.remainingBalance)}</strong></div>
                  {invoice.notes && (
                    <div className="sm:col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                      <strong>توضیحات:</strong> {invoice.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Total Amount Box with Numbers & Words */}
          <div className="bg-[#0B1D35] text-white p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-300 block">مبلغ کل قابل پرداخت (به حروف):</span>
              <strong className="text-sm sm:text-base text-teal-300 font-black mt-0.5 block">
                {numberToPersianWords(totalAmount)}
              </strong>
            </div>
            <div className="text-left self-end sm:self-auto">
              <span className="text-[11px] text-slate-300 block">مبلغ با عدد:</span>
              <span className="font-mono text-lg sm:text-xl font-black text-white">{formatToman(totalAmount)}</span>
            </div>
          </div>

          {/* Manual Approval Record Details (if recorded) */}
          {(proforma?.manualApproval || contract?.manualApproval || statement?.manualApproval) && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>تأییدیه هماهنگی با کارفرما ثبت شده است</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                تأییدکننده: <strong>{proforma?.manualApproval?.approverName || contract?.manualApproval?.approverName || statement?.manualApproval?.approverName}</strong> |
                روش هماهنگی: <strong>{
                  (proforma?.manualApproval?.approvalType || contract?.manualApproval?.approvalType || statement?.manualApproval?.approvalType) === 'phone' ? 'تلفنی' :
                  (proforma?.manualApproval?.approvalType || contract?.manualApproval?.approvalType || statement?.manualApproval?.approvalType) === 'in_person' ? 'حضوری' : 'سند کاغذی'
                }</strong> |
                تاریخ: <span className="font-mono font-bold">{toPersianDigits(proforma?.manualApproval?.approvalDateJalali || contract?.manualApproval?.approvalDateJalali || statement?.manualApproval?.approvalDateJalali || '')}</span>
              </p>
            </div>
          )}

          {/* Manual Signature Box */}
          <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-12">
              <span className="font-bold text-slate-800">مهر و امضای مهندس نقشه‌بردار (طرف اول)</span>
              <div className="h-16 border-b border-dashed border-slate-300 flex items-end justify-center pb-1 text-slate-400 text-[10px]">
                محل امضا و تاریخ
              </div>
            </div>

            <div className="space-y-12">
              <span className="font-bold text-slate-800">امضا و تأیید کارفرما (طرف دوم)</span>
              <div className="h-16 border-b border-dashed border-slate-300 flex items-end justify-center pb-1 text-slate-400 text-[10px]">
                محل امضا و اثر انگشت / مهر شرکت
              </div>
            </div>
          </div>

          {/* Mandatory Legal Disclaimer */}
          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 leading-relaxed">
            <p className="font-medium text-slate-600">
              «این سند در نسخه آزمایشی توسط کاربر ایجاد شده و به‌تنهایی جایگزین بررسی حقوقی، مالی یا مالیاتی نیست.»
            </p>
            <p className="text-slate-400 mt-0.5">
              صفحه ۱ از ۱ — تولیدشده توسط سامانه مدیریت پروژه‌های نقشه‌برداری
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
