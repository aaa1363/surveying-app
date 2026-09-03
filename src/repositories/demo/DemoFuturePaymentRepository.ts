import { FUTURE_FEATURE_FLAGS } from '../../config/futureFeatureFlags';
import { FutureCapabilityEnvironment, PaymentGatewayState } from '../../models/FutureCapabilities';
import { RepositoryActor } from '../../models/Stage6Models';
import { IFuturePaymentRepository } from '../interfaces/IFuturePaymentRepository';

export class DemoFuturePaymentRepository implements IFuturePaymentRepository {
  constructor(private readonly environment: FutureCapabilityEnvironment = 'demo') {}

  private assertEnvironment(actor: RepositoryActor): void {
    if (actor.environment !== this.environment) throw new Error('دسترسی بین محیط Demo و Real مجاز نیست.');
  }

  async getState(actor: RepositoryActor): Promise<PaymentGatewayState> {
    this.assertEnvironment(actor);
    return { status: 'unavailable', isEnabled: FUTURE_FEATURE_FLAGS.paymentGateway, environment: this.environment, schemaVersion: 1 };
  }

  async requestPayment(actor: RepositoryActor): Promise<never> {
    this.assertEnvironment(actor);
    throw new Error('قابلیت آینده — غیرفعال');
  }
}

