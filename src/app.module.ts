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
import { MasterWeekModule } from './master-week/master-week.module';
import { MasterClassificationItemModule } from './master-classification-item/master-classification-item.module';
import { UserModule } from './users/user.module';
import { MasterVehicleModule } from './master-vehicle/master-vehicle.module';
import { MasterWarehouseSubModule } from './master-warehouse-sub/master-warehouse-sub.module';
import { MasterWarehouseBinModule } from './master-warehouse-bin/master-warehouse-bin.module';
import { InboundModule } from './inbound/inbound.module';
import { AssignedHelperModule } from './assigned-helper/assigned-helper.module';
import { AssignedGateModule } from './assigned-gate/assigned-gate.module';
import { PaginationModule } from './core/modules/pagination.module';
import { TransactionScanInboundModule } from './transaction-scan-inbound/transaction-scan-inbound.module';
import { InventoryTrackingModule } from './inventory-tracking/inventory-tracking.module';
import { PutAwayModule } from './put-away/put-away.module';
import { OutboundMemoModule } from './outbound-memo/outbound-memo.module';
import { OutboundDoModule } from './outbound-do/outbound-do.module';
import { TransactionPickingModule } from './transaction-picking/transaction-picking.module';
import { AssignedPickingModule } from './assigned-picking/assigned-picking.module';
import { UserManageModule } from './user-manage/user-manage.module';
import { S3Module } from './infrastructure/modules/s3.module';
import { CustomerModule } from './customer/customer.module';
import { TransactionScanPickingModule } from './transaction-scan-picking/transaction-scan-picking.module';
import { PickingSuggestionModule } from './picking-suggestion/picking-suggestion.module';
import { NotificationModule } from './notification/notification.module';
import { InventoryMovementModule } from './inventory-movement/inventory-movement.module';
import { MoveOrderModule } from './move-order/move-order.module';
import { StockAdjustmentApprovalModule } from './stock-adjustment-approval/stock-adjustment-approval.module';
import { ApprovalSetupModule } from './approval-setup/approval-setup.module';
import { ApprovalModule } from './approval/approval.module';
import { UsersActivityModule } from './users-activity/users-activity.module';

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
        extra: {
          // PostgreSQL connection options for timezone handling
          timezone: 'UTC', // Ensure PostgreSQL connection uses UTC
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    RolePermissionModule,
    MenuModule,
    UserModule,
    UserManageModule,
    MasterVehicleModule,
    MasterUomModule,
    MasterPalletModule,
    MasterIOModule,
    MasterWarehouseModule,
    MasterWarehouseSubModule,
    MasterWarehouseBinModule,
    MasterSupplierModule,
    MasterItemModule,
    MasterWeekModule,
    MasterClassificationItemModule,
    InboundModule,
    AssignedHelperModule,
    AssignedGateModule,
    PaginationModule,
    TransactionScanInboundModule,
    PutAwayModule,
    InventoryTrackingModule,
    OutboundMemoModule,
    OutboundDoModule,
    TransactionPickingModule,
    AssignedPickingModule,
    S3Module,
    CustomerModule,
    TransactionScanPickingModule,
    PickingSuggestionModule,
    NotificationModule,
    InventoryMovementModule,
    MoveOrderModule,
    StockAdjustmentApprovalModule,
    ApprovalSetupModule,
    ApprovalModule,
    UsersActivityModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
