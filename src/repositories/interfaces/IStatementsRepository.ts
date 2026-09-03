import { ProgressStatement, ManualApproval } from '../../models';

export interface IStatementsRepository {
  getStatements(userId: string, projectId: string): Promise<ProgressStatement[]>;
  getStatementById(userId: string, projectId: string, statementId: string): Promise<ProgressStatement | null>;
  saveStatement(statement: ProgressStatement): Promise<ProgressStatement>;
  issueStatement(userId: string, projectId: string, statementId: string, issueDateJalali: string): Promise<ProgressStatement>;
  recordManualApproval(userId: string, projectId: string, statementId: string, approval: ManualApproval): Promise<ProgressStatement>;
  cancelStatement(userId: string, projectId: string, statementId: string, reason: string, dateJalali: string): Promise<ProgressStatement>;
}
