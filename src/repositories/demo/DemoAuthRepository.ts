import { IAuthRepository } from '../interfaces/IAuthRepository';
import { User, RegisterDTO, UserRole } from '../../models/User';
import { storage } from '../../utils/storage';
import { isValidIranianMobile, normalizeIranianMobile } from '../../utils/validators';

const STORAGE_KEY_USER = 'geo_demo_auth_user';
const STORAGE_KEY_ACCOUNTS = 'surveying.demo_local_accounts.v1';
const FIXED_DEMO_OTP = '12345';

export class DemoAuthRepository implements IAuthRepository {
  async loginWithDemoOtp(phone: string, otp: string, role: UserRole): Promise<{ user: User; token: string }> {
    // Artificial latency for authentic UI feel
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (!isValidIranianMobile(phone)) {
      throw new Error('فرمت شماره موبایل وارد شده صحیح نمی‌باشد. لطفاً شماره معتبر ایران (مانند ۰۹۱۲۳۴۵۶۷۸۹) وارد کنید.');
    }

    if (otp !== FIXED_DEMO_OTP) {
      throw new Error(`کد تأیید آزمایشی نادرست است. لطفاً کد آزمایشی ثابت (${FIXED_DEMO_OTP}) را وارد فرمایید.`);
    }

    const normalizedPhone = normalizeIranianMobile(phone);

    // Retrieve existing user if available
    const accounts = storage.get<Record<string, User>>(STORAGE_KEY_ACCOUNTS, {});
    const existing = accounts[normalizedPhone];
    if (existing) {
      storage.set(STORAGE_KEY_USER, existing);
      return { user: existing, token: `demo_token_${Date.now()}` };
    }

    // Generate a default demo user
    const newUser: User = {
      id: `usr_${Date.now()}`,
      profileId: `profile_${Date.now()}`,
      phone: normalizedPhone,
      role: role,
      entityType: 'individual',
      fullName: role === 'admin' ? 'مدیر نمایشی سامانه' : role === 'surveyor' ? 'مهندس علیرضا دهقانی' : 'شرکت توسعه عمران سپهر',
      firstName: role === 'surveyor' ? 'علیرضا' : role === 'admin' ? 'مدیر' : undefined,
      lastName: role === 'surveyor' ? 'دهقانی' : role === 'admin' ? 'نمایشی' : undefined,
      companyName: role === 'client' ? 'شرکت توسعه عمران سپهر' : undefined,
      createdAt: new Date().toISOString(),
      environment: 'demo'
    };

    storage.set(STORAGE_KEY_USER, newUser);
    return { user: newUser, token: `demo_token_${Date.now()}` };
  }

  async register(data: RegisterDTO): Promise<{ user: User; token: string }> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (!isValidIranianMobile(data.phone)) {
      throw new Error('فرمت شماره همراه نامعتبر است. لطفاً شماره ۱۱ رقمی معتبر ایران را درج نمایید.');
    }

    const normalizedPhone = normalizeIranianMobile(data.phone);

    let fullName = '';
    if (data.entityType === 'individual') {
      if (!data.firstName?.trim() || !data.lastName?.trim()) {
        throw new Error('لطفاً نام و نام خانوادگی خود را کامل وارد نمایید.');
      }
      fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;
    } else {
      if (!data.companyName?.trim() || !data.representativeName?.trim()) {
        throw new Error('لطفاً نام شرکت و نام نماینده را وارد نمایید.');
      }
      fullName = data.companyName.trim();
    }

    const user: User = {
      id: `usr_${Date.now()}`,
      profileId: `profile_${Date.now()}`,
      phone: normalizedPhone,
      role: data.role || 'surveyor',
      entityType: data.entityType,
      fullName: fullName,
      firstName: data.firstName?.trim(),
      lastName: data.lastName?.trim(),
      companyName: data.companyName?.trim(),
      representativeName: data.representativeName?.trim(),
      createdAt: new Date().toISOString(),
      environment: 'demo'
    };

    const accounts = storage.get<Record<string, User>>(STORAGE_KEY_ACCOUNTS, {});
    const existing = accounts[normalizedPhone];
    const stableUser = existing ? { ...existing, ...user, id: existing.id, profileId: existing.profileId, role: existing.role } : user;
    storage.set(STORAGE_KEY_ACCOUNTS, { ...accounts, [normalizedPhone]: stableUser });
    storage.set(STORAGE_KEY_USER, stableUser);
    return { user: stableUser, token: `demo_token_${Date.now()}` };
  }

  async getCurrentUser(): Promise<User | null> {
    return storage.get<User | null>(STORAGE_KEY_USER, null);
  }

  async logout(): Promise<void> {
    storage.remove(STORAGE_KEY_USER);
  }
}
