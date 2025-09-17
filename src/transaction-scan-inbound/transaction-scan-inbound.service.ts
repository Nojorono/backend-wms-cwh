import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionScanInboundRepository } from './transaction-scan-inbound.repository';
import { CreateTransactionScanInboundDto } from './dto/create-transaction-scan-inbound.dto';
import { UpdateTransactionScanInboundDto } from './dto/update-transaction-scan-inbound.dto';
import { TransactionScanInbound } from '../core/domain/entities/transaction-scan-inbound.entity';
import { MasterPalletService } from 'src/master-pallet/master-pallet.service';
import { MasterItemService } from 'src/master-item/master-item.service';
import { MasterWarehouseSubService } from 'src/master-warehouse-sub/master-warehouse-sub.service';
import { QuantityOperationType } from 'src/core/domain/entities/transaction-pallet-history.entity';

@Injectable()
export class TransactionScanInboundService {
  constructor(
    private readonly repository: TransactionScanInboundRepository, 
    private readonly palletService: MasterPalletService,
    private readonly itemService: MasterItemService,
    private readonly warehouseSubService: MasterWarehouseSubService
  ) {}

  async create(data: CreateTransactionScanInboundDto): Promise<TransactionScanInbound> {
    const item = await this.itemService.findOne(data.item_id);
    if (!item) throw new BadRequestException('Item not found');

    const pallet = await this.palletService.findByPalletCode(data.pallet_code || '');
    if (!pallet) throw new NotFoundException('Pallet not found');

    if (data.m_warehouse_sub_id) {
      const warehouseSub = await this.warehouseSubService.findOne(data.m_warehouse_sub_id);
      if (!warehouseSub) throw new BadRequestException('Warehouse sub not found');
    }

    const scan = await this.repository.create({
      ...data,
      pallet_id: pallet.id,
    });
    await this.palletService.updateQuantityByPalletCode(pallet.pallet_code, {
      production_date: data.production_date,
      item_id: data.item_id,
      quantity: data.quantity,
      operation_type: QuantityOperationType.ADD,
      reference_id: data.inbound_id,
      reference_type: 'INBOUND_SCAN',
      notes: data.user_name,
      user_id: data.user_id,
      uom: data.uom,
      week_number: data.week_number,
    });
    return scan;
  }

  async findAll(inbound_id: string): Promise<TransactionScanInbound[]> {
    return this.repository.findAll(inbound_id);
  }

  async findOne(id: string): Promise<TransactionScanInbound> {
    const entity = await this.repository.findOne(id);
    if (!entity) throw new NotFoundException('Transaction scan inbound not found');
    return entity;
  }

  async findByInboundId(inbound_id: string): Promise<TransactionScanInbound[]> {
    return this.repository.findByInboundId(inbound_id);
  }

  async update(id: string, data: UpdateTransactionScanInboundDto): Promise<TransactionScanInbound> {
    const existing = await this.findOne(id);

    if (data.item_id) {
      const item = await this.itemService.findOne(data.item_id);
      if (!item) throw new BadRequestException('Item not found');
    }

    if (data.m_warehouse_sub_id) {
      const warehouseSub = await this.warehouseSubService.findOne(data.m_warehouse_sub_id);
      if (!warehouseSub) throw new BadRequestException('Warehouse sub not found');
    }

    const affectsPallet =
      typeof data.quantity === 'number' ||
      typeof data.item_id === 'string' ||
      typeof (data as any).pallet_code === 'string' ||
      typeof data.uom === 'string';

    let targetPalletId = existing.pallet_id;
    if ((data as any).pallet_code) {
      const targetPallet = await this.palletService.findByPalletCode((data as any).pallet_code || '');
      if (!targetPallet) throw new NotFoundException('Target pallet not found');
      targetPalletId = targetPallet.id;
    }

    if (affectsPallet) {
      await this.palletService.updateQuantity(existing.pallet_id, {
        item_id: existing.item_id,
        quantity: existing.quantity,
        production_date: existing.production_date,
        operation_type: QuantityOperationType.REMOVE,
        reference_id: existing.inbound_id,
        reference_type: 'INBOUND_SCAN_UPDATE',
        notes: 'revert previous',
        user_id: data.user_id || existing.user_id,
        uom: existing.uom,
        week_number: existing.week_number,
      });

      await this.palletService.updateQuantity(targetPalletId, {
        item_id: data.item_id ?? existing.item_id,
        quantity: typeof data.quantity === 'number' ? data.quantity : existing.quantity,
        production_date: data.production_date ?? existing.production_date,
        operation_type: QuantityOperationType.ADD,
        reference_id: existing.inbound_id,
        reference_type: 'INBOUND_SCAN_UPDATE',
        notes: data.user_name ?? existing.user_name,
        user_id: data.user_id ?? existing.user_id,
        uom: data.uom ?? existing.uom,
        week_number: data.week_number ?? existing.week_number,
      });
    }

    const payload: any = { ...data };
    if (targetPalletId && targetPalletId !== existing.pallet_id) {
      payload.pallet_id = targetPalletId;
    }

    return this.repository.update(id, payload);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}


