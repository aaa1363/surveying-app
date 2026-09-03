import { PersonalRatesProfile } from '../../models/PersonalRates';

export interface IPersonalRatesRepository {
  getPersonalRates(userId: string): Promise<PersonalRatesProfile>;
  savePersonalRates(rates: PersonalRatesProfile): Promise<PersonalRatesProfile>;
  resetToDefaults(userId: string): Promise<PersonalRatesProfile>;
}
