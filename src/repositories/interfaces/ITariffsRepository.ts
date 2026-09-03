import { ServiceTariff, UserRole } from '../../models';
export interface TariffUpdateInput { baseRate: number; minAmount: number; version: string; validFrom: string; sourceTitle: string; sourceUrl?: string; notes?: string; isActive?: boolean; }
export interface RepositoryActor { id: string; name: string; role: UserRole; }
export interface ITariffsRepository {
  getTariffs(): Promise<ServiceTariff[]>;
  getActiveTariff(serviceId: string): Promise<ServiceTariff | null>;
  getTariffVersions(): Promise<string[]>;
  getTariffsByVersion(version: string): Promise<ServiceTariff[]>;
  updateTariff(serviceId: string, input: TariffUpdateInput, actor: RepositoryActor): Promise<ServiceTariff>;
  setTariffActive(serviceId: string, active: boolean, actor: RepositoryActor): Promise<ServiceTariff>;
}
