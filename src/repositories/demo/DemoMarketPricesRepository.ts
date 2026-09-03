/**
 * Demo Market Prices Repository
 * Storage Key: surveying.marketPrices.v1
 */

import { MarketPriceRecord, MarketStatistics, SEED_DEMO_MARKET_RECORDS } from '../../models';
import { IMarketPricesRepository } from '../interfaces/IMarketPricesRepository';
import { storage } from '../../utils/storage';
import { getMarketStatisticsForService } from '../../utils/pricingEngine';
import { DemoPricingSettingsRepository } from './DemoPricingSettingsRepository';
import { MarketDataMode } from '../interfaces/IMarketPricesRepository';

const STORAGE_KEY = 'surveying.marketPrices.v1';
const settingsRepo = new DemoPricingSettingsRepository();

export class DemoMarketPricesRepository implements IMarketPricesRepository {
  async getMarketRecords(serviceId: string | undefined, mode: MarketDataMode): Promise<MarketPriceRecord[]> {
    let records = storage.get<MarketPriceRecord[]>(STORAGE_KEY, SEED_DEMO_MARKET_RECORDS);
    if (!records || records.length === 0) {
      storage.set(STORAGE_KEY, SEED_DEMO_MARKET_RECORDS);
      records = SEED_DEMO_MARKET_RECORDS;
    }

    let filtered = records.filter((r) => mode === 'demo' ? r.isDemo : !r.isDemo);
    if (serviceId) {
      filtered = filtered.filter((r) => r.serviceId === serviceId);
    }

    return filtered;
  }

  async getMarketStatistics(serviceId: string, mode: MarketDataMode, exclude?: { projectId?: string; estimateId?: string; sourceRecordId?: string }): Promise<MarketStatistics> {
    const records = await this.getMarketRecords(serviceId, mode);
    const settings = await settingsRepo.getSettings();
    return getMarketStatisticsForService(records, serviceId, settings, exclude);
  }

  async recordProjectProposal(
    entry: Omit<MarketPriceRecord, 'id' | 'createdAt' | 'updatedAt' | 'isOutlier'>
  ): Promise<MarketPriceRecord> {
    const records = storage.get<MarketPriceRecord[]>(STORAGE_KEY, SEED_DEMO_MARKET_RECORDS);
    const now = new Date().toISOString();

    // Prevent duplicate proposal inflation for same user & project: update existing if present
    const existingIndex = records.findIndex(
      (r) => r.userId === entry.userId && r.projectId === entry.projectId && r.serviceId === entry.serviceId
    );

    let finalRecord: MarketPriceRecord;

    if (existingIndex >= 0) {
      finalRecord = {
        ...records[existingIndex],
        ...entry,
        isOutlier: false,
        schemaVersion: 1,
        updatedAt: now,
      };
      records[existingIndex] = finalRecord;
    } else {
      finalRecord = {
        ...entry,
        id: `mkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        isOutlier: false,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      };
      records.unshift(finalRecord);
    }

    storage.set(STORAGE_KEY, records);
    return finalRecord;
  }

  async resetToDemo(): Promise<void> {
    storage.set(STORAGE_KEY, SEED_DEMO_MARKET_RECORDS);
  }

  async clearDemoData(): Promise<void> {
    const records = storage.get<MarketPriceRecord[]>(STORAGE_KEY, SEED_DEMO_MARKET_RECORDS);
    const realOnly = records.filter((r) => !r.isDemo);
    storage.set(STORAGE_KEY, realOnly);
  }
}
