import { IProjectRepository } from '../interfaces/IProjectRepository';
import { SurveyProject } from '../../models/Project';
import { DashboardStats } from '../../models/DashboardStats';
import { RecentProject } from '../../models/RecentProject';
import { Notification } from '../../models/Notification';
import { storage } from '../../utils/storage';
import { getCurrentJalaliDate, getJalaliYear } from '../../utils/jalaliDate';
import { getSubServiceLabel } from '../../data/servicesCatalog';
import {isDemoBusinessSeedDisabled} from '../../utils/demoSeedPolicy';
import { UserRole } from '../../models/User';

export class DemoProjectRepository implements IProjectRepository {
  private getStorageKey(userId: string): string {
    return `geo_demo_projects_${userId}`;
  }

  private getSeededKey(userId: string): string {
    return `geo_demo_projects_seeded_${userId}`;
  }

  private getCounterKey(userId: string, year: number): string {
    return `geo_demo_counter_${userId}_${year}`;
  }

  public generateProjectCode(userId: string, jalaliDate?: string): string {
    const year = getJalaliYear(jalaliDate || getCurrentJalaliDate());
    const counterKey = this.getCounterKey(userId, year);
    
    // Check existing projects to ensure no collision
    const existingProjects = storage.get<SurveyProject[]>(this.getStorageKey(userId), []);
    let maxProjectNum = 0;
    const prefix = `PRJ-${year}-`;
    existingProjects.forEach((p) => {
      if (p.projectCode && p.projectCode.startsWith(prefix)) {
        const numPart = parseInt(p.projectCode.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxProjectNum) {
          maxProjectNum = numPart;
        }
      }
    });

    const storedCounter = storage.get<number>(counterKey, 0);
    const nextCounter = Math.max(storedCounter, maxProjectNum) + 1;
    storage.set(counterKey, nextCounter);

    const padded = String(nextCounter).padStart(4, '0');
    return `PRJ-${year}-${padded}`;
  }

  private getDefaultProjects(userId: string): SurveyProject[] {
    return [
      {
        id: `prj_demo_101_${userId}`,
        projectCode: 'PRJ-1404-0001',
        internalCode: 'PARS-101',
        title: 'تفکیک مجتمع تجاری مسکونی پارسیان',
        description: 'عملیات تفکیک عرصه و اعیان، تعیین مشاعات و تهیه نقشه ازبیلت طبقات',
        clientId: `cli_demo_1_${userId}`,
        clientSnapshot: {
          id: `cli_demo_1_${userId}`,
          type: 'legal',
          companyName: 'شرکت سرمایه‌گذاری سپهر کویر یزد',
          representativeName: 'مهندس محمدرضا شایق',
          representativePosition: 'مدیر فنی و اجرایی',
          phone: '09131512345',
          nationalIdentifier: '10861234567',
          registrationNumber: '8942',
          economicCode: '411234567890',
          address: 'یزد، بلوار جمهوری اسلامی، مجتمع تجاری سپهر، طبقه ۴',
          environment: 'demo',
        },
        services: {
          mainCategoryId: 'cadastral_registration',
          selectedSubServiceIds: ['cad_1', 'cad_2'],
          primarySubServiceId: 'cad_1',
        },
        location: {
          province: 'یزد',
          city: 'یزد',
          address: 'یزد، بلوار جمهوری اسلامی، نبش خیابان امام جعفر صادق، پلاک ۱۸',
          latitude: 31.8974,
          longitude: 54.3569,
        },
        registrationDateJalali: '1404/05/10',
        startDateJalali: '1404/05/15',
        agreedDeliveryDateJalali: '1404/07/30',
        status: 'active',
        attachments: [
          {
            id: 'att_1',
            name: 'parsian_cadastral_sketch.pdf',
            title: 'کروکی اولیه پلاک ثبتی',
            description: 'طرح معماری و پروانه ساختمانی مصوب شهرداری',
            mimeType: 'application/pdf',
            size: 2450000,
            extension: 'pdf',
            environment: 'demo',
          },
        ],
        createdByUserId: userId,
        createdAt: '2026-08-10T08:00:00.000Z',
        updatedAt: '2026-08-20T14:30:00.000Z',
        environment: 'demo',
      },
      {
        id: `prj_demo_102_${userId}`,
        projectCode: 'PRJ-1404-0002',
        internalCode: 'GOL-202',
        title: 'نقشه‌برداری توپوگرافی و عوارض شهرک گلستان',
        description: 'برداشت عوارض مسطحاتی و ارتفاعی جهت طراحی کانال‌های دفع آب‌های سطحی',
        clientId: `cli_demo_2_${userId}`,
        clientSnapshot: {
          id: `cli_demo_2_${userId}`,
          type: 'individual',
          fullName: 'مهندس حمیدرضا حسینی',
          phone: '09132523456',
          nationalId: '4430281991',
          address: 'یزد، خیابان کاشانی، کوچه مسکن، پلاک ۱۴',
          environment: 'demo',
        },
        services: {
          mainCategoryId: 'surveying_mapping',
          selectedSubServiceIds: ['sur_1', 'sur_2', 'sur_4'],
          primarySubServiceId: 'sur_1',
        },
        location: {
          province: 'یزد',
          city: 'یزد',
          address: 'یزد، بلوار مدرس، شهرک گلستان، قطعات ۱۲ تا ۴۵',
          latitude: 31.8652,
          longitude: 54.3821,
        },
        registrationDateJalali: '1404/05/20',
        startDateJalali: '1404/06/01',
        agreedDeliveryDateJalali: '1404/07/15',
        status: 'active',
        attachments: [],
        createdByUserId: userId,
        createdAt: '2026-08-20T10:00:00.000Z',
        updatedAt: '2026-08-25T11:00:00.000Z',
        environment: 'demo',
      },
      {
        id: `prj_demo_103_${userId}`,
        projectCode: 'PRJ-1404-0003',
        title: 'تعیین بر و کف و نقشه تک‌خطی پلاک ۱۲۴۸',
        description: 'برداشت وضع موجود گذر و معابر مجاور و اخذ استعلام بر و کف از شهرداری',
        clientId: `cli_demo_3_${userId}`,
        clientSnapshot: {
          id: `cli_demo_3_${userId}`,
          type: 'individual',
          fullName: 'دکتر محمد زارع‌زاده',
          phone: '09133534567',
          nationalId: '4431987654',
          address: 'یزد، صفائیه، بلوار دانشگاه، مجتمع اساتید',
          environment: 'demo',
        },
        services: {
          mainCategoryId: 'cadastral_registration',
          selectedSubServiceIds: ['cad_2', 'cad_4'],
          primarySubServiceId: 'cad_2',
        },
        location: {
          province: 'یزد',
          city: 'یزد',
          address: 'یزد، صفائیه، میدان اطلسی، کوچه بوستان سوم',
          latitude: 31.8412,
          longitude: 54.3601,
        },
        registrationDateJalali: '1404/06/01',
        startDateJalali: '1404/06/10',
        status: 'planned',
        attachments: [],
        createdByUserId: userId,
        createdAt: '2026-08-22T09:15:00.000Z',
        updatedAt: '2026-08-22T09:15:00.000Z',
        environment: 'demo',
      },
      {
        id: `prj_demo_104_${userId}`,
        projectCode: 'PRJ-1404-0004',
        title: 'برداشت عرصه و اعیان ماده ۱۴۷ اراضی صفائیه',
        description: 'تهیه نقشه UTM ماده ۱۴۷ همراه با گواهی مختصات گوشه‌ها',
        clientId: `cli_demo_3_${userId}`,
        clientSnapshot: {
          id: `cli_demo_3_${userId}`,
          type: 'individual',
          fullName: 'دکتر محمد زارع‌زاده',
          phone: '09133534567',
          nationalId: '4431987654',
          address: 'یزد، صفائیه، بلوار دانشگاه، مجتمع اساتید',
          environment: 'demo',
        },
        services: {
          mainCategoryId: 'cadastral_registration',
          selectedSubServiceIds: ['cad_3'],
          primarySubServiceId: 'cad_3',
        },
        location: {
          province: 'یزد',
          city: 'یزد',
          address: 'یزد، صفائیه، بلوار تیمسار فلاحی، کوچه پردیس',
          latitude: 31.8398,
          longitude: 54.3645,
        },
        registrationDateJalali: '1404/04/15',
        startDateJalali: '1404/04/20',
        agreedDeliveryDateJalali: '1404/05/20',
        actualEndDateJalali: '1404/05/18',
        status: 'completed',
        attachments: [],
        createdByUserId: userId,
        createdAt: '2026-07-06T08:00:00.000Z',
        updatedAt: '2026-08-09T17:00:00.000Z',
        environment: 'demo',
      },
    ];
  }

  async getProjects(userId: string): Promise<SurveyProject[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const key = this.getStorageKey(userId);
    const seededKey = this.getSeededKey(userId);
    const isSeeded = storage.get<boolean>(seededKey, false);

    let list = storage.get<SurveyProject[] | null>(key, null);

    if (!isDemoBusinessSeedDisabled() && !isSeeded && (!list || list.length === 0)) {
      list = this.getDefaultProjects(userId);
      storage.set(key, list);
      storage.set(seededKey, true);
      
      const year = getJalaliYear(getCurrentJalaliDate());
      const counterKey = this.getCounterKey(userId, year);
      const curCount = storage.get<number>(counterKey, 0);
      if (curCount < 4) {
        storage.set(counterKey, 4);
      }
    } else if (!list) {
      list = [];
    }

    // Filter strictly by createdByUserId
    return list.filter((p) => p.createdByUserId === userId && !p.deletedAt);
  }

  async getDeletedProjects(userId: string): Promise<SurveyProject[]> {
    const list = storage.get<SurveyProject[]>(this.getStorageKey(userId), []);
    return list.filter((p) => p.createdByUserId === userId && Boolean(p.deletedAt));
  }

  async getProjectById(userId: string, projectId: string): Promise<SurveyProject | null> {
    const projects = await this.getProjects(userId);
    return projects.find((p) => p.id === projectId && p.createdByUserId === userId) || null;
  }

  async createDraft(userId: string): Promise<SurveyProject> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const newId = `prj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Note: Project starts with projectCode: "" and is NOT saved to storage yet.
    // Code and storage persistence happen only on first real save.
    const emptyDraft: SurveyProject = {
      id: newId,
      projectCode: '',
      internalCode: '',
      title: '',
      description: '',
      clientId: '',
      clientSnapshot: {
        id: '',
        type: 'individual',
        fullName: '',
        phone: '',
        environment: 'demo',
      },
      services: {
        mainCategoryId: '',
        selectedSubServiceIds: [],
        primarySubServiceId: '',
        customServiceTitle: '',
      },
      location: {
        province: '',
        city: '',
        address: '',
        latitude: null,
        longitude: null,
      },
      registrationDateJalali: '',
      startDateJalali: '',
      agreedDeliveryDateJalali: '',
      actualEndDateJalali: '',
      status: 'draft',
      attachments: [],
      createdByUserId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      environment: 'demo',
    };

    return emptyDraft;
  }

  async saveDraft(project: SurveyProject): Promise<SurveyProject> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const userId = project.createdByUserId;
    if (!userId) {
      throw new Error('شناسه کاربر ایجادکننده الزامی است.');
    }

    const projects = storage.get<SurveyProject[]>(this.getStorageKey(userId), []);

    // If project code is not assigned yet, generate it now based on registration date
    let projectCode = project.projectCode;
    if (!projectCode || projectCode.trim() === '') {
      const regDate = project.registrationDateJalali || getCurrentJalaliDate();
      projectCode = this.generateProjectCode(userId, regDate);
    }

    const updatedProject: SurveyProject = {
      ...project,
      projectCode,
      updatedAt: new Date().toISOString(),
      environment: 'demo',
    };

    const idx = projects.findIndex((p) => p.id === project.id);
    let updatedList: SurveyProject[];
    if (idx >= 0) {
      // Ensure user owns this project
      if (projects[idx].createdByUserId !== userId) {
        throw new Error('دسترسی به این پروژه برای کاربر جاری مجاز نمی‌باشد.');
      }
      updatedList = [...projects];
      updatedList[idx] = updatedProject;
    } else {
      updatedList = [updatedProject, ...projects];
    }

    storage.set(this.getStorageKey(userId), updatedList);
    return updatedProject;
  }

  async finalizeProject(project: SurveyProject): Promise<SurveyProject> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const userId = project.createdByUserId;
    if (!userId) {
      throw new Error('شناسه کاربر ایجادکننده الزامی است.');
    }

    const nextStatus = project.status === 'draft' ? 'planned' : project.status;
    const finalized: SurveyProject = {
      ...project,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      environment: 'demo',
    };

    return this.saveDraft(finalized);
  }

  async archiveProject(userId: string, projectId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const projects = storage.get<SurveyProject[]>(this.getStorageKey(userId), []);
    const targetIndex = projects.findIndex((p) => p.id === projectId && p.createdByUserId === userId);
    if (targetIndex === -1) return;

    projects[targetIndex].status = 'archived';
    projects[targetIndex].updatedAt = new Date().toISOString();
    storage.set(this.getStorageKey(userId), projects);
  }

  async softDeleteProject(userId: string, projectId: string, role: UserRole): Promise<void> {
    if (role !== 'surveyor') throw new Error('حذف پروژه فقط برای نقشه‌بردار مالک مجاز است.');
    const key = this.getStorageKey(userId);
    const all = storage.get<SurveyProject[]>(key, []);
    const index = all.findIndex((p) => p.id === projectId);
    if (index < 0 || all[index].createdByUserId !== userId) throw new Error('فقط نقشه‌بردار مالک پروژه مجاز به حذف آن است.');
    if (all[index].deletedAt) throw new Error('این پروژه قبلاً حذف شده است.');
    all[index] = { ...all[index], deletedAt: new Date().toISOString(), deletedBy: userId, updatedAt: new Date().toISOString() };
    storage.set(key, all);
  }

  async restoreProject(userId: string, projectId: string, role: UserRole): Promise<void> {
    if (role !== 'surveyor') throw new Error('بازیابی پروژه فقط برای نقشه‌بردار مالک مجاز است.');
    const key = this.getStorageKey(userId);
    const all = storage.get<SurveyProject[]>(key, []);
    const index = all.findIndex((p) => p.id === projectId);
    if (index < 0 || all[index].createdByUserId !== userId) throw new Error('فقط نقشه‌بردار مالک پروژه مجاز به بازیابی آن است.');
    if (!all[index].deletedAt) throw new Error('این پروژه حذف نشده است.');
    const { deletedAt: _deletedAt, deletedBy: _deletedBy, ...restored } = all[index];
    all[index] = { ...restored, updatedAt: new Date().toISOString() };
    storage.set(key, all);
  }

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const projects = await this.getProjects(userId);
    const activeCount = projects.filter((p) => (p.status === 'active' || p.status === 'planned') && p.createdByUserId === userId).length;
    const pendingCount = projects.filter((p) => p.status === 'draft' && p.createdByUserId === userId).length;

    return {
      activeProjectsCount: activeCount,
      pendingApprovalCount: pendingCount,
      unpaidInvoicesCount: 1,
      totalEarningsToman: 48500000,
      environment: 'demo',
    };
  }

  async getRecentProjects(userId: string): Promise<RecentProject[]> {
    const projects = await this.getProjects(userId);
    return projects
      .filter((p) => p.createdByUserId === userId)
      .slice(0, 5)
      .map((p) => {
        const clientName = p.clientSnapshot.type === 'legal'
          ? p.clientSnapshot.companyName || 'کارفرمای حقوقی'
          : p.clientSnapshot.fullName || 'کارفرمای حقیقی';

        const serviceLabel = getSubServiceLabel(p.services.mainCategoryId, p.services.primarySubServiceId);

        let statusLabel = 'پیش‌نویس';
        if (p.status === 'active') statusLabel = 'در حال اجرا';
        else if (p.status === 'planned') statusLabel = 'برنامه‌ریزی‌شده';
        else if (p.status === 'paused') statusLabel = 'متوقف‌شده';
        else if (p.status === 'completed') statusLabel = 'تکمیل‌شده';
        else if (p.status === 'archived') statusLabel = 'بایگانی‌شده';

        let progress = 0;
        if (p.status === 'completed') progress = 100;
        else if (p.status === 'active') progress = 65;
        else if (p.status === 'planned') progress = 25;
        else if (p.status === 'draft') progress = 10;

        return {
          id: p.id,
          title: p.title || `پروژه بدون عنوان (${p.projectCode || 'پیش‌نویس'})`,
          clientName,
          serviceType: serviceLabel,
          status: p.status === 'active' ? 'active' : p.status === 'completed' ? 'completed' : 'in_progress',
          statusLabel,
          progressPercentage: progress,
          amountToman: 12500000,
          date: p.startDateJalali || p.registrationDateJalali || '۱۴۰۴/۰۶/۰۱',
          environment: 'demo',
        };
      });
  }

  async getNotifications(_userId: string): Promise<Notification[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return [
      {
        id: 'notif_1',
        title: 'ثبت پروژه جدید در سامانه',
        message: 'پروژه جدید با کد یکتا در کارتابل مهندسی شما ثبت گردید.',
        date: '۱ ساعت پیش',
        read: false,
        type: 'success',
        environment: 'demo',
      },
      {
        id: 'notif_2',
        title: 'یادآوری تکمیل اطلاعات پرونده',
        message: 'جهت صدور قرارداد داخلی و پیش‌فاکتور، اطلاعات هویتی و شماره شبا را تکمیل فرمایید.',
        date: 'دیروز',
        read: false,
        type: 'alert',
        environment: 'demo',
      },
      {
        id: 'notif_3',
        title: 'به‌روزرسانی تعرفه پایه استان یزد',
        message: 'ضرایب شاخص هزینه اکیپ و استهلاک تجهیزات در نسخه نمایشی بارگذاری گردید.',
        date: '۳ روز پیش',
        read: true,
        type: 'info',
        environment: 'demo',
      },
    ];
  }

  async markNotificationAsRead(_id: string): Promise<void> {
    // No-op
  }
}
