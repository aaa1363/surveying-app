import { ProjectClient } from '../../models/Client';

export interface IClientRepository {
  getClients(userId: string): Promise<ProjectClient[]>;
  getClientById(userId: string, clientId: string): Promise<ProjectClient | null>;
  createClient(userId: string, client: ProjectClient): Promise<ProjectClient>;
  updateClient(userId: string, client: ProjectClient): Promise<ProjectClient>;
}
