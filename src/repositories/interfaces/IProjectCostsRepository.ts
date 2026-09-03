import { ProjectCostEstimate } from '../../models/ProjectCost';

export interface IProjectCostsRepository {
  getProjectCost(userId: string, projectId: string): Promise<ProjectCostEstimate>;
  saveProjectCost(cost: ProjectCostEstimate): Promise<ProjectCostEstimate>;
  deleteCostItem(userId: string, projectId: string, itemId: string): Promise<ProjectCostEstimate>;
}
