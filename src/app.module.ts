import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './infrastructure/guards/auth.guard';
import { RolePermissionModule } from './infrastructure/modules/role-permission.module';
import { MenuModule } from './infrastructure/modules/menu.module';
import { AuthModule } from './infrastructure/modules/auth.module';
import { MasterUomModule } from './master-uom/master-uom.module';
import { MasterPalletModule } from './master-pallet/master-pallet.module';
import { MasterIOModule } from './master-io/master-io.module';
import { MasterWarehouseModule } from './master-warehouse/master-warehouse.module';
import { MasterSupplierModule } from './master-supplier/master-supplier.module';
import { MasterItemModule } from './master-item/master-item.module';
import { MasterClassificationItemModule } from './master-classification-item/master-classification-item.module';
import { InboundPlanModule } from './inbound-plan/inbound-plan.module';
import { CheckerAssignModule } from './checker-assign/checker-assign.module';
import { UserModule } from './users/user.module';
import { MasterVehicleModule } from './master-vehicle/master-vehicle.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'wms_db'),
        entities: [join(__dirname, 'core', 'domain', 'entities', '*.entity.{ts,js}')],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    RolePermissionModule,
    MenuModule,
    MasterUomModule,
    MasterPalletModule,
    MasterIOModule,
    MasterWarehouseModule,  
    MasterSupplierModule,
    MasterItemModule,
    MasterClassificationItemModule,
    InboundPlanModule,
    CheckerAssignModule,
    UserModule,
    MasterVehicleModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
