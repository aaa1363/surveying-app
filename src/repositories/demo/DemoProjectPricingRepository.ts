/**
 * Demo Project Pricing Repository
 * Storage Key: surveying.projectPricing.v1.{userId}.{projectId}
 */

import { ProjectPriceEstimate } from '../../models';
import { IProjectPricingRepository } from '../interfaces/IProjectPricingRepository';
import { storage } from '../../utils/storage';
import { DemoMarketPricesRepository } from './DemoMarketPricesRepository';

const marketPricesRepo = new DemoMarketPricesRepository();

function getStorageKey(userId: string, projectId: string): string {
  return `surveying.projectPricing.v1.${userId}.${projectId}`;
}

export class DemoProjectPricingRepository implements IProjectPricingRepository {
  async getEstimate(userId: string, projectId: string): Promise<ProjectPriceEstimate | null> {
    if (!userId || !projectId) return null;
    const key = getStorageKey(userId, projectId);
    return storage.get<ProjectPriceEstimate | null>(key, null);
  }

  async saveEstimate(estimate: ProjectPriceEstimate): Promise<ProjectPriceEstimate> {
    const key = getStorageKey(estimate.userId, estimate.projectId);
    const now = new Date().toISOString();
    const cleanEstimate: ProjectPriceEstimate = {
      ...estimate,
      updatedAt: now,
      currency: 'TOMAN',
      schemaVersion: 1,
    };

    storage.set(key, cleanEstimate);

    // Keep an index of user's estimated projects for fast listing
    const indexKey = `surveying.projectPricingIndex.v1.${estimate.userId}`;
    const projectIds = storage.get<string[]>(indexKey, []);
    if (!projectIds.includes(estimate.projectId)) {
      projectIds.push(estimate.projectId);
      storage.set(indexKey, projectIds);
    }

    // Record or update market proposal record if price is valid (> 0)
    if (cleanEstimate.finalPrice > 0 && cleanEstimate.quantity > 0) {
      const unitPrice = Math.round(cleanEstimate.finalPrice / cleanEstimate.quantity);
      await marketPricesRepo.recordProjectProposal({
        serviceId: cleanEstimate.serviceId,
        serviceTitle: cleanEstimate.serviceTitle || 'خدمت نقشه‌برداری',
        projectId: cleanEstimate.projectId,
        userId: cleanEstimate.userId,
        unit: cleanEstimate.unit,
        unitPrice,
        totalPrice: cleanEstimate.finalPrice,
        quantity: cleanEstimate.quantity,
        projectStatus: 'proposal',
        reliabilityWeight: 0.9,
        isDemo: cleanEstimate.isDemo ?? true,
        sourceEstimateId: cleanEstimate.id,
        schemaVersion: 1,
      });
    }

    return cleanEstimate;
  }

  async deleteEstimate(userId: string, projectId: string): Promise<void> {
    const key = getStorageKey(userId, projectId);
    storage.remove(key);

    const indexKey = `surveying.projectPricingIndex.v1.${userId}`;
    const projectIds = storage.get<string[]>(indexKey, []);
    const updated = projectIds.filter((id) => id !== projectId);
    storage.set(indexKey, updated);
  }

  async getAllUserEstimates(userId: string): Promise<ProjectPriceEstimate[]> {
    const indexKey = `surveying.projectPricingIndex.v1.${userId}`;
    const projectIds = storage.get<string[]>(indexKey, []);
    const estimates: ProjectPriceEstimate[] = [];

    for (const pid of projectIds) {
      const est = await this.getEstimate(userId, pid);
      if (est) {
        estimates.push(est);
      }
    }

    return estimates;
  }
}

