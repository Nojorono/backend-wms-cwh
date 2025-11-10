import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TransactionScanPickingRepository } from './transaction-scan-picking.repository';
import { CreateTransactionScanPickingDto } from './dto/create-transaction-scan-picking.dto';
import { UpdateTransactionScanPickingDto } from './dto/update-transaction-scan-picking.dto';
import { ScanPickingTransaction } from '../core/domain/entities/transaction-scan-picking.entity';
import { TransactionPickingService } from '../transaction-picking/transaction-picking.service';
import { MasterPalletService } from '../master-pallet/master-pallet.service';

@Injectable()
export class TransactionScanPickingService {
  constructor(
    private readonly repository: TransactionScanPickingRepository,
    private readonly transactionPickingService: TransactionPickingService,
    private readonly masterPalletService: MasterPalletService,
  ) {}

  async create(data: CreateTransactionScanPickingDto): Promise<ScanPickingTransaction> {
    await this.transactionPickingService.findOne(data.transaction_picking_id);
    await this.validateQuantities(data.quantity_picked, data.quantity_switch);
    await this.validatePallets([
      data.pallet_source_id,
      data.pallet_use_id,
      data.pallet_switch_id,
    ]);

    return this.repository.create(data);
  }

  async findAll(
    transaction_picking_id?: string,
    status?: string,
    pallet_id?: string,
  ): Promise<ScanPickingTransaction[]> {
    return this.repository.findAll({
      transactionPickingId: transaction_picking_id,
      status,
      palletId: pallet_id,
    });
  }

  async findOne(id: string): Promise<ScanPickingTransaction> {
    const entity = await this.repository.findOne(id);
    if (!entity) {
      throw new NotFoundException('Transaction scan picking tidak ditemukan');
    }
    return entity;
  }

  async findByTransactionPickingId(
    transactionPickingId: string,
  ): Promise<ScanPickingTransaction[]> {
    return this.repository.findAll({ transactionPickingId });
  }

  async update(
    id: string,
    data: UpdateTransactionScanPickingDto,
  ): Promise<ScanPickingTransaction> {
    const existing = await this.findOne(id);

    if (data.transaction_picking_id && data.transaction_picking_id !== existing.transaction_picking_id) {
      await this.transactionPickingService.findOne(data.transaction_picking_id);
    }

    if (
      data.quantity_picked !== undefined ||
      data.quantity_switch !== undefined
    ) {
      await this.validateQuantities(
        data.quantity_picked ?? existing.quantity_picked,
        data.quantity_switch ?? existing.quantity_switch,
      );
    }

    await this.validatePallets([
      data.pallet_source_id,
      data.pallet_use_id,
      data.pallet_switch_id,
    ]);

    return this.repository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }

  private async validatePallets(palletIds: Array<string | undefined>): Promise<void> {
    const uniqueIds = Array.from(new Set(palletIds.filter((id): id is string => Boolean(id))));
    await Promise.all(uniqueIds.map((id) => this.masterPalletService.findOne(id)));
  }

  private async validateQuantities(quantityPicked: number, quantitySwitch?: number): Promise<void> {
    if (quantityPicked === undefined || quantityPicked === null) {
      throw new BadRequestException('quantity_picked wajib diisi');
    }

    if (quantityPicked <= 0) {
      throw new BadRequestException('quantity_picked harus lebih dari 0');
    }

    if (quantitySwitch !== undefined && quantitySwitch < 0) {
      throw new BadRequestException('quantity_switch tidak boleh bernilai negatif');
    }
  }
}

