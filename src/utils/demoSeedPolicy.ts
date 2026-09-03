import {storage} from './storage';

export const DEMO_BUSINESS_SEED_DISABLED_KEY='surveying.demo_business_seed_disabled.v1';
export const isDemoBusinessSeedDisabled=()=>storage.get<boolean>(DEMO_BUSINESS_SEED_DISABLED_KEY,false);
export const disableDemoBusinessSeed=()=>storage.set(DEMO_BUSINESS_SEED_DISABLED_KEY,true);
