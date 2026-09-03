import config from '../../capacitor.config';
import {readFileSync} from 'node:fs';

type TestResult = {title: string; passed: boolean; message: string};

export function runAndroidConfigurationTests(): TestResult[] {
  const serialized = JSON.stringify(config);
  const forbidden = /(localhost|https?:\/\/|server\s*:|api[_-]?key|token|keystore|certificate)/i;
  const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
  const gradle = readFileSync('android/app/build.gradle', 'utf8');
  return [
    ['شناسه برنامه آزمایشی صحیح باشد', config.appId === 'ir.surveying.demo'],
    ['نام فارسی برنامه صحیح باشد', config.appName === 'سامانه نقشه‌برداری — نسخه آزمایشی'],
    ['خروجی وب فقط dist باشد', config.webDir === 'dist'],
    ['هیچ آدرس توسعه یا راز در تنظیمات نباشد', !forbidden.test(serialized)],
    ['Manifest هیچ permission درخواست نکند', !/<uses-permission\b/.test(manifest)],
    ['ترافیک cleartext غیرفعال باشد', manifest.includes('android:usesCleartextTraffic="false"')],
    ['نسخه Android آزمایشی صحیح باشد', gradle.includes('versionName "0.11.0-demo"')],
  ].map(([title, passed]) => ({title: String(title), passed: Boolean(passed), message: passed ? 'موفق' : 'ناموفق'}));
}
