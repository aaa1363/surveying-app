import { DemoDataExport, DemoResetScope } from '../../models/DemoDataTransfer';
import { RepositoryActor } from '../../models/Stage6Models';

export interface IDemoDataRepository {
  exportData(actor: RepositoryActor): Promise<DemoDataExport>;
  importData(actor: RepositoryActor, source: string): Promise<number>;
  getResetScope(actor: RepositoryActor): Promise<DemoResetScope>;
  reset(actor: RepositoryActor, confirmationPhrase: string): Promise<number>;
}
