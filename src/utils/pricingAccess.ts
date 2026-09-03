import { UserRole } from '../models';
export const canViewTariffs=(role:UserRole)=>role==='admin'||role==='surveyor';
export const canEditPricing=(role:UserRole)=>role==='admin';
