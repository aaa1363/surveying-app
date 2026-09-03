import { SurveyingService } from '../../models';
import { RepositoryActor } from './ITariffsRepository';

export interface IServicesRepository {
  getServices(): Promise<SurveyingService[]>;
  getServiceById(id: string): Promise<SurveyingService | null>;
  saveService(service: SurveyingService, actor: RepositoryActor): Promise<SurveyingService>;
  toggleServiceActive(id: string, isActive: boolean, actor: RepositoryActor): Promise<void>;
  resetToDemo(actor: RepositoryActor): Promise<void>;
  clearDemoData(actor: RepositoryActor): Promise<void>;
}
