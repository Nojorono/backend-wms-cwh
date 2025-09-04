import { User } from '../entities/user.entity';

export interface IAuthService {
  validateUser(username: string, password: string): Promise<User | null>;
  generateToken(user: User): Promise<string>;
  verifyToken(token: string): Promise<any>;
}
