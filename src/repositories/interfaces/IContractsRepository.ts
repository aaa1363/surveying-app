import { Contract, ContractTemplate, ManualApproval } from '../../models';

export interface IContractsRepository {
  getContract(userId: string, projectId: string): Promise<Contract | null>;
  getDefaultTemplate(): Promise<ContractTemplate>;
  saveContract(contract: Contract): Promise<Contract>;
  issueContract(userId: string, projectId: string, issueDateJalali: string): Promise<Contract>;
  recordManualApproval(userId: string, projectId: string, approval: ManualApproval): Promise<Contract>;
  saveNewVersion(contract: Contract, changeSummary: string, updatedJalaliDate: string): Promise<Contract>;
  cancelContract(userId: string, projectId: string, reason: string, dateJalali: string): Promise<Contract>;
  updateStatus(userId: string, projectId: string, newStatus: Contract['status'], reason?: string, dateJalali?: string): Promise<Contract>;
}
