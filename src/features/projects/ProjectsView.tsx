import React, { lazy, Suspense, useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  MapPin,
  Calendar,
  User as UserIcon,
  Building2,
  Edit3,
  Archive,
  Layers,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Coins,
  Calculator,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { SurveyProject, ProjectStatus } from '../../models/Project';
import { User } from '../../models/User';
import { projectRepository } from '../../repositories';
import { ProjectFormView } from './ProjectFormView';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { getSubServiceLabel, getCategoryById } from '../../data/servicesCatalog';
import { getErrorMessage } from '../../utils/errors';

const ProjectCostsView = lazy(() => import('./ProjectCostsView').then((module) => ({ default: module.ProjectCostsView })));

interface ProjectsViewProps {
  user: User;
  onNavigateToPricing: (projectId?: string) => void;
  initialCreateOpen?: boolean;
}

type FilterStatus = 'all' | ProjectStatus;

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  user,
  onNavigateToPricing,
  initialCreateOpen = false,
}) => {
  const [projects, setProjects] = useState<SurveyProject[]>([]);
  const [deletedProjects, setDeletedProjects] = useState<SurveyProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active view: 'list' | 'form'
  const [currentView, setCurrentView] = useState<'list' | 'workspace' | 'form' | 'costs'>(
    initialCreateOpen ? 'form' : 'list'
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  // Archive Confirmation Modal
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [projectToArchive, setProjectToArchive] = useState<SurveyProject | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<SurveyProject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectRepository.getProjects(user.id);
      setProjects(data);
      setDeletedProjects(await projectRepository.getDeletedProjects(user.id));
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'خطا در دریافت پروژه‌ها'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [user.id]);

  const handleOpenCreateForm = () => {
    setSelectedProjectId(null);
    setCurrentView('form');
  };

  const handleOpenEditForm = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('form');
  };
  const handleOpenWorkspace=(projectId:string)=>{setSelectedProjectId(projectId);setCurrentView('workspace');};

  const handleOpenCosts = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('costs');
  };

  const handleFormBack = () => {
    setCurrentView('list');
    setSelectedProjectId(null);
    loadProjects();
  };

  const handleConfirmArchive = async () => {
    if (!projectToArchive) return;
    setIsArchiving(true);
    try {
      await projectRepository.archiveProject(user.id, projectToArchive.id);
      setArchiveModalOpen(false);
      setProjectToArchive(null);
      await loadProjects();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'خطا در بایگانی پروژه'));
    } finally {
      setIsArchiving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await projectRepository.softDeleteProject(user.id, projectToDelete.id, user.role);
      setDeleteModalOpen(false); setProjectToDelete(null); await loadProjects();
    } catch (err: unknown) { setError(getErrorMessage(err, 'خطا در حذف پروژه')); }
    finally { setIsDeleting(false); }
  };

  const handleRestore = async (projectId: string) => {
    try { await projectRepository.restoreProject(user.id, projectId, user.role); await loadProjects(); }
    catch (err: unknown) { setError(getErrorMessage(err, 'خطا در بازیابی پروژه')); }
  };

  if (currentView === 'costs' && selectedProjectId) {
    return <Suspense fallback={<LoadingState message="در حال بارگذاری هزینه‌های پروژه..." className="py-20" />}><ProjectCostsView user={user} projectId={selectedProjectId} onBack={handleFormBack} /></Suspense>;
  }

  if(currentView==='workspace'&&selectedProjectId){const selected=projects.find(p=>p.id===selectedProjectId);if(selected)return <div className="hub-page"><div className="page-header"><div><h2 className="text-xl font-black">{selected.title}</h2><bdi dir="ltr" className="font-mono text-xs">{selected.projectCode}</bdi></div><Button variant="outline" onClick={handleFormBack}>بازگشت</Button></div><div className="hub-grid">{[
    ['نمای کلی','خلاصه وضعیت و اقدام بعدی'],['مشخصات و خدمات','اطلاعات پایه و ریزخدمات'],['برنامه و پیشرفت','تاریخ‌ها و وضعیت اجرا'],['هزینه‌ها','هزینه واقعی پروژه'],['قیمت‌گذاری','برآورد قیمت پروژه'],['قرارداد و پیش‌فاکتور','اسناد قراردادی'],['صورت‌وضعیت و دریافت‌ها','مراحل مالی'],['اسناد و فایل‌ها','پیوست‌ها و خروجی‌ها'],['تاریخچه','رویدادهای پروژه'],['حذف یا بازیابی','عملیات امن پروژه']
  ].map(([title,description])=><button key={title} className="hub-card text-right" onClick={()=>title==='هزینه‌ها'?handleOpenCosts(selected.id):title==='قیمت‌گذاری'?onNavigateToPricing(selected.id):title==='حذف یا بازیابی'?(()=>{setProjectToDelete(selected);setDeleteModalOpen(true);setCurrentView('list');})():handleOpenEditForm(selected.id)}><span className="hub-card-icon"><FolderKanban className="w-5 h-5"/></span><span><strong>{title}</strong><small className="block text-slate-500 mt-1">{description}</small></span></button>)}</div></div>}

  // If in form mode, render ProjectFormView
  if (currentView === 'form') {
    return (
      <ProjectFormView
        user={user}
        projectId={selectedProjectId}
        onBack={handleFormBack}
        onNavigateToPricing={onNavigateToPricing}
      />
    );
  }

  // Filter & Search computation
  const filteredProjects = projects.filter((p) => {
    // Status filter
    if (statusFilter !== 'all' && p.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchCode = p.projectCode.toLowerCase().includes(q);
      const matchInternal = p.internalCode ? p.internalCode.toLowerCase().includes(q) : false;
      const matchClient = p.clientSnapshot.type === 'legal'
        ? (p.clientSnapshot.companyName?.toLowerCase().includes(q) || p.clientSnapshot.representativeName?.toLowerCase().includes(q))
        : p.clientSnapshot.fullName?.toLowerCase().includes(q);
      const matchPhone = p.clientSnapshot.phone.includes(q);
      const matchCity = p.location.city.toLowerCase().includes(q);

      return matchTitle || matchCode || matchInternal || matchClient || matchPhone || matchCity;
    }

    return true;
  });

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'draft':
        return <Badge variant="neutral" size="sm">پیش‌نویس</Badge>;
      case 'planned':
        return <Badge variant="info" size="sm">برنامه‌ریزی‌شده</Badge>;
      case 'active':
        return <Badge variant="success" size="sm">در حال اجرا</Badge>;
      case 'paused':
        return <Badge variant="warning" size="sm">متوقف‌شده</Badge>;
      case 'completed':
        return <Badge variant="success" size="sm">تکمیل‌شده</Badge>;
      case 'archived':
        return <Badge variant="neutral" size="sm">بایگانی‌شده</Badge>;
      default:
        return null;
    }
  };

  const activeCount = projects.filter((p) => p.status === 'active' || p.status === 'planned').length;
  const draftCount = projects.filter((p) => p.status === 'draft').length;
  const completedCount = projects.filter((p) => p.status === 'completed').length;
  const archivedCount = projects.filter((p) => p.status === 'archived').length;

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-[#0B1D35] text-white shrink-0 shadow-xs">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-slate-900 text-base sm:text-lg">
                مدیریت و کارتابل پروژه‌های نقشه‌برداری
              </h2>
              <Badge variant="demo" size="sm">
                محیط آزمایشی (Demo)
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ثبت اطلاعات پایه، مشخصات کارفرما، انتخاب ریزخدمات و بایگانی پرونده‌ها
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreateForm}
            rightIcon={<Plus className="w-4 h-4" />}
            className="w-full sm:w-auto bg-[#0B1D35] hover:bg-[#0B1D35]/90 text-white font-bold"
          >
            ثبت پروژه جدید
          </Button>
        </div>
      </div>

      {/* Quick Status Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-[#0B1D35] text-white border-[#0B1D35] shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] block opacity-80">کل پروژه‌ها</span>
          <span className="text-lg font-black">{projects.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('active')}
          className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
            statusFilter === 'active'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] block text-emerald-600 font-bold">فعال و برنامه‌ریزی‌شده</span>
          <span className="text-lg font-black text-emerald-700">{activeCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('draft')}
          className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
            statusFilter === 'draft'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] block text-amber-600 font-bold">پیش‌نویس‌ها</span>
          <span className="text-lg font-black text-amber-700">{draftCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('completed')}
          className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
            statusFilter === 'completed'
              ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] block text-sky-600 font-bold">تکمیل‌شده</span>
          <span className="text-lg font-black text-sky-700">{completedCount}</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان پروژه، کد سامانه، نام کارفرما، شماره تماس..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#0B1D35]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-600"
            >
              پاک‌کردن
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#0B1D35] text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            همه ({projects.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
              statusFilter === 'draft'
                ? 'bg-amber-600 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            پیش‌نویس ({draftCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            در حال اجرا
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('planned')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
              statusFilter === 'planned'
                ? 'bg-sky-600 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            برنامه‌ریزی‌شده
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('archived')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
              statusFilter === 'archived'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            بایگانی‌شده ({archivedCount})
          </button>
        </div>

      </div>

      {/* Project Cards List */}
      {isLoading ? (
        <LoadingState message="در حال بارگذاری فهرست پروژه‌های نقشه‌برداری..." className="py-16" />
      ) : error ? (
        <div className="p-6 bg-white rounded-2xl border border-rose-200 text-center space-y-2">
          <p className="text-sm font-bold text-rose-600">{error}</p>
          <Button variant="outline" size="sm" onClick={loadProjects}>
            تلاش مجدد
          </Button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-8 h-8 text-teal-600" />}
          title={searchQuery ? 'هیچ پروژه‌ای با این مشخصات یافت نشد' : 'هنوز پروژه‌ای ثبت نشده است'}
          description={
            searchQuery
              ? 'لطفاً عبارت جستجو یا فیلتر وضعیت را تغییر دهید.'
              : 'برای شروع کار، بر روی دکمه «ثبت پروژه جدید» کلیک فرمایید تا فرم ۶ کارته باز شود.'
          }
          actionLabel={searchQuery ? 'نمایش همه پروژه‌ها' : 'ثبت اولین پروژه'}
          onAction={searchQuery ? () => { setSearchQuery(''); setStatusFilter('all'); } : handleOpenCreateForm}
          className="py-14"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProjects.map((proj) => {
            const cat = getCategoryById(proj.services.mainCategoryId);
            const primaryServiceTitle = getSubServiceLabel(
              proj.services.mainCategoryId,
              proj.services.primarySubServiceId
            );

            const isLegal = proj.clientSnapshot.type === 'legal';
            const clientTitle = isLegal
              ? proj.clientSnapshot.companyName || 'کارفرمای حقوقی'
              : proj.clientSnapshot.fullName || 'کارفرمای حقیقی';

            return (
              <Card
                key={proj.id}
                variant="default"
                className="hover:border-slate-300 transition-all shadow-2xs hover:shadow-xs p-4 sm:p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Right: Main Project Info */}
                  <div className="space-y-2.5 flex-1 min-w-0">
                    
                    {/* Top Row: Title, Code & Status */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {proj.title || 'پروژه بدون عنوان'}
                      </h3>
                      <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold">
                        {proj.projectCode}
                      </span>
                      {proj.internalCode && (
                        <span className="font-mono text-[11px] px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-md" dir="ltr">
                          {proj.internalCode}
                        </span>
                      )}
                      {getStatusBadge(proj.status)}
                    </div>

                    {/* Meta Row: Client, Service, Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                      
                      {/* Client */}
                      <div className="flex items-center gap-1.5 truncate">
                        {isLegal ? (
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className="text-slate-500">کارفرما:</span>
                        <span className="font-medium text-slate-800 truncate">{clientTitle}</span>
                      </div>

                      {/* Service Category */}
                      <div className="flex items-center gap-1.5 truncate">
                        <Layers className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="text-slate-500">خدمت:</span>
                        <span className="font-medium text-slate-800 truncate">{primaryServiceTitle}</span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="text-slate-500">محل:</span>
                        <span className="font-medium text-slate-800 truncate">
                          {proj.location.city} ({proj.location.province})
                        </span>
                      </div>

                    </div>

                    {/* Bottom detail row: Dates & Attachments */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>شروع:</span>
                        <span className="font-mono font-medium text-slate-700">{proj.startDateJalali || 'تعیین‌نشده'}</span>
                      </div>

                      {proj.agreedDeliveryDateJalali && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>تحویل:</span>
                          <span className="font-mono font-medium text-slate-700">{proj.agreedDeliveryDateJalali}</span>
                        </div>
                      )}

                      {proj.attachments.length > 0 && (
                        <div className="flex items-center gap-1 text-slate-600">
                          <Paperclip className="w-3 h-3 text-slate-400" />
                          <span>{proj.attachments.length} پیوست</span>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Left: Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex-wrap sm:flex-nowrap">
                    <Button variant="primary" size="sm" onClick={() => onNavigateToPricing(proj.id)} rightIcon={<Calculator className="w-3.5 h-3.5" />}>برآورد قیمت</Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenCosts(proj.id)}
                      rightIcon={<Coins className="w-3.5 h-3.5" />}
                      className="bg-[#0B1D35] hover:bg-[#0B1D35]/90 text-white font-bold"
                    >
                      هزینه‌های پروژه
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenWorkspace(proj.id)}
                      rightIcon={<Edit3 className="w-3.5 h-3.5" />}
                    >
                      مشاهده و ویرایش
                    </Button>

                    {proj.status !== 'archived' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setProjectToArchive(proj);
                          setArchiveModalOpen(true);
                        }}
                        title="بایگانی پروژه"
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" aria-label="حذف پروژه" title="حذف پروژه"
                      onClick={() => { setProjectToDelete(proj); setDeleteModalOpen(true); }}
                      className="text-slate-400 hover:text-rose-700 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button>
                  </div>

                </div>
              </Card>
            );
          })}
        </div>
      )}

      {deletedProjects.length > 0 && (
        <section className="space-y-3" aria-labelledby="deleted-projects-title">
          <h3 id="deleted-projects-title" className="font-bold text-slate-800">پروژه‌های حذف‌شده</h3>
          {deletedProjects.map((project) => <Card key={project.id} className="p-4 flex flex-wrap items-center justify-between gap-3 opacity-80">
            <div><strong>{project.title || 'پروژه بدون عنوان'}</strong><div className="font-mono text-xs" dir="ltr">{project.projectCode}</div></div>
            <Button variant="outline" size="sm" onClick={() => void handleRestore(project.id)} rightIcon={<RotateCcw className="w-4 h-4" />}>بازیابی پروژه</Button>
          </Card>)}
        </section>
      )}

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="تأیید حذف پروژه" size="sm">
        <div className="space-y-4 text-right" dir="rtl">
          <p className="text-sm">پروژه <strong>«{projectToDelete?.title}»</strong> با کد <bdi dir="ltr" className="font-mono font-bold">{projectToDelete?.projectCode}</bdi> حذف نرم می‌شود. اسناد، هزینه‌ها و سوابق مالی آن حفظ خواهند شد.</p>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDeleteModalOpen(false)}>انصراف</Button><Button variant="primary" disabled={isDeleting} onClick={() => void handleConfirmDelete()} className="bg-rose-700 text-white">{isDeleting ? 'در حال حذف...' : 'حذف پروژه'}</Button></div>
        </div>
      </Modal>

      {/* Archive Confirmation Modal */}
      <Modal
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        title="تأیید بایگانی پروژه"
        size="sm"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                آیا از بایگانی این پروژه اطمینان دارید؟
              </p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                پروژه <strong className="text-[#0B1D35]">«{projectToArchive?.title}»</strong> با کد <strong className="font-mono text-[#0B1D35]">{projectToArchive?.projectCode}</strong> به وضعیت بایگانی منتقل می‌شود و از کارتابل فعال خارج خواهد شد.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setArchiveModalOpen(false)}
              disabled={isArchiving}
            >
              انصراف
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmArchive}
              disabled={isArchiving}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {isArchiving ? 'در حال بایگانی...' : 'بایگانی پروژه'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
