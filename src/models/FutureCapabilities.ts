export type FutureCapabilityEnvironment = 'demo' | 'real';

export type PaymentGatewayStatus =
  | 'unavailable'
  | 'draft'
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type DigitalSignatureStatus =
  | 'unavailable'
  | 'unsigned'
  | 'pending'
  | 'signed'
  | 'rejected'
  | 'expired';

export interface FutureCapabilityState<TStatus extends string> {
  status: TStatus;
  isEnabled: false;
  environment: FutureCapabilityEnvironment;
  schemaVersion: 1;
}

export type PaymentGatewayState = FutureCapabilityState<PaymentGatewayStatus>;
export type DigitalSignatureState = FutureCapabilityState<DigitalSignatureStatus>;

