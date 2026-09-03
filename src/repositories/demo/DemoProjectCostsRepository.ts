import { IProjectCostsRepository } from '../interfaces/IProjectCostsRepository';
import { ProjectCostEstimate, CostLineItem } from '../../models/ProjectCost';
import { storage } from '../../utils/storage';

export class DemoProjectCostsRepository implements IProjectCostsRepository {
  private storageKey(userId: string, projectId: string): string {
    return `surveying.projectCosts.v1.${userId}.${projectId}`;
  }

  public async getProjectCost(userId: string, projectId: string): Promise<ProjectCostEstimate> {
    const key = this.storageKey(userId, projectId);
    const existing = storage.get<ProjectCostEstimate | null>(key, null);
    if (existing) return existing;

    // Check if it's the demo project 101, provide realistic initial cost data
    let initialItems: CostLineItem[] = [];
    let initialOfficeCost = { totalAmount: 0, notes: '' };
    let initialTransport = { enabled: false, totalAmount: 0, notes: '' };
    let initialAccommodation = { enabled: false, totalAmount: 0, notes: '' };

    if (projectId.includes('prj_demo_101')) {
      initialItems = [
        {
          id: 'item_demo_1',
          category: 'labor',
          title: 'سرپرست اکیپ',
          quantity: 3,
          unit: 'روز',
          unitRate: 2500000,
          calculatedAmount: 7500000,
          finalAmount: 7500000,
          isManuallyEdited: false,
          notes: 'مدیریت و کنترل بنچ‌مارک‌های عرصه',
        },
        {
          id: 'item_demo_2',
          category: 'labor',
          title: 'کارشناس نقشه‌برداری',
          quantity: 3,
          unit: 'روز',
          unitRate: 1800000,
          calculatedAmount: 5400000,
          finalAmount: 5400000,
          isManuallyEdited: false,
          notes: 'برداشت ازبیلت اسکلت و بازشوها',
        },
        {
          id: 'item_demo_3',
          category: 'labor',
          title: 'کمک‌نقشه‌بردار',
          quantity: 3,
          unit: 'روز',
          unitRate: 1000000,
          calculatedAmount: 3000000,
          finalAmount: 3000000,
          isManuallyEdited: false,
          notes: 'میرداری و نشانه‌گذاری',
        },
        {
          id: 'item_demo_4',
          category: 'equipment',
          title: 'توتال استیشن (ملکی)',
          quantity: 3,
          unit: 'روز',
          unitRate: 1400000, // 1.2M rate + 200k depreciation
          calculatedAmount: 4200000,
          finalAmount: 4200000,
          isManuallyEdited: false,
          notes: 'دقت زاویه‌ای ۲ ثانیه با تجهیزات جانبی کامل',
        },
        {
          id: 'item_demo_5',
          category: 'materials',
          title: 'میخ فلزی',
          quantity: 30,
          unit: 'عدد',
          unitRate: 25000,
          calculatedAmount: 750000,
          finalAmount: 750000,
          isManuallyEdited: false,
          notes: 'میخ‌کوبی نقاط ثابت سازه‌ای',
        },
        {
          id: 'item_demo_6',
          category: 'materials',
          title: 'رنگ اسپری',
          quantity: 4,
          unit: 'قوطی',
          unitRate: 95000,
          calculatedAmount: 380000,
          finalAmount: 380000,
          isManuallyEdited: false,
          notes: 'نشانه‌گذاری ایستگاه‌ها',
        },
        {
          id: 'item_demo_7',
          category: 'transportation',
          title: 'خودرو صحرایی و ایاب و ذهاب',
          quantity: 3,
          unit: 'روز',
          unitRate: 950000,
          calculatedAmount: 2850000,
          finalAmount: 2850000,
          isManuallyEdited: false,
          notes: 'تردد بین کارگاه و دفتر یزد',
        },
      ];
      initialOfficeCost = {
        totalAmount: 3500000,
        notes: 'ترسیم نقشه‌های ازبیلت طبقات در اتوکد، محاسبه مساحت‌ها و گزارش تفکیک',
      };
    }

    const newEstimate: ProjectCostEstimate = {
      id: `cost_${projectId}_${Date.now()}`,
      projectId,
      userId,
      items: initialItems,
      officeCost: initialOfficeCost,
      transportationLumpSum: initialTransport,
      accommodationLumpSum: initialAccommodation,
      updatedAt: new Date().toISOString(),
      environment: 'demo',
      currency: 'TOMAN',
      schemaVersion: 1,
    };
    storage.set(key, newEstimate);
    return newEstimate;
  }

  public async saveProjectCost(cost: ProjectCostEstimate): Promise<ProjectCostEstimate> {
    // Clean and validate items before saving (remove completely empty / invalid items)
    const validItems = cost.items.filter((item) => {
      const hasTitle = item.title && item.title.trim() !== '';
      const hasAmount = item.finalAmount > 0 && item.quantity > 0 && item.unitRate > 0;
      return hasTitle && hasAmount;
    });

    const updated: ProjectCostEstimate = {
      ...cost,
      officeCost: {
        ...cost.officeCost,
        totalAmount: Math.max(0, cost.officeCost.totalAmount || 0),
      },
      transportationLumpSum: cost.transportationLumpSum ? {
        ...cost.transportationLumpSum,
        totalAmount: Math.max(0, cost.transportationLumpSum.totalAmount || 0),
      } : undefined,
      accommodationLumpSum: cost.accommodationLumpSum ? {
        ...cost.accommodationLumpSum,
        totalAmount: Math.max(0, cost.accommodationLumpSum.totalAmount || 0),
      } : undefined,
      updatedAt: new Date().toISOString(),
      currency: 'TOMAN',
      schemaVersion: 1,
      items: validItems.map((item) => ({
        ...item,
        depreciationAmount: item.equipmentOwnership === 'rented' ? 0 : Math.max(0, item.depreciationAmount || 0),
      })),
    };
    storage.set(this.storageKey(cost.userId, cost.projectId), updated);
    return updated;
  }

  public async deleteCostItem(
    userId: string,
    projectId: string,
    itemId: string
  ): Promise<ProjectCostEstimate> {
    const cost = await this.getProjectCost(userId, projectId);
    cost.items = cost.items.filter((i) => i.id !== itemId);
    return this.saveProjectCost(cost);
  }
}
