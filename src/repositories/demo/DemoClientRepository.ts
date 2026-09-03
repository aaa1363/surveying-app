import { IClientRepository } from '../interfaces/IClientRepository';
import { ProjectClient } from '../../models/Client';
import { storage } from '../../utils/storage';
import { toEnglishDigits } from '../../utils/validators';
import {isDemoBusinessSeedDisabled} from '../../utils/demoSeedPolicy';

export class DemoClientRepository implements IClientRepository {
  private getStorageKey(userId: string): string {
    return `geo_demo_clients_${userId}`;
  }

  private getSeededKey(userId: string): string {
    return `geo_demo_clients_seeded_${userId}`;
  }

  private getDefaultClients(userId: string): ProjectClient[] {
    return [
      {
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
      {
        id: `cli_demo_2_${userId}`,
        type: 'individual',
        fullName: 'مهندس حمیدرضا حسینی',
        phone: '09132523456',
        nationalId: '4430281991',
        address: 'یزد، خیابان کاشانی، کوچه مسکن، پلاک ۱۴',
        environment: 'demo',
      },
      {
        id: `cli_demo_3_${userId}`,
        type: 'individual',
        fullName: 'دکتر محمد زارع‌زاده',
        phone: '09133534567',
        nationalId: '4431987654',
        address: 'یزد، صفائیه، بلوار دانشگاه، مجتمع اساتید',
        environment: 'demo',
      },
    ];
  }

  async getClients(userId: string): Promise<ProjectClient[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const key = this.getStorageKey(userId);
    const seededKey = this.getSeededKey(userId);
    const isSeeded = storage.get<boolean>(seededKey, false);

    let clients = storage.get<ProjectClient[] | null>(key, null);
    if (!isDemoBusinessSeedDisabled() && !isSeeded && (!clients || clients.length === 0)) {
      clients = this.getDefaultClients(userId);
      storage.set(key, clients);
      storage.set(seededKey, true);
    } else if (!clients) {
      clients = [];
    }
    return clients;
  }

  async getClientById(userId: string, clientId: string): Promise<ProjectClient | null> {
    const clients = await this.getClients(userId);
    return clients.find((c) => c.id === clientId) || null;
  }

  async createClient(userId: string, client: ProjectClient): Promise<ProjectClient> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const clients = await this.getClients(userId);

    const normPhone = toEnglishDigits(client.phone || '').trim();
    
    // Check if client with matching phone or matching ID already exists
    const existingIndex = clients.findIndex((c) => {
      if (client.id && c.id === client.id) return true;
      if (normPhone && toEnglishDigits(c.phone || '').trim() === normPhone) return true;
      return false;
    });

    if (existingIndex >= 0) {
      // Update existing client instead of duplicating
      const existing = clients[existingIndex];
      const updatedClient: ProjectClient = {
        ...existing,
        ...client,
        id: existing.id,
        environment: 'demo',
      };
      const updatedList = [...clients];
      updatedList[existingIndex] = updatedClient;
      storage.set(this.getStorageKey(userId), updatedList);
      return updatedClient;
    }

    const newClient: ProjectClient = {
      ...client,
      id: client.id || `cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      environment: 'demo',
    };
    const updated = [newClient, ...clients];
    storage.set(this.getStorageKey(userId), updated);
    return newClient;
  }

  async updateClient(userId: string, client: ProjectClient): Promise<ProjectClient> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const clients = await this.getClients(userId);
    const updatedClient: ProjectClient = {
      ...client,
      environment: 'demo',
    };
    const idx = clients.findIndex((c) => c.id === client.id);
    let updatedList: ProjectClient[];
    if (idx >= 0) {
      updatedList = [...clients];
      updatedList[idx] = updatedClient;
    } else {
      updatedList = [updatedClient, ...clients];
    }
    storage.set(this.getStorageKey(userId), updatedList);
    return updatedClient;
  }
}
