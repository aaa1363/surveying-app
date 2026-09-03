import {registerPlugin} from '@capacitor/core';

interface WritePdfOptions {fileName:string;data:string;}
interface WritePdfResult {uri:string;}
interface AppCacheFilePlugin {writePdf(options:WritePdfOptions):Promise<WritePdfResult>;}

/** Native-only, app-cache-scoped PDF writer. It requests no Android permission. */
export const AppCacheFile=registerPlugin<AppCacheFilePlugin>('AppCacheFile');
