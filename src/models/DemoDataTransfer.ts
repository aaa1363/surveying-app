export interface DemoDataExport {
  schemaVersion: 1;
  environment: 'demo';
  exportedAt: string;
  data: Record<string, unknown>;
}
export interface DemoResetScope {
  keys: string[];
  confirmationPhrase: string;
}
