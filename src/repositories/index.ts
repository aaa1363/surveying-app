import { IAuthRepository } from './interfaces/IAuthRepository';
import { IProfileRepository } from './interfaces/IProfileRepository';
import { IProjectRepository } from './interfaces/IProjectRepository';
import { IClientRepository } from './interfaces/IClientRepository';
import { IPersonalRatesRepository } from './interfaces/IPersonalRatesRepository';
import { IProjectCostsRepository } from './interfaces/IProjectCostsRepository';
import { DemoAuthRepository } from './demo/DemoAuthRepository';
import { DemoProfileRepository } from './demo/DemoProfileRepository';
import { DemoProjectRepository } from './demo/DemoProjectRepository';
import { DemoClientRepository } from './demo/DemoClientRepository';
import { DemoPersonalRatesRepository } from './demo/DemoPersonalRatesRepository';
import { DemoProjectCostsRepository } from './demo/DemoProjectCostsRepository';
import {
  IServicesRepository,
  ITariffsRepository,
  IPricingSettingsRepository,
  IProjectPricingRepository,
  IMarketPricesRepository,
  ITariffAuditRepository,
  IDocumentCountersRepository,
  IDocumentAuditRepository,
  IProformaRepository,
  IContractsRepository,
  IStatementsRepository,
  IInvoicesRepository,
  IPaymentsRepository,
  ISurveyorProfilesRepository,
  ISurveyorResumeRepository,
  ICredentialsRepository,
  IPortfolioRepository,
  IPublishedPricesRepository,
  ISurveyorSelectionsRepository,
  ISurveyorReviewsRepository,
  IModerationRepository,
  IDelegatedPermissionsRepository,
  IFuturePaymentRepository,
  IFutureDigitalSignatureRepository,
  IDemoDataRepository,
  IValidationLabRepository,
} from './interfaces';
import {
  DemoServicesRepository,
  DemoTariffsRepository,
  DemoPricingSettingsRepository,
  DemoProjectPricingRepository,
  DemoMarketPricesRepository,
  DemoTariffAuditRepository,
  DemoDocumentCountersRepository,
  DemoDocumentAuditRepository,
  DemoProformaRepository,
  DemoContractsRepository,
  DemoStatementsRepository,
  DemoInvoicesRepository,
  DemoPaymentsRepository,
  DemoSurveyorProfilesRepository,
  DemoSurveyorResumeRepository,
  DemoCredentialsRepository,
  DemoPortfolioRepository,
  DemoPublishedPricesRepository,
  DemoSurveyorSelectionsRepository,
  DemoSurveyorReviewsRepository,
  DemoModerationRepository,
  DemoDelegatedPermissionsRepository,
  DemoFuturePaymentRepository,
  DemoFutureDigitalSignatureRepository,
  DemoDataRepository,
  DemoValidationLabRepository,
} from './demo';

export * from './interfaces';
export * from './demo';

// Repository instances ready for injection (Can be swapped with Real API repositories later without touching UI)
export const authRepository: IAuthRepository = new DemoAuthRepository();
export const profileRepository: IProfileRepository = new DemoProfileRepository();
export const projectRepository: IProjectRepository = new DemoProjectRepository();
export const clientRepository: IClientRepository = new DemoClientRepository();
export const personalRatesRepository: IPersonalRatesRepository = new DemoPersonalRatesRepository();
export const projectCostsRepository: IProjectCostsRepository = new DemoProjectCostsRepository();
export const servicesRepository: IServicesRepository = new DemoServicesRepository();
export const tariffsRepository: ITariffsRepository = new DemoTariffsRepository();
export const pricingSettingsRepository: IPricingSettingsRepository = new DemoPricingSettingsRepository();
export const projectPricingRepository: IProjectPricingRepository = new DemoProjectPricingRepository();
export const marketPricesRepository: IMarketPricesRepository = new DemoMarketPricesRepository();
export const tariffAuditRepository: ITariffAuditRepository = new DemoTariffAuditRepository();
export const documentCountersRepository: IDocumentCountersRepository = new DemoDocumentCountersRepository();
export const documentAuditRepository: IDocumentAuditRepository = new DemoDocumentAuditRepository();
export const proformaRepository: IProformaRepository = new DemoProformaRepository();
export const contractsRepository: IContractsRepository = new DemoContractsRepository();
export const statementsRepository: IStatementsRepository = new DemoStatementsRepository();
export const invoicesRepository: IInvoicesRepository = new DemoInvoicesRepository();
export const paymentsRepository: IPaymentsRepository = new DemoPaymentsRepository();
export const surveyorProfilesRepository: ISurveyorProfilesRepository = new DemoSurveyorProfilesRepository();
export const surveyorResumeRepository: ISurveyorResumeRepository = new DemoSurveyorResumeRepository();
export const credentialsRepository: ICredentialsRepository = new DemoCredentialsRepository();
export const portfolioRepository: IPortfolioRepository = new DemoPortfolioRepository();
export const publishedPricesRepository: IPublishedPricesRepository = new DemoPublishedPricesRepository();
export const surveyorSelectionsRepository: ISurveyorSelectionsRepository = new DemoSurveyorSelectionsRepository();
export const surveyorReviewsRepository: ISurveyorReviewsRepository = new DemoSurveyorReviewsRepository();
export const moderationRepository: IModerationRepository = new DemoModerationRepository();
export const delegatedPermissionsRepository: IDelegatedPermissionsRepository = new DemoDelegatedPermissionsRepository();
export const futurePaymentRepository: IFuturePaymentRepository = new DemoFuturePaymentRepository();
export const futureDigitalSignatureRepository: IFutureDigitalSignatureRepository = new DemoFutureDigitalSignatureRepository();
export const demoDataRepository: IDemoDataRepository = new DemoDataRepository();
export const validationLabRepository: IValidationLabRepository = new DemoValidationLabRepository();
