export type AppTheme='light'|'dark'|'system';
const KEY='surveying.appearance.v1';
export const getTheme=():AppTheme=>{const value=localStorage.getItem(KEY);return value==='dark'||value==='system'?value:'light';};
export const applyTheme=(theme:AppTheme)=>{localStorage.setItem(KEY,theme);const dark=theme==='dark'||(theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';};
