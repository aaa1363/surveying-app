import { RepositoryActor } from '../models/Stage6Models';
import { storage } from './storage';

export const validationLabEnabled = Object.freeze({ demo: true, real: false });
const key=(environment:'demo'|'real')=>`surveying.validationLabFeature.v1.${environment}`;
export function isValidationLabEnabled(actor:RepositoryActor):boolean{
  if(actor.role!=='admin')return false;
  return storage.get<boolean>(key(actor.environment),validationLabEnabled[actor.environment]);
}
export function setValidationLabEnabled(actor:RepositoryActor,enabled:boolean):boolean{
  if(actor.role!=='admin'||actor.environment!=='demo')throw new Error('فعال‌سازی آزمایشگاه فقط برای مدیر محیط Demo مجاز است.');
  storage.set(key('demo'),enabled);return enabled;
}
