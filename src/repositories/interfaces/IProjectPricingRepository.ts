import { ProjectPriceEstimate } from '../../models';

export interface IProjectPricingRepository {
  getEstimate(userId: string, projectId: string): Promise<ProjectPriceEstimate | null>;
  saveEstimate(estimate: ProjectPriceEstimate): Promise<ProjectPriceEstimate>;
  deleteEstimate(userId: string, projectId: string): Promise<void>;
  getAllUserEstimates(userId: string): Promise<ProjectPriceEstimate[]>;
}

