import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterPalletRepository } from './master-pallet.repository';
import { CreateMasterPalletDto } from './dto/create-master-pallet.dto';
import { UpdateMasterPalletDto } from './dto/update-master-pallet.dto';
import { UpdatePalletQuantityDto, PalletQuantityHistoryResponseDto, PalletCapacityValidationDto, PalletItemQuantityDto } from './dto/pallet-quantity.dto';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';
import { PalletTransactionHistory, QuantityOperationType } from '../core/domain/entities/transaction-pallet-history.entity';
import { BarcodeService } from 'src/infrastructure/services/barcode.service';

@Injectable()
export class MasterPalletService {
  constructor(
    private readonly repository: MasterPalletRepository,
    private readonly barcodeService: BarcodeService,
    @InjectRepository(PalletTransactionHistory)
    private readonly transactionHistoryRepository: Repository<PalletTransactionHistory>,
  ) {}

  async create(
    createMasterPalletDto: CreateMasterPalletDto,
  ): Promise<MasterPallet> {
    const existingPallet = await this.repository.findByPalletCode(
      createMasterPalletDto.pallet_code,
    );
    if (existingPallet) {
      throw new ConflictException(
        `Pallet with pallet code ${createMasterPalletDto.pallet_code} already exists`,
      );
    }

    const barcodeImageUrl = await this.barcodeService.generateAndStoreBarcode({
      bcid: 'qrcode',
      text: `${createMasterPalletDto.pallet_code}`,
      scale: 3,
      height: 250,
      width: 250,
      bucket: 'wms',
      prefix: 'pallet',
      extension: 'png',
      acl: 'public-read',
      metadata: {
        pallet_code: createMasterPalletDto.pallet_code,
        pallet_capacity: createMasterPalletDto.capacity?.toString() || '0',
      } as Record<string, string>,
    });

    const pallet = await this.repository.create({
      ...createMasterPalletDto,
      qr_image_url: barcodeImageUrl.url,
    });

    return pallet;
  }

  async findAll(): Promise<MasterPallet[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<MasterPallet> {
    const pallet = await this.repository.findOne(id);
    if (!pallet) {
      throw new NotFoundException(`Pallet with ID ${id} not found`);
    }
    return pallet;
  }

  async findByPalletCode(palletCode: string): Promise<MasterPallet> {
    const pallet = await this.repository.findByPalletCode(palletCode);
    if (!pallet) {
      throw new NotFoundException(`Pallet with code ${palletCode} not found`);
    }
    return pallet;
  }

  async update(
    id: string,
    updateMasterPalletDto: UpdateMasterPalletDto,
  ): Promise<MasterPallet> {
    const pallet = await this.findOne(id);
    if (!pallet) {
      throw new NotFoundException('Pallet not found');
    }
    if (
      updateMasterPalletDto.pallet_code &&
      updateMasterPalletDto.pallet_code !== pallet.pallet_code
    ) {
      const existingPallet = await this.repository.findByPalletCode(
        updateMasterPalletDto.pallet_code,
      );
      if (existingPallet) {
        throw new ConflictException(
          `Pallet with pallet code ${updateMasterPalletDto.pallet_code} already exists`,
        );
      }
    }
    if (
      (updateMasterPalletDto.capacity &&
        updateMasterPalletDto.capacity !== pallet.capacity) ||
      (updateMasterPalletDto.pallet_code &&
        updateMasterPalletDto.pallet_code !== pallet.pallet_code)
    ) {
      await this.barcodeService.deleteBarcodeImage(pallet.qr_image_url);
      const barcodeImageUrl = await this.barcodeService.generateAndStoreBarcode(
        {
          bcid: 'qrcode',
          text: `${updateMasterPalletDto.pallet_code}`,
          scale: 3,
          height: 250,
          width: 250,
          bucket: 'wms',
          prefix: 'pallet',
          extension: 'png',
          acl: 'public-read',
          metadata: {
            pallet_code: updateMasterPalletDto.pallet_code,
            pallet_capacity: updateMasterPalletDto.capacity?.toString() || '0',
          } as Record<string, string>,
        },
      );
      updateMasterPalletDto.qr_image_url = barcodeImageUrl.url;
    }
    const updatedPallet = await this.repository.update(
      id,
      updateMasterPalletDto,
    );
    if (!updatedPallet) {
      throw new NotFoundException(`Pallet with ID ${id} not found`);
    }
    return updatedPallet;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }

  async updateQuantity(
    palletId: string,
    updateQuantityDto: UpdatePalletQuantityDto,
  ): Promise<MasterPallet> {
    const pallet = await this.findOne(palletId);
    
    if (!pallet.capacity || pallet.capacity <= 0) {
      throw new BadRequestException('Pallet capacity must be set and greater than 0');
    }

    const currentItemQuantity = await this.getItemQuantityOnPallet(palletId, updateQuantityDto.item_id);
    const totalPalletQuantity = await this.getTotalPalletQuantity(palletId);

    if (updateQuantityDto.operation_type === QuantityOperationType.ADD) {
      if (updateQuantityDto.quantity < 0) {
        throw new BadRequestException('Quantity to add must be non-negative');
      }
    }
    if (updateQuantityDto.operation_type === QuantityOperationType.REMOVE) {
      if (updateQuantityDto.quantity < 0) {
        throw new BadRequestException('Quantity to remove must be non-negative');
      }
      if (updateQuantityDto.quantity > currentItemQuantity) {
        throw new BadRequestException(
          `Cannot remove ${updateQuantityDto.quantity}. Current item quantity on pallet is ${currentItemQuantity}`,
        );
      }
    }
    if (updateQuantityDto.operation_type === QuantityOperationType.ADJUST) {
      if (updateQuantityDto.quantity < 0) {
        throw new BadRequestException('Adjusted item quantity cannot be negative');
      }
      const projectedTotal = totalPalletQuantity - currentItemQuantity + updateQuantityDto.quantity;
      if (projectedTotal > pallet.capacity) {
        throw new BadRequestException(
          `Adjusted total quantity ${projectedTotal} exceeds pallet capacity ${pallet.capacity}`,
        );
      }
    }
    let newItemQuantity: number;
    let quantityChange: number;

    switch (updateQuantityDto.operation_type) {
      case QuantityOperationType.ADD:
        newItemQuantity = currentItemQuantity + updateQuantityDto.quantity;
        quantityChange = updateQuantityDto.quantity;
        break;
      case QuantityOperationType.REMOVE:
        newItemQuantity = Math.max(0, currentItemQuantity - updateQuantityDto.quantity);
        quantityChange = -updateQuantityDto.quantity;
        break;
      case QuantityOperationType.ADJUST:
        newItemQuantity = updateQuantityDto.quantity;
        quantityChange = newItemQuantity - currentItemQuantity;
        break;
      case QuantityOperationType.RESET:
        newItemQuantity = 0;
        quantityChange = -currentItemQuantity;
        break;
      default:
        throw new BadRequestException('Invalid operation type');
    }

    if (newItemQuantity < 0) {
      throw new BadRequestException('Item quantity cannot be negative');
    }

    const newTotalQuantity = totalPalletQuantity - currentItemQuantity + newItemQuantity;

    if (newTotalQuantity > pallet.capacity) {
      throw new BadRequestException(
        `Total pallet quantity ${newTotalQuantity} exceeds pallet capacity ${pallet.capacity}`,
      );
    }

    const updatedPallet = await this.repository.update(palletId, {
      currentQuantity: newTotalQuantity,
      isFull: newTotalQuantity >= pallet.capacity,
    });

    if (!updatedPallet) {
      throw new NotFoundException(`Pallet with ID ${palletId} not found`);
    }

    await this.createQuantityHistory({
      pallet_id: palletId,
      item_id: updateQuantityDto.item_id,
      previous_quantity: currentItemQuantity,
      quantity_change: quantityChange,
      new_quantity: newItemQuantity,
      operation_type: updateQuantityDto.operation_type,
      reference_id: updateQuantityDto.reference_id,
      reference_type: updateQuantityDto.reference_type,
      notes: updateQuantityDto.notes,
      user_id: updateQuantityDto.user_id,
      uom: updateQuantityDto.uom,
    });

    return updatedPallet;
  }

  async updateQuantityByPalletCode(
    palletCode: string,
    updateQuantityDto: UpdatePalletQuantityDto,
  ): Promise<MasterPallet> {
    const pallet = await this.repository.findByPalletCode(palletCode);
    if (!pallet) {
      throw new NotFoundException(`Pallet with code ${palletCode} not found`);
    }

    return this.updateQuantity(pallet.id, updateQuantityDto);
  }

  async getQuantityHistory(palletId: string): Promise<PalletQuantityHistoryResponseDto[]> {
    await this.findOne(palletId);
    
    const history = await this.transactionHistoryRepository.find({
      where: { pallet_id: palletId },
      order: { createdAt: 'DESC' },
    });

    return history.map(record => ({
      id: record.id,
      pallet_id: record.pallet_id,
      item_id: record.item_id,
      previous_quantity: record.previous_quantity,
      quantity_change: record.quantity_change,
      new_quantity: record.new_quantity,
      operation_type: record.operation_type,
      reference_id: record.reference_id,
      reference_type: record.reference_type,
      notes: record.notes,
      user_id: record.user_id,
      uom: record.uom,
      createdAt: record.createdAt,
    }));
  }

  async getItemQuantityHistory(palletId: string, itemId: string): Promise<PalletQuantityHistoryResponseDto[]> {
    await this.findOne(palletId);
    
    const history = await this.transactionHistoryRepository.find({
      where: { 
        pallet_id: palletId,
        item_id: itemId 
      },
      order: { createdAt: 'DESC' },
    });

    return history.map(record => ({
      id: record.id,
      pallet_id: record.pallet_id,
      item_id: record.item_id,
      previous_quantity: record.previous_quantity,
      quantity_change: record.quantity_change,
      new_quantity: record.new_quantity,
      operation_type: record.operation_type,
      reference_id: record.reference_id,
      reference_type: record.reference_type,
      notes: record.notes,
      user_id: record.user_id,
      uom: record.uom,
      createdAt: record.createdAt,
    }));
  }

  async getPalletItemQuantities(palletId: string): Promise<PalletItemQuantityDto[]> {
    await this.findOne(palletId);
    
    const itemQuantities = await this.transactionHistoryRepository
      .createQueryBuilder('history')
      .select('history.item_id', 'item_id')
      .addSelect('history.uom', 'uom')
      .addSelect('MAX(history.new_quantity)', 'current_quantity')
      .addSelect('MAX(history.createdAt)', 'last_updated')
      .where('history.pallet_id = :palletId', { palletId })
      .groupBy('history.item_id, history.uom')
      .having('MAX(history.new_quantity) > 0')
      .getRawMany();

    return itemQuantities.map(item => ({
      item_id: item.item_id,
      current_quantity: parseInt(item.current_quantity),
      uom: item.uom,
      last_updated: item.last_updated,
    }));
  }

  async getQuantityHistoryByPalletCode(palletCode: string): Promise<PalletQuantityHistoryResponseDto[]> {
    const pallet = await this.repository.findByPalletCode(palletCode);
    if (!pallet) {
      throw new NotFoundException(`Pallet with code ${palletCode} not found`);
    }

    return this.getQuantityHistory(pallet.id);
  }

  async getItemQuantityHistoryByPalletCode(
    palletCode: string, 
    itemId: string
  ): Promise<PalletQuantityHistoryResponseDto[]> {
    const pallet = await this.repository.findByPalletCode(palletCode);
    if (!pallet) {
      throw new NotFoundException(`Pallet with code ${palletCode} not found`);
    }

    return this.getItemQuantityHistory(pallet.id, itemId);
  }

  async getPalletItemQuantitiesByPalletCode(palletCode: string): Promise<PalletItemQuantityDto[]> {
    const pallet = await this.repository.findByPalletCode(palletCode);
    if (!pallet) {
      throw new NotFoundException(`Pallet with code ${palletCode} not found`);
    }

    return this.getPalletItemQuantities(pallet.id);
  }

  async validateCapacityByPalletCode(palletCode: string): Promise<PalletCapacityValidationDto> {
    const pallet = await this.repository.findByPalletCode(palletCode);
    if (!pallet) {
      throw new NotFoundException(`Pallet with code ${palletCode} not found`);
    }

    return this.validateCapacity(pallet.id);
  }

  async checkCapacityForQuantityByPalletCode(palletCode: string, quantity: number): Promise<boolean> {
    const pallet = await this.repository.findByPalletCode(palletCode);
    if (!pallet) {
      throw new NotFoundException(`Pallet with code ${palletCode} not found`);
    }

    return this.checkCapacityForQuantity(pallet.id, quantity);
  }

  async validateCapacity(palletId: string): Promise<PalletCapacityValidationDto> {
    const pallet = await this.findOne(palletId);
    
    if (!pallet.capacity || pallet.capacity <= 0) {
      throw new BadRequestException('Pallet capacity must be set and greater than 0');
    }

    const availableCapacity = Math.max(0, pallet.capacity - pallet.currentQuantity);
    const utilizationPercentage = pallet.capacity > 0 ? (pallet.currentQuantity / pallet.capacity) * 100 : 0;

    return {
      capacity: pallet.capacity,
      current_quantity: pallet.currentQuantity,
      available_capacity: availableCapacity,
      has_capacity: availableCapacity > 0,
      utilization_percentage: Math.round(utilizationPercentage * 100) / 100,
    };
  }

  async checkCapacityForQuantity(palletId: string, quantity: number): Promise<boolean> {
    const capacityInfo = await this.validateCapacity(palletId);
    return capacityInfo.available_capacity >= quantity;
  }

  private async getItemQuantityOnPallet(palletId: string, itemId: string): Promise<number> {
    const latestRecord = await this.transactionHistoryRepository.findOne({
      where: { 
        pallet_id: palletId,
        item_id: itemId 
      },
      order: { createdAt: 'DESC' },
    });

    return latestRecord ? latestRecord.new_quantity : 0;
  }

  private async getTotalPalletQuantity(palletId: string): Promise<number> {
    const pallet = await this.findOne(palletId);
    return pallet.currentQuantity;
  }

  private async createQuantityHistory(data: {
    pallet_id: string;
    item_id: string;
    previous_quantity: number;
    quantity_change: number;
    new_quantity: number;
    operation_type: QuantityOperationType;
    reference_id?: string;
    reference_type?: string;
    notes?: string;
    user_id?: string;
    uom?: string;
  }): Promise<PalletTransactionHistory> {
    const history = this.transactionHistoryRepository.create(data);
    return await this.transactionHistoryRepository.save(history);
  }
}
