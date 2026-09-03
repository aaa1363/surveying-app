export type RecentProjectStatus = 'active' | 'pending_approval' | 'in_progress' | 'completed';

export interface RecentProject {
  id: string;
  title: string;
  clientName: string;
  serviceType: string;
  status: RecentProjectStatus;
  statusLabel: string;
  progressPercentage: number;
  amountToman: number;
  date: string;
  environment: 'demo';
}

