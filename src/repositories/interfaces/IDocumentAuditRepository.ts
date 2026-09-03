import { DocumentStatusHistory, DocumentType } from '../../models';

export interface IDocumentAuditRepository {
  recordStatusChange(params: {
    documentId: string;
    documentType: DocumentType;
    fromStatus: string;
    toStatus: string;
    actionDateJalali: string;
    changedByUserId: string;
    reason?: string;
  }): Promise<DocumentStatusHistory>;
  
  getAuditLog(documentId: string): Promise<DocumentStatusHistory[]>;
  getAllLogs(): Promise<DocumentStatusHistory[]>;
}
