import { PaymentGatewayState } from '../../models/FutureCapabilities';
import { RepositoryActor } from '../../models/Stage6Models';

export interface IFuturePaymentRepository {
  getState(actor: RepositoryActor): Promise<PaymentGatewayState>;
  requestPayment(actor: RepositoryActor): Promise<never>;
}

