import { User } from '../../models/User';

export interface SurveyorDashboardProps {
  user: User;
  onNavigateToProjects: () => void;
  onNavigateToRates?: () => void;
  onNavigateToPricing: () => void;
  onNavigateToDocuments: (projectId?: string) => void;
  onNavigateToProfile: () => void;
}
