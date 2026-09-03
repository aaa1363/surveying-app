export type ClientType = 'individual' | 'legal';

export interface ProjectClient {
  id: string;
  type: ClientType;
  fullName?: string;
  companyName?: string;
  representativeName?: string;
  representativePosition?: string;
  phone: string;
  nationalId?: string;
  nationalIdentifier?: string;
  registrationNumber?: string;
  economicCode?: string;
  address?: string;
  environment: 'demo';
}
