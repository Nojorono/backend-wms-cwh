import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
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
import {
  InboundMappingIntegrationService,
  InboundIntegrationToOracleResult,
} from './integration/inbound-mapping-integration.service';
import {
  InboundIntegrationService,
  InboundIntegrationHeaderWithLines,
} from 'src/inbound-integration/inbound-integration.service';
import { RcvReceiptTransactionType } from 'src/core/domain/entities/inbound-integration.entity';
import {
  CreateRcvReceiptDto,
  RcvReceiptIntegrationService,
  RcvReceiptResponseDto,
} from './integration/rcv-receipt.integration';
import { InboundIntegrationQueueProducer } from './integration/inbound-integration-queue.producer';

@Injectable()
export class InboundService {
  private readonly logger = new Logger(InboundService.name);

  constructor(
    private readonly inboundRepo: InboundRepository,
    private readonly inboundDoRepo: InboundDoRepository,
    private readonly inboundItemRepo: InboundItemRepository,
    private readonly dataSource: DataSource,
    private readonly paginationService: PaginationService,
    private readonly inboundMappingIntegrationService: InboundMappingIntegrationService,
    private readonly inboundIntegrationService: InboundIntegrationService,
    private readonly rcvReceiptIntegrationService: RcvReceiptIntegrationService,
    private readonly inboundIntegrationQueueProducer: InboundIntegrationQueueProducer,
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
          organization_id: payload.organization_id,
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
              add_to_receipt_number: doDto.add_to_receipt_number,
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

  async bulkUpdateInboundItemSaldoInspection(
    payload: BulkUpdateSaldoInspectionDto,
  ): Promise<InboundItem[]> {
    const updates = payload.items.map((item) => ({
      id: item.id,
      quantity_inspection: item.quantity_inspection,
      quantity_difference: item.quantity_difference ?? 0,
      sub_inventory_difference: item.sub_inventory_difference ?? null,
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

  /**
   * Like `findOne`, but `transaction_scan_inbounds` are nested under each `inbound_item` (matched by
   * `item_id`) and omitted from the inbound root. `quantity_inspection` is numeric in JSON.
   */
  async integrationToOracleV1(
    id: string,
  ): Promise<any> {
    const inbound = await this.findOne(id);
    if (!inbound) {
      throw new NotFoundException('Inbound not found');
    }

    // // update pallet history status inventory to READY
    // const palletHistories = await this.palletTransactionHistoryRepository.find({
    //   where: {
    //     inbound_id: id,
    //   },
    // });

    // if (palletHistories.length === 0) {
    //   throw new BadRequestException('Pallet history not found');
    // }

    // for (const palletHistory of palletHistories) {
    //   await this.palletTransactionHistoryRepository.update(palletHistory.id, {
    //     status_inventory: StatusInventory.READY,
    //   });
    // }

    // // update inbound status to READY_INTEGRATION
    // await this.inboundRepo.update(id, {
    //   status: InboundStatus.INTEGRATED,
    // });

    const dataIntegration = await this.inboundMappingIntegrationService.build(inbound);
    await this.createInboundIntegrationRecords(dataIntegration);
    const inbound_integrations = await this.inboundIntegrationService.findAllByInbound(id);
    const rcv_receipt_results = await this.createRcvReceiptsFromInboundIntegrations(inbound_integrations);
    // await this.inboundIntegrationService.updateStatusByInboundId(id, 'INTEGRATION');

    return rcv_receipt_results;
    // return { ...dataIntegration, rcv_receipt_results };
    // return inbound;
  }

  async integrationToOracle(
    id: string,
  ): Promise<any> {
    const inbound = await this.findOne(id);
    if (!inbound) {
      throw new NotFoundException('Inbound not found');
    }

    const dataIntegration = await this.inboundMappingIntegrationService.build(inbound);
    await this.createInboundIntegrationRecords(dataIntegration);
    const inbound_integrations = await this.inboundIntegrationService.findAllByInbound(id);
    const rcv_receipt_results =
      await this.createRcvReceiptsFromInboundIntegrations(inbound_integrations);
    const requestId = this.extractRequestIdFromRcvResults(rcv_receipt_results);

    // await this.inboundRepo.update(id, {
    //   status: InboundStatus.READY_INTEGRATION,
    //   notes: requestId
    //     ? `Oracle request submitted with request_id=${requestId}`
    //     : 'Oracle request submitted. Waiting for Oracle concurrent process',
    // });

    await this.inboundIntegrationQueueProducer.publish({
      inboundId: id,
      requestId: requestId ?? undefined,
      retryCount: 0,
      maxRetry: 20,
    });

    this.logger.log(
      `Queued inbound integration job inboundId=${id} requestId=${requestId ?? 'N/A'} retryCount=0`,
    );

    return {
      status: 'PROCESSING',
      inboundId: id,
      requestId: requestId ?? null,
    };
  }



  private async createInboundIntegrationRecords(
    inbound: InboundIntegrationToOracleResult,
  ): Promise<void> {
    type InboundItemWithWarehouse = InboundItem & {
      warehouse?: { name?: string; locator_id?: number | string | null };
      warehouse_diff?: { name?: string; locator_id?: number | string | null };
    };

    const toOptionalNumber = (value: unknown): number | undefined => {
      if (value == null || value === '') {
        return undefined;
      }
      const n = typeof value === 'string' ? Number(value) : Number(value);
      return Number.isNaN(n) ? undefined : n;
    };
    // const toCamelCaseWord = (value: string | null | undefined): string | undefined => {
    //   if (!value) {
    //     return undefined;
    //   }
    //   const normalized = value.trim().toLowerCase();
    //   if (!normalized) {
    //     return undefined;
    //   }
    //   return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    // };

    const isSoInternalOrSubdist = ['SO_INTERNAL', 'SO_SUBDIST'].includes(
      (inbound.inbound_type ?? '').toUpperCase(),
    );

    for (const inboundDo of inbound.inbound_dos ?? []) {
      const inboundItems = (inboundDo.inbound_items ?? []) as InboundItemWithWarehouse[];
      const lines = inboundItems.map((item) => ({
        source_line_id: item.id,
        source_header_id: inboundDo.id,
        po_number: inboundDo.inbound_po_number ?? undefined,
        po_line_number: toOptionalNumber(item.line_number),
        iso_number: isSoInternalOrSubdist ? inboundDo.inbound_do_number : undefined,
        iso_line_number: isSoInternalOrSubdist ? toOptionalNumber(item.line_number) : undefined,
        inventory_item_id: toOptionalNumber(item.item?.inventory_item_id),
        uom_code: item.uom,
        quantity: toOptionalNumber(item.quantity_inspection ?? item.quantity),
        /** Scan location; if no scans, falls back to difference warehouse (legacy single-warehouse lines). */
        subinventory: item.warehouse?.name ?? undefined,
        locator_id: toOptionalNumber(
          item.warehouse?.locator_id
        ),
        quantity_selisih: toOptionalNumber(item.quantity_difference),
        subinventory_selisih: item.warehouse_diff?.name ?? undefined,
        locator_id_selisih: toOptionalNumber(item.warehouse_diff?.locator_id),
      }));

      await this.inboundIntegrationService.createOrReplaceByInboundDo({
        organization_id: inbound.organization_id,
        inbound_id: inbound.id,
        inbound_do_id: inboundDo.id,
        source_system: 'WMS',
        transaction_type: isSoInternalOrSubdist ? RcvReceiptTransactionType.INBOUND_GS_MUTASI_SO_INTERNAL : RcvReceiptTransactionType.INBOUND_GS_PRINCIPAL,
        receipt_source_code: isSoInternalOrSubdist ? 'INTERNAL ORDER' : 'VENDOR',
        source_header_id: inboundDo.id,
        do_number: isSoInternalOrSubdist ? inboundDo.inbound_do_number : undefined,
        vendor_id: toOptionalNumber(inboundDo.vendor_id),
        vendor_site_id: toOptionalNumber(inboundDo.vendor_site_id),
        total_lines: toOptionalNumber(inboundDo.total_line_items) ?? lines.length,
        rsh_attribute1: inbound.license_plate ?? undefined,
        rsh_attribute2: inbound.driver_name ?? undefined,
        rsh_attribute3: inbound.expedition ?? undefined,
        status: 'CREATED',
        lines,
      });
    }
  }

  private async createRcvReceiptsFromInboundIntegrations(
    inboundIntegrations: InboundIntegrationHeaderWithLines[],
  ): Promise<RcvReceiptResponseDto[]> {
    const asNumberRequired = (value: unknown, field: string, ctx: string): number => {
      const n = typeof value === 'string' ? Number(value) : Number(value);
      if (value == null || Number.isNaN(n)) {
        throw new BadRequestException(`${ctx}: ${field} is required and must be a number`);
      }
      return n;
    };

    const asStringRequired = (value: unknown, field: string, ctx: string): string => {
      if (typeof value !== 'string' || value.trim() === '') {
        throw new BadRequestException(`${ctx}: ${field} is required and must be a string`);
      }
      return value;
    };

    const toOptionalNumber = (value: unknown): number | undefined => {
      if (value == null || value === '') {
        return undefined;
      }
      const n = typeof value === 'string' ? Number(value) : Number(value);
      return Number.isNaN(n) ? undefined : n;
    };

    const payloads: CreateRcvReceiptDto[] = [];
    for (const header of inboundIntegrations) {
      const ctx = `Inbound integration ${header.id}`;
      const payload: CreateRcvReceiptDto = {
        TRANSACTION_TYPE: header.transaction_type as RcvReceiptTransactionType,
        SOURCE_SYSTEM: asStringRequired(header.source_system, 'SOURCE_SYSTEM', ctx),
        RECEIPT_SOURCE_CODE: asStringRequired(
          header.receipt_source_code,
          'RECEIPT_SOURCE_CODE',
          ctx,
        ),
        SOURCE_HEADER_ID: asStringRequired(header.source_header_id, 'SOURCE_HEADER_ID', ctx),
        DO_NUMBER: header.do_number ?? undefined,
        VENDOR_ID:
          header.vendor_id != null ? asNumberRequired(header.vendor_id, 'VENDOR_ID', ctx) : undefined,
        VENDOR_SITE_ID:
          header.vendor_site_id != null
            ? asNumberRequired(header.vendor_site_id, 'VENDOR_SITE_ID', ctx)
            : undefined,
        RSH_ATTRIBUTE1: header.rsh_attribute1 ?? undefined,
        RSH_ATTRIBUTE2: header.rsh_attribute2 ?? undefined,
        RSH_ATTRIBUTE3: header.rsh_attribute3 ?? undefined,
        RECEIPT_NUMBER: header.receipt_number ?? undefined,
        TOTAL_LINES: asNumberRequired(header.total_lines, 'TOTAL_LINES', ctx),
        LINES: (header.lines ?? []).map((line) => ({
          SOURCE_LINE_ID: asStringRequired(line.source_line_id, 'SOURCE_LINE_ID', ctx),
          SOURCE_HEADER_ID: asStringRequired(line.source_header_id, 'SOURCE_HEADER_ID', ctx),
          PO_NUMBER: line.po_number ?? undefined,
          PO_LINE_NUMBER:
            line.po_line_number != null
              ? asNumberRequired(line.po_line_number, 'PO_LINE_NUMBER', ctx)
              : undefined,
          ISO_NUMBER: line.iso_number ?? undefined,
          ISO_LINE_NUMBER:
            line.iso_line_number != null
              ? asNumberRequired(line.iso_line_number, 'ISO_LINE_NUMBER', ctx)
              : undefined,
          INVENTORY_ITEM_ID: asNumberRequired(
            line.inventory_item_id,
            'INVENTORY_ITEM_ID',
            ctx,
          ),
          UOM_CODE: asStringRequired(line.uom_code, 'UOM_CODE', ctx),
          QUANTITY: asNumberRequired(line.quantity, 'QUANTITY', ctx),
          SUBINVENTORY: asStringRequired(line.subinventory, 'SUBINVENTORY', ctx),
          LOCATOR_ID: asNumberRequired(line.locator_id, 'LOCATOR_ID', ctx),
          QUANTITY_SELISIH: toOptionalNumber(line.quantity_selisih),
          SUBINVENTORY_SELISIH:
            line.subinventory_selisih != null && String(line.subinventory_selisih).trim() !== ''
              ? String(line.subinventory_selisih).trim()
              : undefined,
          LOCATOR_ID_SELISIH: toOptionalNumber(line.locator_id_selisih),
        })),
      };

      payloads.push(payload);
    }

    if (!payloads.length) {
      return [];
    }

    const response = await this.rcvReceiptIntegrationService.createRcvReceipt(
      payloads,
    );
    if (Array.isArray(response)) {
      return response as RcvReceiptResponseDto[];
    }
    const responseData = (response as Record<string, unknown>).data;
    if (Array.isArray(responseData)) {
      return responseData as RcvReceiptResponseDto[];
    }
    return [response];
  }

  private extractRequestIdFromRcvResults(
    responses: RcvReceiptResponseDto[],
  ): number | null {
    for (const row of responses) {
      const result = this.extractRequestIdFromUnknown(row);
      if (result != null) {
        return result;
      }
    }
    return null;
  }

  private extractRequestIdFromUnknown(value: unknown): number | null {
    if (value == null) {
      return null;
    }
    if (Array.isArray(value)) {
      for (const entry of value) {
        const nested = this.extractRequestIdFromUnknown(entry);
        if (nested != null) {
          return nested;
        }
      }
      return null;
    }
    if (typeof value !== 'object') {
      return null;
    }
    const obj = value as Record<string, unknown>;
    const candidates = [
      obj.request_id,
      obj.requestId,
      obj.REQUEST_ID,
      obj.REQUEST_ID_IR,
      obj.REQUEST_ID_IO,
      obj.REQUEST_ID_OI,
      obj.data,
    ];
    for (const candidate of candidates) {
      if (candidate == null) {
        continue;
      }
      if (typeof candidate === 'number') {
        return Number.isNaN(candidate) ? null : candidate;
      }
      if (typeof candidate === 'string') {
        const n = Number(candidate);
        if (!Number.isNaN(n)) {
          return n;
        }
      } else {
        const nested = this.extractRequestIdFromUnknown(candidate);
        if (nested != null) {
          return nested;
        }
      }
    }
    return null;
  }
}
