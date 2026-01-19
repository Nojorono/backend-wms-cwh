import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { User } from '../../core/domain/entities/user.entity';
import { Role } from '../../core/domain/entities/role.entity';
import { Permission } from '../../core/domain/entities/permission.entity';
import { Menu } from '../../core/domain/entities/menu.entity';
import * as bcrypt from 'bcrypt';

// Load .env file explicitly with path
const envPath = process.env.ENV_PATH || join(process.cwd(), '.env');
config({ path: envPath });

// Get database config from environment variables
const dbHost = process.env.DB_HOST;
const dbPort = parseInt(process.env.DB_PORT || '5432');
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbDatabase = process.env.DB_DATABASE;

// Check if connecting to AWS RDS (requires SSL)
const isAwsRds = dbHost?.includes('rds.amazonaws.com') || false;
const requiresSSL = isAwsRds || process.env.NODE_ENV === 'production';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: dbHost,
  port: dbPort,
  username: dbUsername,
  password: dbPassword,
  database: dbDatabase,
  entities: [User, Role, Permission, Menu],
  synchronize: false,
  ssl: requiresSSL ? {
    rejectUnauthorized: false,
  } : false,
  extra: {
    timezone: 'UTC',
  },
});

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const roleRepo = AppDataSource.getRepository(Role);
  const menuRepo = AppDataSource.getRepository(Menu);
  const permissionRepo = AppDataSource.getRepository(Permission);

  // Check if user already exists
  const existing = await userRepo.findOne({
    where: { username: 'superadmin' },
  });
  if (existing) {
    console.log('User superadmin already exists');
    await AppDataSource.destroy();
    return;
  }

  // Create menu
  const menu = menuRepo.create({
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
    parentId: null,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await menuRepo.save(menu);

  // Create role
  const role = roleRepo.create({
    name: 'superadmin',
    description: 'superadmin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await roleRepo.save(role);

  // Create permission
  const permission = permissionRepo.create({
    action: 'View',
    menu: menu,
    menuId: menu.id,
    role: role,
    roleId: role.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await permissionRepo.save(permission);

  // Hash password
  const hashed = await bcrypt.hash('admin123', 10);

  // Create user
  const user = userRepo.create({
    username: 'superadmin',
    password: hashed,
    role: role,
    roleId: role.id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await userRepo.save(user);

  console.log('Seed user superadmin created!');
  await AppDataSource.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
