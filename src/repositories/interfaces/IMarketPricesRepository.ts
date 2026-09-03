import { MarketPriceRecord, MarketStatistics } from '../../models';
export type MarketDataMode = 'demo' | 'real';

export interface IMarketPricesRepository {
  getMarketRecords(serviceId: string | undefined, mode: MarketDataMode): Promise<MarketPriceRecord[]>;
  getMarketStatistics(serviceId: string, mode: MarketDataMode, exclude?: { projectId?: string; estimateId?: string; sourceRecordId?: string }): Promise<MarketStatistics>;
  recordProjectProposal(record: Omit<MarketPriceRecord, 'id' | 'createdAt' | 'updatedAt' | 'isOutlier'>): Promise<MarketPriceRecord>;
  resetToDemo(): Promise<void>;
  clearDemoData(): Promise<void>;
}
