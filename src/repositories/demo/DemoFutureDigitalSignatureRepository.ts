import { FUTURE_FEATURE_FLAGS } from '../../config/futureFeatureFlags';
import { DigitalSignatureState, FutureCapabilityEnvironment } from '../../models/FutureCapabilities';
import { RepositoryActor } from '../../models/Stage6Models';
import { IFutureDigitalSignatureRepository } from '../interfaces/IFutureDigitalSignatureRepository';

export class DemoFutureDigitalSignatureRepository implements IFutureDigitalSignatureRepository {
  constructor(private readonly environment: FutureCapabilityEnvironment = 'demo') {}

  private assertEnvironment(actor: RepositoryActor): void {
    if (actor.environment !== this.environment) throw new Error('دسترسی بین محیط Demo و Real مجاز نیست.');
  }

  async getState(actor: RepositoryActor): Promise<DigitalSignatureState> {
    this.assertEnvironment(actor);
    return { status: 'unavailable', isEnabled: FUTURE_FEATURE_FLAGS.digitalSignature, environment: this.environment, schemaVersion: 1 };
  }

  async requestSignature(actor: RepositoryActor): Promise<never> {
    this.assertEnvironment(actor);
    throw new Error('امضای دیجیتال نمایشی است و اعتبار حقوقی ندارد');
  }
}

