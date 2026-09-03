import { DigitalSignatureState } from '../../models/FutureCapabilities';
import { RepositoryActor } from '../../models/Stage6Models';

export interface IFutureDigitalSignatureRepository {
  getState(actor: RepositoryActor): Promise<DigitalSignatureState>;
  requestSignature(actor: RepositoryActor): Promise<never>;
}

