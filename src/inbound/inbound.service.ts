import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Inbound } from '../core/domain/entities/inbound.entity';
import { InboundRepository } from './repositories/inbound.repository';
import { InboundDoRepository } from './repositories/inbound-do.repository';
import { InboundItemRepository } from './repositories/inbound-item.repository';
import { CreateInboundDto } from './dto/create-inbound.dto';
import { UpdateInboundDto, UpdateInboundStatusDto } from './dto/update-inbound.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { InboundPaginationQueryDto } from './dto/inbound-pagination.dto';
import { PaginationService } from '../core/services/pagination.service';
import { BulkUpdateSaldoInspectionDto } from './dto/bulk-update-saldo-inspection.dto';
import { InboundItem, InspectionStatus } from '../core/domain/entities/inbound-item.entity';
import { IntegrationStatus } from 'src/core/domain/entities/inbound-do.entity';
import { InboundStatus } from 'src/core/domain/entities/inbound.entity';
import { PalletTransactionHistory, StatusInventory } from 'src/core/domain/entities/transaction-pallet-history.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class InboundService {
  constructor(
    private readonly inboundRepo: InboundRepository,
    private readonly inboundDoRepo: InboundDoRepository,
    private readonly inboundItemRepo: InboundItemRepository,
    private readonly dataSource: DataSource,
    private readonly paginationService: PaginationService,
    @InjectRepository(PalletTransactionHistory)
    private readonly palletTransactionHistoryRepository: Repository<PalletTransactionHistory>,
  ) { }

  private async generateSequentialInboundNumber(now: Date): Promise<string> {
    return await this.inboundRepo.getNextInboundNumberForDate(now);
  }

  /**
   * Validates the inbound creation payload
   */
  private async validateInboundCreation(payload: CreateInboundDto): Promise<void> {
    // Validate required fields based on business rules
    if (!payload.expedition && !payload.origin) {
      throw new BadRequestException('Either expedition or origin must be provided');
    }

    // Validate license plate format if provided
    if (payload.license_plate) {
      const licensePlateRegex = /^[A-Z0-9\s]+$/;
      if (!licensePlateRegex.test(payload.license_plate)) {
        throw new BadRequestException(
          'License plate must contain only uppercase letters, numbers, and spaces',
        );
      }
    }

    // Validate phone number format if provided
    if (payload.driver_phone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(payload.driver_phone)) {
        throw new BadRequestException('Driver phone must be a valid international phone number');
      }
    }

    // Validate arrival date is not in the future
    if (payload.arrival_date) {
      const arrivalDate = new Date(payload.arrival_date);
      const now = new Date();
      if (arrivalDate > now) {
        throw new BadRequestException('Arrival date cannot be in the future');
      }
    }

    // Validate inbound_dos if provided
    if (payload.inbound_dos && payload.inbound_dos.length > 0) {
      await this.validateInboundDos(payload.inbound_dos);
    }
  }

  /**
   * Validates inbound delivery orders
   */
  private async validateInboundDos(inboundDos: any[]): Promise<void> {
    if (!Array.isArray(inboundDos)) {
      throw new BadRequestException('inbound_dos must be an array');
    }

    if (inboundDos.length === 0) {
      throw new BadRequestException('inbound_dos cannot be empty if provided');
    }

    // Check for duplicate DO numbers
    const doNumbers = inboundDos.map((doItem) => doItem.inbound_do_number).filter(Boolean);
    const uniqueDoNumbers = new Set(doNumbers);
    if (doNumbers.length !== uniqueDoNumbers.size) {
      throw new BadRequestException('Duplicate inbound_do_number found in inbound_dos');
    }

    // Validate each DO
    for (let i = 0; i < inboundDos.length; i++) {
      const doDto = inboundDos[i];
      await this.validateInboundDo(doDto, i);
    }
  }

  /**
   * Validates a single inbound delivery order
   */
  private async validateInboundDo(doDto: any, index: number): Promise<void> {
    const prefix = `inbound_dos[${index}]`;

    // Validate DO number format
    if (doDto.inbound_do_number) {
      if (doDto.inbound_do_number.length < 1 || doDto.inbound_do_number.length > 50) {
        throw new BadRequestException(
          `${prefix}.inbound_do_number must be between 1 and 50 characters`,
        );
      }
    }

    // Validate PO number format
    if (doDto.inbound_po_number) {
      if (doDto.inbound_po_number.length < 1 || doDto.inbound_po_number.length > 50) {
        throw new BadRequestException(
          `${prefix}.inbound_po_number must be between 1 and 50 characters`,
        );
      }
    }

    // Validate date formats
    if (doDto.inbound_do_date) {
      const doDate = new Date(doDto.inbound_do_date);
      if (isNaN(doDate.getTime())) {
        throw new BadRequestException(`${prefix}.inbound_do_date must be a valid date`);
      }
    }

    if (doDto.inbound_po_date) {
      const poDate = new Date(doDto.inbound_po_date);
      if (isNaN(poDate.getTime())) {
        throw new BadRequestException(`${prefix}.inbound_po_date must be a valid date`);
      }
    }

    // Validate attachment URL format
    if (doDto.attachment) {
      try {
        new URL(doDto.attachment);
      } catch {
        throw new BadRequestException(`${prefix}.attachment must be a valid URL`);
      }
    }

    // Validate inbound_items if provided
    if (doDto.inbound_items && doDto.inbound_items.length > 0) {
      await this.validateInboundItems(doDto.inbound_items, index);
    }
  }

  /**
   * Validates inbound items
   */
  private async validateInboundItems(inboundItems: any[], doIndex: number): Promise<void> {
    if (!Array.isArray(inboundItems)) {
      throw new BadRequestException(`inbound_dos[${doIndex}].inbound_items must be an array`);
    }

    if (inboundItems.length === 0) {
      throw new BadRequestException(
        `inbound_dos[${doIndex}].inbound_items cannot be empty if provided`,
      );
    }

    // Check for duplicate item_id + uom combinations within the same DO
    // Same item with different UOMs is allowed, but same item with same UOM is not
    const itemUomCombinations = inboundItems.map(
      (item) => `${item.item_id}|${item.uom || 'default'}`,
    );
    const uniqueCombinations = new Set(itemUomCombinations);
    if (itemUomCombinations.length !== uniqueCombinations.size) {
      throw new BadRequestException(
        `Duplicate item_id + uom combination found in inbound_dos[${doIndex}].inbound_items. Same item with same UOM is not allowed`,
      );
    }

    // Validate each item
    for (let i = 0; i < inboundItems.length; i++) {
      const itemDto = inboundItems[i];
      await this.validateInboundItem(itemDto, doIndex, i);
    }
  }

  /**
   * Validates a single inbound item
   */
  private async validateInboundItem(
    itemDto: any,
    doIndex: number,
    itemIndex: number,
  ): Promise<void> {
    const prefix = `inbound_dos[${doIndex}].inbound_items[${itemIndex}]`;

    // Validate required fields
    if (!itemDto.item_id) {
      throw new BadRequestException(`${prefix}.item_id is required`);
    }

    if (!itemDto.quantity) {
      throw new BadRequestException(`${prefix}.quantity is required`);
    }

    // Validate item_id format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(itemDto.item_id)) {
      throw new BadRequestException(`${prefix}.item_id must be a valid UUID`);
    }

    // Validate quantity
    if (typeof itemDto.quantity !== 'number' || itemDto.quantity <= 0) {
      throw new BadRequestException(`${prefix}.quantity must be a positive number`);
    }

    // Validate classification_id if provided
    if (itemDto.classification_id && !uuidRegex.test(itemDto.classification_id)) {
      throw new BadRequestException(`${prefix}.classification_id must be a valid UUID`);
    }

    // Validate UOM if provided
    if (itemDto.uom) {
      if (typeof itemDto.uom !== 'string' || itemDto.uom.length < 1 || itemDto.uom.length > 10) {
        throw new BadRequestException(`${prefix}.uom must be between 1 and 10 characters`);
      }
    }
  }

  /**
   * Validates the inbound update payload
   */
  private async validateInboundUpdate(payload: UpdateInboundDto): Promise<void> {
    // Validate required fields based on business rules
    if (payload.expedition === undefined && payload.origin === undefined) {
      // Allow update if at least one is provided or both are provided
    } else if (payload.expedition === '' && payload.origin === '') {
      throw new BadRequestException('Either expedition or origin must be provided');
    }

    // Validate license plate format if provided
    if (payload.license_plate !== undefined) {
      if (payload.license_plate && payload.license_plate.trim() !== '') {
        const licensePlateRegex = /^[A-Z0-9\s]+$/;
        if (!licensePlateRegex.test(payload.license_plate)) {
          throw new BadRequestException(
            'License plate must contain only uppercase letters, numbers, and spaces',
          );
        }
      }
    }

    // Validate phone number format if provided
    if (payload.driver_phone !== undefined) {
      if (payload.driver_phone && payload.driver_phone.trim() !== '') {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(payload.driver_phone)) {
          throw new BadRequestException('Driver phone must be a valid international phone number');
        }
      }
    }

    // Validate arrival date is not in the future
    if (payload.arrival_date) {
      const arrivalDate = new Date(payload.arrival_date);
      const now = new Date();
      if (arrivalDate > now) {
        throw new BadRequestException('Arrival date cannot be in the future');
      }
    }

    // Validate inbound_dos if provided
    if (payload.inbound_dos && payload.inbound_dos.length > 0) {
      await this.validateInboundDos(payload.inbound_dos);
    }
  }

  async create(payload: CreateInboundDto): Promise<Inbound> {
    try {
      // Validate the payload before processing
      await this.validateInboundCreation(payload);

      return await this.dataSource.transaction(async () => {
        const inbound_number = await this.generateSequentialInboundNumber(new Date());

        // Create the inbound record
        const inbound = await this.inboundRepo.create({
          inbound_id_reference: payload.inbound_id_reference,
          inbound_number,
          expedition: payload.expedition,
          origin: payload.origin,
          license_plate: payload.license_plate,
          driver_name: payload.driver_name,
          driver_phone: payload.driver_phone,
          status: (payload.status as InboundStatus) || InboundStatus.CREATED,
          inbound_type: payload.inbound_type,
          arrival_date: payload.arrival_date ? new Date(payload.arrival_date) : undefined,
        });

        // Create inbound DOs and items if provided
        if (payload.inbound_dos?.length) {
          for (const doDto of payload.inbound_dos) {
            const inboundDo = await this.inboundDoRepo.create({
              inbound_id: inbound.id,
              principal: doDto.principal,
              inbound_do_number: doDto.inbound_do_number,
              inbound_do_date: doDto.inbound_do_date ? new Date(doDto.inbound_do_date) : undefined,
              attachment: doDto.attachment,
              inbound_po_number: doDto.inbound_po_number,
              inbound_po_date: doDto.inbound_po_date ? new Date(doDto.inbound_po_date) : undefined,
              flag_validated: doDto.flag_validated ?? false,
              validation_surat_jalan: doDto.validation_surat_jalan ?? false,
            });

            if (doDto.inbound_items?.length) {
              for (const itemDto of doDto.inbound_items) {
                await this.inboundItemRepo.create({
                  inbound_id: inbound.id,
                  inbound_do_id: inboundDo.id,
                  item_id: itemDto.item_id,
                  quantity: itemDto.quantity,
                  classification_id: itemDto.classification_id,
                  uom: itemDto.uom,
                });
              }
            }
          }
        }

        // Reload the created inbound with all relations
        const created = await this.inboundRepo.findOne(inbound.id);
        if (!created) {
          throw new NotFoundException('Failed to reload created inbound');
        }
        return created;
      });
    } catch (error) {
      // Re-throw validation errors as-is
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      // Wrap other errors with more context
      throw new BadRequestException(`Failed to create inbound: ${error.message}`);
    }
  }

  /**
   * Enriches inbounds with inbound_reference_number from the referenced inbound (when inbound_id_reference is set).
   */
  private async enrichWithReferenceNumber(
    inbounds: Inbound[],
  ): Promise<(Inbound & { inbound_reference_number?: string | null })[]> {
    const refIds = inbounds
      .map((i) => i.inbound_id_reference)
      .filter((id): id is string => Boolean(id));
    if (refIds.length === 0) {
      return inbounds.map((i) => ({ ...i, inbound_reference_number: undefined }));
    }
    const refMap = await this.inboundRepo.findInboundNumbersByIds(refIds);
    return inbounds.map((i) => ({
      ...i,
      inbound_reference_number: i.inbound_id_reference
        ? refMap.get(i.inbound_id_reference) ?? null
        : undefined,
    }));
  }

  async findAll(organizationId: string | number | null, status?: string): Promise<(Inbound & { inbound_reference_number?: string | null })[]> {
    const data = await this.inboundRepo.findAll(organizationId, status);
    return this.enrichWithReferenceNumber(data);
  }

  async findAllPaginated(
    paginationQuery: InboundPaginationQueryDto,
    organizationId: string | number | null,
  ): Promise<PaginatedResponseDto<Inbound & { inbound_reference_number?: string | null }>> {
    const filters = {
      status: paginationQuery.status,
      start_date: paginationQuery.start_date,
      end_date: paginationQuery.end_date,
      organization_id: organizationId,
    };

    const { data, total } = await this.inboundRepo.findAllPaginated(
      filters,
      paginationQuery.page,
      paginationQuery.limit,
      paginationQuery.search,
      paginationQuery.sortBy,
      paginationQuery.sortOrder,
    );

    const enrichedData = await this.enrichWithReferenceNumber(data);

    const paginatedResponse = this.paginationService.createPaginatedResponse(
      enrichedData,
      paginationQuery,
      total,
    );

    return paginatedResponse;
  }

  async findOne(id: string): Promise<Inbound & { inbound_reference_number?: string | null }> {
    const found = await this.inboundRepo.findOne(id);
    if (!found) {
      throw new NotFoundException('Inbound not found');
    }
    const [enriched] = await this.enrichWithReferenceNumber([found]);
    return enriched;
  }

  async update(id: string, payload: UpdateInboundDto): Promise<Inbound> {
    try {
      const inbound = await this.findOne(id);

      if (!inbound) {
        throw new NotFoundException('Inbound not found');
      }

      // Validate status transition
      if (inbound.status === InboundStatus.UNLOADING) {
        throw new BadRequestException('Cannot update inbound that is already unloading');
      }

      if (inbound.status === InboundStatus.INTEGRATED) {
        throw new BadRequestException('Cannot update inbound that is already integrated');
      }

      // Validate the update payload
      await this.validateInboundUpdate(payload);

      await this.dataSource.transaction(async () => {
        await this.inboundRepo.update(id, {
          inbound_id_reference: payload.inbound_id_reference,
          expedition: payload.expedition,
          origin: payload.origin,
          license_plate: payload.license_plate,
          photo_license_plate: payload.photo_license_plate,
          photo_condition: payload.photo_condition,
          photo_seal: payload.photo_seal,
          driver_name: payload.driver_name,
          driver_phone: payload.driver_phone,
          status: payload.status as InboundStatus,
          inbound_type: payload.inbound_type,
          arrival_date: payload.arrival_date ? new Date(payload.arrival_date) : undefined,
        });

        if (payload.inbound_dos) {
          // Soft remove existing DOs and items
          await this.inboundItemRepo.softRemoveByInbound(id);
          await this.inboundDoRepo.softRemoveByInbound(id);

          // Create new DOs and items
          for (const doDto of payload.inbound_dos) {
            const inboundDo = await this.inboundDoRepo.create({
              inbound_id: id,
              principal: doDto.principal,
              inbound_do_number: doDto.inbound_do_number,
              inbound_do_date: doDto.inbound_do_date ? new Date(doDto.inbound_do_date) : undefined,
              attachment: doDto.attachment,
              inbound_po_number: doDto.inbound_po_number,
              inbound_po_date: doDto.inbound_po_date ? new Date(doDto.inbound_po_date) : undefined,
              flag_validated: doDto.flag_validated ?? false,
              validation_surat_jalan: doDto.validation_surat_jalan ?? false,
            });

            if (doDto.inbound_items?.length) {
              for (const itemDto of doDto.inbound_items) {
                await this.inboundItemRepo.create({
                  inbound_id: id,
                  inbound_do_id: inboundDo.id,
                  item_id: itemDto.item_id,
                  quantity: itemDto.quantity,
                  classification_id: itemDto.classification_id,
                  uom: itemDto.uom,
                });
              }
            }
          }
        }
      });

      const updated = await this.inboundRepo.findOne(id);
      if (!updated) {
        throw new NotFoundException('Inbound not found after update');
      }
      return updated;
    } catch (error) {
      // Re-throw validation errors as-is
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      // Wrap other errors with more context
      throw new BadRequestException(`Failed to update inbound: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.dataSource.transaction(async () => {
      await this.inboundItemRepo.softRemoveByInbound(id);
      await this.inboundDoRepo.softRemoveByInbound(id);
      await this.inboundRepo.remove(id);
    });
  }

  async updateStatus(id: string, payload: UpdateInboundStatusDto): Promise<Inbound> {
    await this.findOne(id);

    const updateData: Partial<Inbound> = {};
    if (payload.status !== undefined) {
      updateData.status = payload.status as InboundStatus;
    }
    if (payload.notes !== undefined) {
      updateData.notes = payload.notes;
    }

    await this.inboundRepo.update(id, updateData);
    return this.findOne(id);
  }

  async findByAssignedHelperId(id: string): Promise<Inbound[]> {
    return await this.inboundRepo.findByAssignedHelperId(id);
  }

  async findAllTransactionScanInbound(status: string): Promise<Inbound[]> {
    return await this.inboundRepo.findAllTransactionScanInbound(status);
  }

  async sequentialStatus(id: string): Promise<Inbound> {
    const inbound = await this.findOne(id);
    if (!inbound) {
      throw new NotFoundException('Inbound not found');
    }

    // Validate that inbound has DOs
    if (!inbound.inbound_dos || inbound.inbound_dos.length === 0) {
      throw new BadRequestException('Inbound has no delivery orders to process');
    }

    // Count statuses with proper validation
    const statusCounts = {
      ready: 0,
      success: 0,
      failed: 0,
      pending: 0,
      total: inbound.inbound_dos.length,
    };

    // Count each status type
    for (const inboundDo of inbound.inbound_dos) {
      switch (inboundDo.integration_status) {
        case IntegrationStatus.READY:
          statusCounts.ready++;
          break;
        case IntegrationStatus.SUCCESS:
          statusCounts.success++;
          break;
        case IntegrationStatus.FAILED:
          statusCounts.failed++;
          break;
        case IntegrationStatus.PENDING:
        default:
          statusCounts.pending++;
          break;
      }
    }

    // Determine overall inbound status based on DO statuses
    let newStatus: InboundStatus;
    let statusReason: string;

    if (statusCounts.failed > 0) {
      // If any DO failed, inbound is failed
      newStatus = InboundStatus.FAILED;
      statusReason = `${statusCounts.failed} delivery order(s) failed integration`;
    } else if (statusCounts.success === statusCounts.total) {
      // All DOs successfully integrated
      newStatus = InboundStatus.INTEGRATED;
      statusReason = 'All delivery orders successfully integrated';
    } else if (statusCounts.ready === statusCounts.total) {
      // All DOs ready for integration
      newStatus = InboundStatus.READY_INTEGRATION;
      statusReason = 'All delivery orders ready for integration';
    } else if (statusCounts.success > 0 && statusCounts.pending === 0) {
      // Some success, no pending - partial success
      newStatus = InboundStatus.INSPECTION;
      statusReason = `${statusCounts.success}/${statusCounts.total} delivery orders integrated`;
    } else {
      // Default to inspection for mixed or pending states
      newStatus = InboundStatus.INSPECTION;
      statusReason = `Processing ${statusCounts.pending} pending delivery order(s)`;
    }

    // Update inbound status with timestamp
    const updateData = {
      status: newStatus,
      updatedAt: new Date(),
    };

    await this.inboundRepo.update(id, updateData);

    // Log status change for audit
    console.log(`Inbound ${id} status updated to ${newStatus}: ${statusReason}`);
    console.log(
      `Status breakdown: Ready=${statusCounts.ready}, Success=${statusCounts.success}, Failed=${statusCounts.failed}, Pending=${statusCounts.pending}`,
    );

    // Return updated inbound
    return await this.findOne(id);
  }

  async bulkUpdateInboundItemSaldoInspection(
    payload: BulkUpdateSaldoInspectionDto,
  ): Promise<InboundItem[]> {
    const updates = payload.items.map((item) => ({
      id: item.id,
      quantity_inspection: item.quantity_inspection,
    }));

    const updateSaldo = await this.inboundItemRepo.bulkUpdateSaldoInspection(updates);
    // find all inbound item by inbound_do_id
    const inboundItems = await this.inboundItemRepo.findAllByInboundDo(payload.inbound_do_id);

    const shouldBeReady =
      inboundItems.length > 0 &&
      inboundItems.every(
        (item) => item.inspection_status === InspectionStatus.APPROVED,
      );

    const targetStatus = shouldBeReady ? IntegrationStatus.READY : IntegrationStatus.PENDING;

    await this.inboundDoRepo.update(payload.inbound_do_id, {
      integration_status: targetStatus,
    });

    return updateSaldo;
  }

  async integrationToOracle(id: string): Promise<Inbound> {
    const inbound = await this.findOne(id);
    if (!inbound) {
      throw new NotFoundException('Inbound not found');
    }

    // update pallet history status inventory to READY
    const palletHistories = await this.palletTransactionHistoryRepository.find({
      where: {
        inbound_id: id,
      },
    });

    if (palletHistories.length === 0) {
      throw new BadRequestException('Pallet history not found');
    }

    for (const palletHistory of palletHistories) {
      await this.palletTransactionHistoryRepository.update(palletHistory.id, {
        status_inventory: StatusInventory.READY,
      });
    }

    // update inbound status to READY_INTEGRATION
    await this.inboundRepo.update(id, {
      status: InboundStatus.INTEGRATED,
    });
    return inbound;
  }
}
