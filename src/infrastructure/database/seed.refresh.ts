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

async function seedRefresh() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const roleRepo = AppDataSource.getRepository(Role);
  const menuRepo = AppDataSource.getRepository(Menu);
  const permissionRepo = AppDataSource.getRepository(Permission);

  console.log('🔄 Starting seed refresh...');

  try {
    // Clear existing data and reset ID sequences
    console.log('🗑️  Clearing existing data and resetting ID sequences...');

    // Use TRUNCATE CASCADE to clear all data and reset ID sequences
    await AppDataSource.query('TRUNCATE TABLE permissions CASCADE');
    console.log('✅ Permissions cleared and ID sequence reset');

    await AppDataSource.query('TRUNCATE TABLE users CASCADE');
    console.log('✅ Users cleared and ID sequence reset');

    await AppDataSource.query('TRUNCATE TABLE roles CASCADE');
    console.log('✅ Roles cleared and ID sequence reset');

    await AppDataSource.query('TRUNCATE TABLE menus CASCADE');
    console.log('✅ Menus cleared and ID sequence reset');

    console.log('🌱 Starting fresh seed...');

    // Create menus in proper order (parents first, then children)
    const createdMenus: Menu[] = [];
    const menuMap = new Map<string, Menu>();

    // Step 1: Create root level menus first
    const rootMenus = [
      { key: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: 'dashboard', order: 1 },
      { key: 'master', name: 'Master', path: '/master', icon: '', order: 0 },
      { key: 'inbound', name: 'Inbound', path: '/inbound', icon: 'FaWarehouse', order: 2 },
      { key: 'settings', name: 'Settings', path: '/settings', icon: 'FaCog', order: 1 },
      { key: 'inventory', name: 'Inventory', path: '/inventory', icon: 'FaBoxes', order: 4 },
      { key: 'outbound', name: 'Outbound', path: '/outbound', icon: 'FaShippingFast', order: 3 },
    ];

    for (const data of rootMenus) {
      const menu = menuRepo.create({
        name: data.name,
        path: data.path,
        icon: data.icon,
        parentId: null,
        order: data.order,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const savedMenu = await menuRepo.save(menu);
      createdMenus.push(savedMenu);
      menuMap.set(data.key, savedMenu);
    }

    // Step 2: Create Master sub-menus
    const masterSubMenus = [
      { key: 'pallet', name: 'Pallet', path: '/master_pallet', icon: 'FaWarehouse', order: 1 },
      { key: 'uom', name: 'UOM', path: '/master_uom', icon: 'FaWarehouse', order: 1 },
      { key: 'io', name: 'IO', path: '/master_io', icon: 'FaRegFileAlt', order: 3 },
      {
        key: 'warehouse',
        name: 'Warehouse',
        path: '/master_warehouse',
        icon: 'FaRegFileAlt',
        order: 4,
      },
      { key: 'zone', name: 'Zone', path: '/master_zone', icon: 'FaRegFileAlt', order: 5 },
      { key: 'bin', name: 'Bin', path: '/master_bin', icon: 'FaRegFileAlt', order: 6 },
      {
        key: 'classification',
        name: 'Classification',
        path: '/master_classification',
        icon: 'FaRegFileAlt',
        order: 7,
      },
      { key: 'item', name: 'Item', path: '/master_item', icon: 'FaRegFileAlt', order: 7 },
    ];

    for (const data of masterSubMenus) {
      const menu = menuRepo.create({
        name: data.name,
        path: data.path,
        icon: data.icon,
        parentId: menuMap.get('master')?.id,
        order: data.order,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const savedMenu = await menuRepo.save(menu);
      createdMenus.push(savedMenu);
      menuMap.set(data.key, savedMenu);
    }

    // Step 3: Create Settings sub-menus
    const settingsSubMenus = [
      { key: 'menu', name: 'Menu', path: '/master_menu', icon: 'menu', order: 1 },
      { key: 'role', name: 'Role', path: '/master_role', icon: 'role', order: 2 },
      { key: 'user', name: 'User', path: '/master_user', icon: 'user', order: 3 },
    ];

    for (const data of settingsSubMenus) {
      const menu = menuRepo.create({
        name: data.name,
        path: data.path,
        icon: data.icon,
        parentId: menuMap.get('settings')?.id,
        order: data.order,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const savedMenu = await menuRepo.save(menu);
      createdMenus.push(savedMenu);
      menuMap.set(data.key, savedMenu);
    }

    // Step 4: Create Inbound sub-menus
    const inboundSubMenus = [
      {
        key: 'inbound_planning',
        name: 'Inbound Good Receive',
        path: '/inbound_planning',
        icon: 'FaWarehouse',
        order: 1,
      },
      { key: 'putaway', name: 'Put Away', path: '/putaway', icon: 'FaPeopleCarry', order: 2 },
    ];

    for (const data of inboundSubMenus) {
      const menu = menuRepo.create({
        name: data.name,
        path: data.path,
        icon: data.icon,
        parentId: menuMap.get('inbound')?.id,
        order: data.order,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const savedMenu = await menuRepo.save(menu);
      createdMenus.push(savedMenu);
      menuMap.set(data.key, savedMenu);
    }

    // Step 5: Create Outbound sub-menus
    const outboundSubMenus = [
      { key: 'memo', name: 'Memo', path: '/memo', icon: 'FaTruckMoving', order: 1 },
    ];

    for (const data of outboundSubMenus) {
      const menu = menuRepo.create({
        name: data.name,
        path: data.path,
        icon: data.icon,
        parentId: menuMap.get('outbound')?.id,
        order: data.order,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const savedMenu = await menuRepo.save(menu);
      createdMenus.push(savedMenu);
      menuMap.set(data.key, savedMenu);
    }
    console.log('✅ Menus created');

    // Create roles
    const roles = [
      { name: 'HELPER', description: 'HELPER' },
      { name: 'superadmin', description: 'superadmin' },
      { name: 'DRIVER FORKLIFT', description: 'DRIVER FORKLIFT' },
      { name: 'TRANSPORT STAFF', description: 'TRANSPORT STAFF' },
      { name: 'TRANSPORT SUPERVISOR', description: 'TRANSPORT SUPERVISOR' },
      { name: 'SUPERVISOR', description: 'SUPERVISOR' },
      { name: 'WH STAFF', description: 'WH STAFF' },
      { name: 'WH ADMIN', description: 'WH ADMIN' },
    ];

    const createdRoles: Role[] = [];
    for (const roleData of roles) {
      const role = roleRepo.create({
        name: roleData.name,
        description: roleData.description,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const savedRole = await roleRepo.save(role);
      createdRoles.push(savedRole);
    }
    console.log('✅ Roles created');

    // Get the superadmin role for the user
    const role = createdRoles.find((r) => r.name === 'superadmin');
    if (!role) {
      throw new Error('Superadmin role not found');
    }

    // Create permissions for all menus for superadmin role
    for (const menuItem of createdMenus) {
      const permission = permissionRepo.create({
        action: 'MANAGE',
        menu: menuItem,
        menuId: menuItem.id,
        role: role,
        roleId: role.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await permissionRepo.save(permission);
    }
    console.log('✅ Permissions created');

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
    console.log('✅ Superadmin user created');

    console.log('🎉 Seed refresh completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${createdMenus.length} menus created`);
    console.log(`   - ${createdRoles.length} roles created`);
    console.log(`   - ${createdMenus.length} permissions created`);
    console.log('   - 1 superadmin user created');
  } catch (error) {
    console.error('❌ Seed refresh failed:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

seedRefresh().catch((e) => {
  console.error(e);
  process.exit(1);
});
