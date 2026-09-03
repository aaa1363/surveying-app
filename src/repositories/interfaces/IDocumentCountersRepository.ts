import { DocumentType } from '../../models';

export interface IDocumentCountersRepository {
  getNextDocumentNumber(userId: string, type: DocumentType, jalaliYear: number): Promise<string>;
  peekCurrentNumber(userId: string, type: DocumentType, jalaliYear: number): Promise<number>;
}
