import { UserManage } from '../entities/user-manage.entity';
import { CreateUserManageDto } from '../../../user-manage/dto/create-user-manage.dto';
import { UpdateUserManageDto } from '../../../user-manage/dto/update-user-manage.dto';
export interface IUserManageRepository {
  create(createUserManageDto: CreateUserManageDto): Promise<UserManage>;
  findAll(): Promise<UserManage[]>;
  findAllWithFilters(filters: {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: UserManage[]; total: number; page: number; limit: number }>;
  findOne(id: string): Promise<UserManage | null>;
  findByPhone(phone: string): Promise<UserManage | null>;
  update(id: string, updateUserManageDto: UpdateUserManageDto): Promise<UserManage | null>;
  remove(id: string): Promise<void>;
}
