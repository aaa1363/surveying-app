import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowRight,
  Calculator,
  ListTodo,
  CheckCircle2,
  FolderKanban,
} from 'lucide-react';
import { SurveyProject } from '../../models/Project';
import { User } from '../../models/User';
import { projectRepository, clientRepository } from '../../repositories';
import { ProjectCard1Details } from './components/ProjectCard1Details';
import { ProjectCard2Client } from './components/ProjectCard2Client';
import { ProjectCard3Services } from './components/ProjectCard3Services';
import { ProjectCard4Location } from './components/ProjectCard4Location';
import { ProjectCard5Dates } from './components/ProjectCard5Dates';
import { ProjectCard6Attachments } from './components/ProjectCard6Attachments';
import { ProjectFormFooter, AutoSaveStatus } from './components/ProjectFormFooter';
import { LoadingState } from '../../components/ui/LoadingState';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SERVICES_CATALOG } from '../../data/servicesCatalog';
import { isValidIranianMobile, isValidLatitude, isValidLongitude, isValidIranianNationalId } from '../../utils/validators';
import { isValidJalaliDate, compareJalaliDates } from '../../utils/jalaliDate';
import { getErrorMessage } from '../../utils/errors';

interface ProjectFormViewProps {
  user: User;
  projectId?: string | null;
  onBack: () => void;
  onNavigateToPricing: (projectId: string) => void;
}

export const isProjectEmpty = (proj: SurveyProject): boolean => {
  if (proj.title && proj.title.trim() !== '') return false;
  if (proj.description && proj.description.trim() !== '') return false;
  if (proj.internalCode && proj.internalCode.trim() !== '') return false;
  if (proj.clientSnapshot) {
    if (proj.clientSnapshot.type === 'legal') {
      if (proj.clientSnapshot.companyName?.trim()) return false;
      if (proj.clientSnapshot.representativeName?.trim()) return false;
      if (proj.clientSnapshot.phone?.trim()) return false;
      if (proj.clientSnapshot.nationalIdentifier?.trim()) return false;
    } else {
      if (proj.clientSnapshot.fullName?.trim()) return false;
      if (proj.clientSnapshot.phone?.trim()) return false;
      if (proj.clientSnapshot.nationalId?.trim()) return false;
    }
  }
  if (proj.services) {
    if (proj.services.mainCategoryId && proj.services.mainCategoryId.trim() !== '') return false;
    if (proj.services.selectedSubServiceIds && proj.services.selectedSubServiceIds.length > 0) return false;
    if (proj.services.customServiceTitle && proj.services.customServiceTitle.trim() !== '') return false;
  }
  if (proj.location) {
    if (proj.location.province && proj.location.province.trim() !== '') return false;
    if (proj.location.city && proj.location.city.trim() !== '') return false;
    if (proj.location.address && proj.location.address.trim() !== '') return false;
    if (proj.location.latitude !== null && proj.location.latitude !== undefined) return false;
    if (proj.location.longitude !== null && proj.location.longitude !== undefined) return false;
  }
  if (proj.registrationDateJalali && proj.registrationDateJalali.trim() !== '') return false;
  if (proj.startDateJalali && proj.startDateJalali.trim() !== '') return false;
  if (proj.attachments && proj.attachments.length > 0) return false;
  return true;
};

export const ProjectFormView: React.FC<ProjectFormViewProps> = ({
  user,
  projectId,
  onBack,
  onNavigateToPricing,
}) => {
  const [project, setProject] = useState<SurveyProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Success modal after finalize
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [wizardStep,setWizardStep]=useState(1);

  // Debounce & state refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const latestProjectRef = useRef<SurveyProject | null>(null);
  const isFlushingRef = useRef(false);

  // Keep latest ref synced
  useEffect(() => {
    latestProjectRef.current = project;
  }, [project]);

  // 1. Initial Load: Fetch existing project or create new draft template
  useEffect(() => {
    let isMounted = true;

    async function init() {
      setIsLoading(true);
      setLoadError(null);
      try {
        if (projectId) {
          const found = await projectRepository.getProjectById(user.id, projectId);
          if (found && isMounted) {
            setProject(found);
            latestProjectRef.current = found;
          } else {
            throw new Error('پروژه مورد نظر یافت نشد یا دسترسی مجاز نیست.');
          }
        } else {
          const draft = await projectRepository.createDraft(user.id);
          if (isMounted) {
            setProject(draft);
            latestProjectRef.current = draft;
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setLoadError(getErrorMessage(err, 'خطا در بارگذاری فرم پروژه'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setTimeout(() => {
            isInitialLoadRef.current = false;
          }, 300);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [user.id, projectId]);

  // 2. Debounced Auto-Save
  const triggerAutoSave = useCallback(
    (currentProject: SurveyProject) => {
      if (isInitialLoadRef.current) return;

      // If the project is empty, DO NOT save to repository and DO NOT consume a code
      if (isProjectEmpty(currentProject)) {
        setAutoSaveStatus('idle');
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
          autoSaveTimerRef.current = null;
        }
        return;
      }

      setAutoSaveStatus('dirty');

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(async () => {
        setAutoSaveStatus('saving');
        try {
          // Autosave only updates project draft in repository; client is not created in client pool until finalization
          const saved = await projectRepository.saveDraft(currentProject);
          setProject(saved);
          latestProjectRef.current = saved;
          setAutoSaveStatus('saved');
          const now = new Date();
          const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastSavedTime(timeStr);
        } catch {
          setAutoSaveStatus('error');
        } finally {
          autoSaveTimerRef.current = null;
        }
      }, 800);
    },
    []
  );

  // Flush pending save when leaving/unmounting
  const flushPendingDraft = useCallback(async () => {
    if (isFlushingRef.current) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    const cur = latestProjectRef.current;
    if (cur && !isProjectEmpty(cur)) {
      isFlushingRef.current = true;
      try {
        await projectRepository.saveDraft(cur);
      } catch (e) {
        console.error('Error flushing draft:', e);
      } finally {
        isFlushingRef.current = false;
      }
    }
  }, []);

  // Update project state and trigger auto-save
  const updateProject = (updater: (prev: SurveyProject) => SurveyProject) => {
    setProject((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      latestProjectRef.current = updated;
      triggerAutoSave(updated);
      return updated;
    });
  };

  // Safe back handler with pending draft flush
  const handleBack = async () => {
    await flushPendingDraft();
    onBack();
  };

  // 3. Validation Logic
  const validateForm = (proj: SurveyProject): boolean => {
    const errs: Record<string, string> = {};

    // Card 1: Details
    if (!proj.title.trim()) {
      errs.title = 'نام و عنوان پروژه الزامی است.';
    }

    // Card 2: Client
    if (proj.clientSnapshot.type === 'legal') {
      if (!proj.clientSnapshot.companyName?.trim()) {
        errs.clientName = 'نام شرکت یا سازمان الزامی است.';
      }
      if (!proj.clientSnapshot.representativeName?.trim()) {
        errs.representativeName = 'نام نماینده شرکت الزامی است.';
      }
      if (!proj.clientSnapshot.phone.trim()) {
        errs.clientPhone = 'شماره تماس نماینده الزامی است.';
      } else if (!isValidIranianMobile(proj.clientSnapshot.phone)) {
        errs.clientPhone = 'شماره تماس باید ۱۱ رقم معتبر با پیش‌شماره ۰۹ باشد.';
      }
    } else {
      if (!proj.clientSnapshot.fullName?.trim()) {
        errs.clientName = 'نام و نام خانوادگی کارفرما الزامی است.';
      }
      if (!proj.clientSnapshot.phone.trim()) {
        errs.clientPhone = 'شماره تماس کارفرما الزامی است.';
      } else if (!isValidIranianMobile(proj.clientSnapshot.phone)) {
        errs.clientPhone = 'شماره تماس باید ۱۱ رقم معتبر با پیش‌شماره ۰۹ باشد.';
      }
      if (proj.clientSnapshot.nationalId?.trim() && !isValidIranianNationalId(proj.clientSnapshot.nationalId)) {
        errs.nationalId = 'کد ملی واردشده معتبر نمی‌باشد.';
      }
    }

    // Card 3: Services
    if (!proj.services.mainCategoryId || !proj.services.mainCategoryId.trim()) {
      errs.mainCategory = 'انتخاب شاخه اصلی خدمات الزامی است.';
    }
    if (!proj.services.selectedSubServiceIds || proj.services.selectedSubServiceIds.length === 0) {
      errs.services = 'حداقل یک خدمت از شاخه انتخابی باید مشخص گردد.';
    } else if (!proj.services.primarySubServiceId) {
      errs.services = 'لطفاً یکی از خدمات انتخاب‌شده را به عنوان خدمت اصلی ستاره‌دار کنید.';
    } else if (!proj.services.selectedSubServiceIds.includes(proj.services.primarySubServiceId)) {
      errs.services = 'خدمت اصلی باید از میان خدمات انتخاب‌شده باشد.';
    } else {
      // Ensure primary subservice belongs to the category
      const activeCat = SERVICES_CATALOG.find((c) => c.id === proj.services.mainCategoryId);
      if (activeCat && !activeCat.subServices.some((s) => s.id === proj.services.primarySubServiceId)) {
        errs.services = 'خدمت اصلی با شاخه انتخابی همخوانی ندارد.';
      }
    }

    if (proj.services.selectedSubServiceIds.includes('oth_custom') && (!proj.services.customServiceTitle || !proj.services.customServiceTitle.trim())) {
      errs.customServiceTitle = 'عنوان خدمت سفارشی الزامی است.';
    }

    // Card 4: Location
    if (!proj.location.province || !proj.location.province.trim()) {
      errs.province = 'انتخاب استان محل پروژه الزامی است.';
    }
    if (!proj.location.city || !proj.location.city.trim()) {
      errs.city = 'انتخاب شهر محل پروژه الزامی است.';
    }
    if (!proj.location.address || !proj.location.address.trim()) {
      errs.address = 'نشانی دقیق ملک الزامی است.';
    }
    if (proj.location.latitude === null || !isValidLatitude(proj.location.latitude)) {
      errs.latitude = 'عرض جغرافیایی الزامی و باید در محدوده مجاز باشد.';
    }
    if (proj.location.longitude === null || !isValidLongitude(proj.location.longitude)) {
      errs.longitude = 'طول جغرافیایی الزامی و باید در محدوده مجاز باشد.';
    }

    // Card 5: Dates
    const regVal = isValidJalaliDate(proj.registrationDateJalali);
    if (!regVal.isValid) {
      errs.registrationDateJalali = regVal.error || 'تاریخ ثبت نامعتبر است.';
    }

    const startVal = isValidJalaliDate(proj.startDateJalali);
    if (!startVal.isValid) {
      errs.startDateJalali = startVal.error || 'تاریخ شروع نامعتبر است.';
    } else if (regVal.isValid && compareJalaliDates(proj.startDateJalali, proj.registrationDateJalali) < 0) {
      errs.startDateJalali = 'تاریخ شروع نمی‌تواند قبل از تاریخ ثبت پروژه باشد.';
    }

    if (proj.agreedDeliveryDateJalali) {
      const delVal = isValidJalaliDate(proj.agreedDeliveryDateJalali);
      if (!delVal.isValid) {
        errs.agreedDeliveryDateJalali = delVal.error || 'تاریخ تحویل توافق‌شده نامعتبر است.';
      } else if (startVal.isValid && compareJalaliDates(proj.agreedDeliveryDateJalali, proj.startDateJalali) < 0) {
        errs.agreedDeliveryDateJalali = 'تاریخ تحویل توافق‌شده نمی‌تواند قبل از تاریخ شروع باشد.';
      }
    }

    if (proj.status === 'completed' && proj.actualEndDateJalali) {
      const endVal = isValidJalaliDate(proj.actualEndDateJalali);
      if (!endVal.isValid) {
        errs.actualEndDateJalali = endVal.error || 'تاریخ پایان واقعی نامعتبر است.';
      } else if (startVal.isValid && compareJalaliDates(proj.actualEndDateJalali, proj.startDateJalali) < 0) {
        errs.actualEndDateJalali = 'تاریخ پایان واقعی نمی‌تواند قبل از تاریخ شروع باشد.';
      }
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      // Scroll to first erroneous card
      if (errs.title) {
        document.getElementById('card-project-details')?.scrollIntoView({ behavior: 'smooth' });
      } else if (errs.clientName || errs.clientPhone || errs.representativeName || errs.nationalId) {
        document.getElementById('card-client-details')?.scrollIntoView({ behavior: 'smooth' });
      } else if (errs.mainCategory || errs.services || errs.customServiceTitle) {
        document.getElementById('card-services-selection')?.scrollIntoView({ behavior: 'smooth' });
      } else if (errs.province || errs.city || errs.address || errs.latitude || errs.longitude) {
        document.getElementById('card-location-details')?.scrollIntoView({ behavior: 'smooth' });
      } else if (errs.registrationDateJalali || errs.startDateJalali || errs.agreedDeliveryDateJalali || errs.actualEndDateJalali) {
        document.getElementById('card-dates-timeline')?.scrollIntoView({ behavior: 'smooth' });
      }
      return false;
    }

    return true;
  };

  // 4. Finalize Project
  const handleFinalizeProject = async () => {
    if (!project) return;

    if (!validateForm(project)) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Persist or update client in client repository on final submit (with phone deduplication)
      if (project.clientSnapshot.fullName || project.clientSnapshot.companyName) {
        const savedClient = await clientRepository.createClient(user.id, project.clientSnapshot);
        project.clientId = savedClient.id;
      }

      const finalized = await projectRepository.finalizeProject(project);
      const verified = await projectRepository.getProjectById(user.id, finalized.id);
      if (!verified || !verified.projectCode || verified.status === 'draft') {
        throw new Error('تأیید ثبت پروژه از مخزن داده انجام نشد؛ لطفاً دوباره تلاش کنید.');
      }
      setProject(verified);
      latestProjectRef.current = verified;
      setAutoSaveStatus('saved');
      setSuccessModalOpen(true);
    } catch (err: unknown) {
      setLoadError(getErrorMessage(err, 'خطا در ثبت نهایی پروژه'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Manual Save Draft
  const handleManualSaveDraft = async () => {
    if (!project) return;
    if (isProjectEmpty(project)) {
      setAutoSaveStatus('idle');
      return;
    }

    setIsSubmitting(true);
    setAutoSaveStatus('saving');
    try {
      const saved = await projectRepository.saveDraft(project);
      setProject(saved);
      latestProjectRef.current = saved;
      setAutoSaveStatus('saved');
      const now = new Date();
      const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(timeStr);
    } catch {
      setAutoSaveStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="در حال آماده‌سازی فرم اطلاعات پایه پروژه..." className="py-20" />;
  }

  if (loadError || !project) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-2xl border border-rose-200 text-center space-y-3 my-8" dir="rtl">
        <p className="text-sm font-bold text-rose-600">
          {loadError || 'اطلاعات پروژه در دسترس نیست.'}
        </p>
        <Button variant="secondary" onClick={onBack} size="sm">
          بازگشت به فهرست پروژه‌ها
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#0B1D35] text-white shrink-0">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {project.title || 'پروژه جدید (در حال تکمیل مشخصات)'}
              </h2>
              {project.projectCode ? (
                <Badge variant="neutral" size="sm" className="font-mono">
                  {project.projectCode}
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  پیش‌نویس ثبت‌نشده
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ثبت مشخصات پایه فنی، کارفرما، موقعیت جغرافیایی و پیوست‌ها در ۶ کارت یکپارچه
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            فهرست پروژه‌ها
          </Button>
        </div>
      </div>

      {/* 6 Form Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4" aria-label="پیشرفت ثبت پروژه"><strong className="text-sm">مرحله {wizardStep} از ۶</strong><div className="h-2 flex-1 max-w-sm bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-teal-600 transition-all" style={{width:`${wizardStep/6*100}%`}}/></div></div>
        
        {/* Card 1: Details */}
        {wizardStep===1&&<ProjectCard1Details
          projectCode={project.projectCode}
          internalCode={project.internalCode || ''}
          title={project.title}
          description={project.description || ''}
          status={project.status}
          errors={errors}
          onChange={(fields) =>
            updateProject((p) => ({
              ...p,
              ...fields,
            }))
          }
        />}

        {/* Card 2: Client */}
        {wizardStep===2&&<ProjectCard2Client
          userId={user.id}
          clientId={project.clientId}
          clientSnapshot={project.clientSnapshot}
          errors={errors}
          onChange={({ clientId, clientSnapshot }) =>
            updateProject((p) => ({
              ...p,
              clientId: clientId !== undefined ? clientId : p.clientId,
              clientSnapshot,
            }))
          }
        />}

        {/* Card 3: Services */}
        {wizardStep===3&&<ProjectCard3Services
          services={project.services}
          errors={errors}
          onChange={(services) =>
            updateProject((p) => ({
              ...p,
              services,
            }))
          }
        />}

        {/* Card 4: Location */}
        {wizardStep===4&&<ProjectCard4Location
          location={project.location}
          errors={errors}
          onChange={(location) =>
            updateProject((p) => ({
              ...p,
              location,
            }))
          }
        />}

        {/* Card 5: Dates */}
        {wizardStep===5&&<ProjectCard5Dates
          registrationDateJalali={project.registrationDateJalali}
          startDateJalali={project.startDateJalali}
          agreedDeliveryDateJalali={project.agreedDeliveryDateJalali}
          actualEndDateJalali={project.actualEndDateJalali}
          status={project.status}
          errors={errors}
          onChange={(dates) =>
            updateProject((p) => ({
              ...p,
              ...dates,
            }))
          }
        />}

        {/* Card 6: Attachments */}
        {wizardStep===6&&<ProjectCard6Attachments
          attachments={project.attachments}
          onChange={(attachments) =>
            updateProject((p) => ({
              ...p,
              attachments,
            }))
          }
        />}

        <div className="flex items-center justify-between gap-3"><Button variant="outline" disabled={wizardStep===1} onClick={()=>setWizardStep(s=>Math.max(1,s-1))}>مرحله قبل</Button>{wizardStep<6&&<Button variant="primary" onClick={()=>setWizardStep(s=>Math.min(6,s+1))}>ذخیره و ادامه</Button>}</div>

      </div>

      {/* Sticky Bottom Actions */}
      {wizardStep===6&&<ProjectFormFooter
        autoSaveStatus={autoSaveStatus}
        lastSavedTime={lastSavedTime}
        isSubmitting={isSubmitting}
        onManualSaveDraft={handleManualSaveDraft}
        onFinalizeProject={handleFinalizeProject}
        onBack={handleBack}
      />}

      {/* Success Modal after Finalization */}
      <Modal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="پروژه با موفقیت ثبت شد"
        size="md"
      >
        <div className="space-y-4 text-center py-2" dir="rtl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              پروژه با موفقیت ثبت شد
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              پروژه <span className="font-bold text-[var(--primary)]">«{project.title}»</span> با کد <bdi dir="ltr" className="font-mono font-bold text-[var(--primary)]">{project.projectCode}</bdi> ذخیره و از Repository دوباره خوانده شد. اکنون می‌توانید قیمت‌گذاری یا مشاهده پرونده را ادامه دهید.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-right text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">وضعیت جدید پرونده:</span>
              <Badge variant="info" size="sm">برنامه‌ریزی‌شده</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">کارفرمای طرف قرارداد:</span>
              <span className="font-bold text-slate-800">
                {project.clientSnapshot.type === 'legal'
                  ? project.clientSnapshot.companyName
                  : project.clientSnapshot.fullName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">موقعیت مکانی:</span>
              <span className="font-bold text-slate-800">
                {project.location.province}، {project.location.city}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
            <Button
              variant="accent"
              size="md"
              className="w-full"
              onClick={() => {
                setSuccessModalOpen(false);
                onNavigateToPricing(project.id);
              }}
              rightIcon={<Calculator className="w-4 h-4" />}
            >
              ورود به قیمت‌گذاری پروژه
            </Button>

            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={() => {
                setSuccessModalOpen(false);
                onBack();
              }}
              rightIcon={<ListTodo className="w-4 h-4" />}
            >
              مشاهده پروژه
            </Button>
            <Button variant="secondary" size="md" className="w-full" onClick={() => { setSuccessModalOpen(false); onBack(); }}>بازگشت به فهرست پروژه‌ها</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
