export type AuthScreen = 'welcome' | 'login' | 'register';
export type AppTab =
  | 'home'
  | 'projects'
  | 'rates'
  | 'pricing'
  | 'documents'
  | 'profile'
  | 'moderation'
  | 'client_explore'
  | 'validation_lab'
  | 'client_surveyors'
  | 'client_prices'
  | 'client_requests'
  | 'admin_management'
  | 'admin_tariffs'
  | 'admin_settings';

export interface RouteState {
  authScreen: AuthScreen;
  activeTab: AppTab;
  isAuthenticated: boolean;
}

const legacyRedirects:Record<string,AppTab>={rates:'pricing',moderation:'admin_management',client_explore:'client_surveyors'};
export function resolveAppTab(hash:string,role:'surveyor'|'client'|'admin'):AppTab{
 const raw=hash.replace(/^#\/?/,'').split('/')[0]||'home';const tab=(legacyRedirects[raw]||raw) as AppTab;
 const allowed=role==='surveyor'?['home','projects','pricing','documents','profile']:role==='client'?['home','client_surveyors','client_prices','client_requests','profile']:['home','admin_management','admin_tariffs','validation_lab','admin_settings'];
 return allowed.includes(tab)?tab:'home';
}
