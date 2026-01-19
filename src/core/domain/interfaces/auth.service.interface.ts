import { User } from '../entities/user.entity';

export interface IAuthService {
  validateUser(username: string, password: string): Promise<User | null>;
  generateToken(user: User): Promise<string>;
  generateRefreshToken(user: User): Promise<string>;
  generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }>;
  verifyToken(token: string): Promise<any>;
  verifyRefreshToken(token: string): Promise<any>;
  refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
}
