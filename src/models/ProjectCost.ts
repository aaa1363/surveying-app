export type CostCategory =
  | 'labor'
  | 'equipment'
  | 'materials'
  | 'transportation'
  | 'accommodation'
  | 'office'
  | 'other';

export interface CostLineItem {
  id: string;
  category: CostCategory;
  title: string;
  quantity: number;
  unit: string;
  unitRate: number; // Toman
  calculatedAmount: number; // quantity * unitRate
  finalAmount: number; // Toman (editable by user)
  isManuallyEdited: boolean; // flag if finalAmount was custom edited
  notes?: string;
  equipmentOwnership?: 'owned' | 'rented';
  baseRate?: number;
  depreciationAmount?: number;
}

export interface OfficeCostData {
  totalAmount: number; // Lump sum for office work
  notes?: string;
}

export interface LumpSumCostData {
  enabled: boolean;
  totalAmount: number;
  notes?: string;
}

export interface ProjectCostEstimate {
  id: string;
  projectId: string;
  userId: string;
  items: CostLineItem[];
  officeCost: OfficeCostData;
  transportationLumpSum?: LumpSumCostData;
  accommodationLumpSum?: LumpSumCostData;
  updatedAt: string;
  environment: 'demo';
  currency: 'TOMAN';
  schemaVersion: 1;
}

export interface ProjectCostSummary {
  totalLabor: number;
  totalEquipment: number;
  totalMaterials: number;
  totalTransportation: number;
  totalAccommodation: number;
  totalOffice: number;
  totalOther: number;
  grandTotal: number;
}

export function calculateProjectCostSummary(cost: ProjectCostEstimate): ProjectCostSummary {
  let totalLabor = 0;
  let totalEquipment = 0;
  let totalMaterials = 0;
  let totalTransportation = 0;
  let totalAccommodation = 0;
  let totalOther = 0;

  for (const item of cost.items) {
    const amount = Number(item.finalAmount) || 0;
    switch (item.category) {
      case 'labor':
        totalLabor += amount;
        break;
      case 'equipment':
        totalEquipment += amount;
        break;
      case 'materials':
        totalMaterials += amount;
        break;
      case 'transportation':
        // If lump sum is enabled, line items for transport might be skipped or summed
        totalTransportation += amount;
        break;
      case 'accommodation':
        totalAccommodation += amount;
        break;
      case 'other':
        totalOther += amount;
        break;
    }
  }

  // If lump sum is enabled, add it or use it
  if (cost.transportationLumpSum?.enabled) {
    totalTransportation += Number(cost.transportationLumpSum.totalAmount) || 0;
  }

  if (cost.accommodationLumpSum?.enabled) {
    totalAccommodation += Number(cost.accommodationLumpSum.totalAmount) || 0;
  }

  const totalOffice = Number(cost.officeCost?.totalAmount) || 0;

  const grandTotal =
    totalLabor +
    totalEquipment +
    totalMaterials +
    totalTransportation +
    totalAccommodation +
    totalOffice +
    totalOther;

  return {
    totalLabor,
    totalEquipment,
    totalMaterials,
    totalTransportation,
    totalAccommodation,
    totalOffice,
    totalOther,
    grandTotal,
  };
}
