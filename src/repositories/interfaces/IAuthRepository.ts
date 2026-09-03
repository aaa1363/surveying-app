import { User, RegisterDTO, UserRole } from '../../models/User';

export interface IAuthRepository {
  loginWithDemoOtp(phone: string, otp: string, role: UserRole): Promise<{ user: User; token: string }>;
  register(data: RegisterDTO): Promise<{ user: User; token: string }>;
  getCurrentUser(): Promise<User | null>;
  logout(): Promise<void>;
}
