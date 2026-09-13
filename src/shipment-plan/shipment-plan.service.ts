import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { ShipmentPlanRepository } from './shipment-plan.repository';
import { ShipmentPlanItemRepository } from './shipment-plan-item.repository';
import { MasterWeek } from '../core/domain/entities/master-week.entity';
import { ShipmentPlanUploadResponseDto } from './dto/shipment-plan-upload-response.dto';
import { ShipmentPlan } from 'src/core/domain/entities/shipment-plan.entity';
import { OutboundMemoItem } from '../core/domain/entities/outbound-memo-item.entity';

export interface ShipmentPlanExcelFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

interface ShipmentPlanExtractedRow {
  source: string;
  type: string;
  reg: string;
  code: string;
  /** Name column from sheet (e.g. city / AMO label). */
  amo: string;
  /** Destination / SKU code from column header (e.g. MD10). */
  sku: string;
  metric: string;
  quantity: number;
}

interface ShipmentPlanHeaderPosition {
  rowIndex: number;
  sourceCol: number;
  typeCol: number;
  regCol: number;
  codeCol: number;
  nameCol: number;
}

interface ShipmentPlanColumnMapCandidate {
  map: Array<{ colIndex: number; destination: string; metric: string }>;
  score: number;
}

export interface ShipmentPlanDspSummary {
  source: string;
  type: string;
  reg: string;
  code: string;
  amo: string;
  totalDsp: number;
  totalMemo: number;
  totalOutbound: number;
}

export interface ShipmentPlanDspResponse {
  header: Omit<ShipmentPlan, 'items'> | null;
  rows: ShipmentPlanDspSummary[];
}

@Injectable()
export class ShipmentPlanService {
  constructor(
    private readonly shipmentPlanRepository: ShipmentPlanRepository,
    private readonly shipmentPlanItemRepository: ShipmentPlanItemRepository,
    @InjectRepository(MasterWeek)
    private readonly masterWeekRepository: Repository<MasterWeek>,
    @InjectRepository(OutboundMemoItem)
    private readonly outboundMemoItemRepository: Repository<OutboundMemoItem>,
  ) { }

  async uploadExcel(file: ShipmentPlanExcelFile, organizationId: string): Promise<ShipmentPlanUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimeTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    const fileExtension = file.originalname.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['xls', 'xlsx'];

    if (!allowedMimeTypes.includes(file.mimetype) && !allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException('Only Excel files (.xls, .xlsx) are allowed');
    }

    const rows = this.extractRowsFromExcel(file.buffer);
    return this.saveShipmentPlan(file, rows, organizationId);
  }

  private async saveShipmentPlan(
    file: ShipmentPlanExcelFile,
    rows: ShipmentPlanExtractedRow[],
    organizationId: string,
  ): Promise<ShipmentPlanUploadResponseDto> {
    const now = new Date();
    const weekData = await this.masterWeekRepository.findOne({
      where: {
        TANGGAL_AWAL_MINGGU_REAL: LessThanOrEqual(now),
        TANGGAL_AKHIR_MINGGU_REAL: MoreThanOrEqual(now),
      },
      order: { createdAt: 'DESC' },
    });

    if (!weekData) {
      throw new BadRequestException('Master week data not found for current date');
    }

    const weekNumber = weekData.MINGGU;
    const year = weekData.TAHUN;
    const batchNumber = await this.generateBatchNumber(year, weekNumber, organizationId);

    const shipmentPlan = await this.shipmentPlanRepository.create({
      fileName: file.originalname,
      fileSize: file.size,
      totalExtractedRows: rows.length,
      weekNumber,
      batchNumber,
      organizationId,
    });

    await this.shipmentPlanItemRepository.createMany(
      rows.map((row) => ({
        shipmentPlanId: shipmentPlan.id,
        source: row.source,
        type: row.type,
        reg: row.reg,
        code: row.code,
        amo: row.amo,
        sku: row.sku,
        metric: row.metric,
        quantity: row.quantity,
        uom: 'DUS',
      })),
    );

    return {
      shipmentPlanId: shipmentPlan.id,
      fileName: file.originalname,
      size: file.size,
      organizationId,
      mimeType: file.mimetype,
      weekNumber,
      batchNumber,
      totalExtractedRows: rows.length,
      rows,
    };
  }

  private async generateBatchNumber(year: number, weekNumber: number, organizationId: string | null): Promise<string> {
    const yearPart = String(year);
    const weekPart = String(weekNumber).padStart(2, '0');
    const prefix = `${yearPart}-${weekPart}-`;

    const latestBatchNumber = await this.shipmentPlanRepository.findLatestBatchNumberForPrefix(
      prefix,
      organizationId,
    );

    let nextIncrement = 1;
    if (latestBatchNumber) {
      const lastPart = latestBatchNumber.split('-').pop() || '0';
      const parsed = Number.parseInt(lastPart, 10);
      if (Number.isFinite(parsed)) {
        nextIncrement = parsed + 1;
      }
    }

    return `${prefix}${String(nextIncrement).padStart(4, '0')}`;
  }

  private extractRowsFromExcel(buffer: Buffer): ShipmentPlanExtractedRow[] {
    let workbook: XLSX.WorkBook;

    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch {
      throw new BadRequestException('Failed to read Excel file');
    }

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new BadRequestException('Excel file has no worksheet');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, {
      header: 1,
      raw: false,
      defval: '',
    });

    const headerPositions = this.findHeaderPositions(matrix);
    if (headerPositions.length === 0) {
      throw new BadRequestException('Header row TYPE/REG/CODE not found');
    }

    const extractedRows: ShipmentPlanExtractedRow[] = [];
    for (let headerIdx = 0; headerIdx < headerPositions.length; headerIdx++) {
      const headerPosition = headerPositions[headerIdx];
      const nextHeader = headerPositions[headerIdx + 1];
      const headerRowIndex = headerPosition.rowIndex;
      const destinationStartCol = headerPosition.nameCol + 1;

      // Different files place destination/SKU headers on slightly different rows.
      // Pick the best row-pair for each header block independently.
      const headerPairs: Array<[(string | number)[], (string | number)[]]> = [
        [matrix[headerRowIndex - 1] || [], matrix[headerRowIndex] || []],
        [matrix[headerRowIndex - 2] || [], matrix[headerRowIndex - 1] || []],
        [matrix[headerRowIndex] || [], matrix[headerRowIndex + 1] || []],
      ];

      let bestCandidate: ShipmentPlanColumnMapCandidate = { map: [], score: -1 };
      for (const [destinationRow, metricRow] of headerPairs) {
        const currentMap = this.buildColumnMap(destinationRow, metricRow, destinationStartCol);
        const currentScore = this.scoreColumnMap(currentMap);
        if (currentScore > bestCandidate.score) {
          bestCandidate = { map: currentMap, score: currentScore };
        }
      }

      const columnMap = bestCandidate.map;
      if (columnMap.length === 0) {
        continue;
      }

      const dataStartIndex = headerRowIndex + 1;
      const dataEndExclusive = nextHeader ? nextHeader.rowIndex : matrix.length;

      for (let i = dataStartIndex; i < dataEndExclusive; i++) {
        const row = matrix[i] || [];
        const source = this.normalizeCell(row[headerPosition.sourceCol]);
        const type = this.normalizeCell(row[headerPosition.typeCol]);
        const reg = this.normalizeCell(row[headerPosition.regCol]);
        const code = this.normalizeCell(row[headerPosition.codeCol]);
        const amo = this.normalizeCell(row[headerPosition.nameCol]);

        const hasIdentity = Boolean(type || reg || code || amo);
        if (!hasIdentity) {
          continue;
        }
        if (type.toUpperCase().startsWith('TOTAL')) {
          continue;
        }

        for (const column of columnMap) {
          const quantity = this.toNumber(row[column.colIndex]);
          if (quantity <= 0) {
            continue;
          }

          extractedRows.push({
            source,
            type,
            reg,
            code,
            amo,
            sku: column.destination,
            metric: column.metric,
            quantity,
          });
        }
      }
    }

    return extractedRows;
  }

  private buildColumnMap(
    destinationRow: (string | number)[],
    metricRow: (string | number)[],
    startCol: number,
  ): Array<{ colIndex: number; destination: string; metric: string }> {
    const map: Array<{ colIndex: number; destination: string; metric: string }> = [];
    let lastDestination = '';

    for (let col = startCol; col < Math.max(destinationRow.length, metricRow.length); col++) {
      const destinationCell = this.normalizeCell(destinationRow[col]).toUpperCase();
      if (destinationCell) {
        lastDestination = destinationCell;
      }

      const metric = this.normalizeCell(metricRow[col]).toUpperCase();
      if (!lastDestination || !metric) {
        continue;
      }
      if (!this.isLikelyDestination(lastDestination) || !this.isLikelyMetric(metric)) {
        continue;
      }

      map.push({
        colIndex: col,
        destination: lastDestination,
        metric,
      });
    }

    return map;
  }

  private findHeaderPositions(matrix: (string | number)[][]): ShipmentPlanHeaderPosition[] {
    const headers: ShipmentPlanHeaderPosition[] = [];

    for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
      const row = matrix[rowIndex] || [];

      for (let col = 0; col < row.length; col++) {
        const maybeSource = this.normalizeHeader(row[col]);
        const maybeType = this.normalizeHeader(row[col + 1]);
        const maybeReg = this.normalizeHeader(row[col + 2]);
        const maybeCode = this.normalizeHeader(row[col + 3]);
        const maybeFourth = this.normalizeHeader(row[col + 4]);

        if (maybeSource === 'SOURCE' && maybeType === 'TYPE' && maybeReg === 'REG' && maybeCode === 'CODE' && maybeFourth) {
          const candidate: ShipmentPlanHeaderPosition = {
            rowIndex,
            sourceCol: col,
            typeCol: col + 1,
            regCol: col + 2,
            codeCol: col + 3,
            nameCol: col + 4,
          };
          const exists = headers.some(
            (item) =>
              item.rowIndex === candidate.rowIndex &&
              item.typeCol === candidate.typeCol &&
              item.regCol === candidate.regCol &&
              item.codeCol === candidate.codeCol &&
              item.nameCol === candidate.nameCol,
          );
          if (!exists) {
            headers.push(candidate);
          }
        }
      }
    }

    return headers.sort((a, b) => a.rowIndex - b.rowIndex);
  }

  private normalizeCell(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).replace(/\s+/g, ' ').trim();
  }

  private normalizeHeader(value: unknown): string {
    return this.normalizeCell(value).toUpperCase();
  }

  private isLikelyDestination(value: string): boolean {
    return /^[A-Z]{2,}\d{1,3}$/.test(value);
  }

  private isLikelyMetric(value: string): boolean {
    return /^(MIX\s*PC|PC\s*\d{3,4})$/.test(value);
  }

  private scoreColumnMap(map: Array<{ colIndex: number; destination: string; metric: string }>): number {
    const destinationSet = new Set(map.map((item) => item.destination));
    let score = 0;

    for (const item of map) {
      if (this.isLikelyDestination(item.destination)) {
        score += 3;
      }
      if (this.isLikelyMetric(item.metric)) {
        score += 4;
      }
    }

    score += destinationSet.size * 2;
    return score;
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    if (value === null || value === undefined) {
      return 0;
    }

    const cleaned = String(value).replace(/,/g, '').trim();
    if (!cleaned) {
      return 0;
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  async findAll(): Promise<ShipmentPlan[]> {
    return await this.shipmentPlanRepository.findAll();
  }

  async findAllByOrganizationId(organizationId: string): Promise<ShipmentPlanDspResponse> {
    const latestPlans = await this.shipmentPlanRepository.findAllByOrganizationId(organizationId);
    const latestPlan = latestPlans[0];
    const header = latestPlan
      ? {
        id: latestPlan.id,
        createdAt: latestPlan.createdAt,
        updatedAt: latestPlan.updatedAt,
        deletedAt: latestPlan.deletedAt,
        organizationId: latestPlan.organizationId,
        fileName: latestPlan.fileName,
        fileSize: latestPlan.fileSize,
        totalExtractedRows: latestPlan.totalExtractedRows,
        weekNumber: latestPlan.weekNumber,
        batchNumber: latestPlan.batchNumber,
      }
      : null;

    if (!latestPlan?.items?.length) {
      return {
        header,
        rows: [],
      };
    }

    const grouped = new Map<string, ShipmentPlanDspSummary>();
    const outboundMemoCache = new Map<string, { totalMemo: number; totalOutbound: number }>();

    for (const item of latestPlan.items) {
      const key = `${item.source}|${item.type}|${item.reg}|${item.code}|${item.amo}`;
      let totalMemo = 0;
      let totalOutbound = 0;
      if (item.source === 'CWH' && item.type === 'AMO') {
        const centerCode = this.extractCenterCode(item.code);
        if (centerCode) {
          const cached = outboundMemoCache.get(centerCode);
          if (cached !== undefined) {
            totalMemo = cached.totalMemo;
            totalOutbound = cached.totalOutbound;
          } else {
            totalMemo = await this.countMemoByCenterCode(centerCode);
            totalOutbound = await this.sumDeliveredOutboundMemoByCenterCode(centerCode);
            outboundMemoCache.set(centerCode, { totalMemo, totalOutbound });
          }
        }
      }
      const current = grouped.get(key);
      if (current) {
        current.totalDsp += item.quantity;
        current.totalMemo = totalMemo;
        current.totalOutbound = totalOutbound;
        continue;
      }

      grouped.set(key, {
        source: item.source,
        type: item.type,
        reg: item.reg,
        code: item.code,
        amo: item.amo,
        totalDsp: item.quantity,
        totalMemo,
        totalOutbound,
      });
    }

    return {
      header,
      rows: Array.from(grouped.values()),
    };
  }

  async sumQuantityFromLatestBatchByOrganizationId(
    organizationId: string,
    source: string,
    type: string,
    reg: string,
    code: string,
  ): Promise<number> {
    return this.shipmentPlanRepository.sumQuantityFromLatestBatchByOrganizationId(
      organizationId,
      source,
      type,
      reg,
      code,
    );
  }

  private extractCenterCode(code: string): string {
    const normalized = this.normalizeCell(code).toUpperCase();
    if (!normalized) {
      return '';
    }

    const chunks = normalized.split('_').filter(Boolean);
    if (chunks.length >= 3) {
      return chunks[1];
    }

    return chunks[0] || normalized;
  }

  private async countMemoByCenterCode(centerCode: string): Promise<number> {
    const destinationPattern = `%${centerCode.toUpperCase()}%`;
    const result = await this.outboundMemoItemRepository
      .createQueryBuilder('memo_item')
      .innerJoin('memo_item.outbound_memo', 'memo')
      .select('COUNT(DISTINCT memo.id)', 'total')
      .where('memo.origin = :origin', { origin: 'CWH' })
      .andWhere('memo.type = :type', { type: 'AMO' })
      .andWhere('UPPER(memo.destination) LIKE :destinationPattern', { destinationPattern })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  private async sumDeliveredOutboundMemoByCenterCode(centerCode: string): Promise<number> {
    const destinationPattern = `%${centerCode.toUpperCase()}%`;
    const result = await this.outboundMemoItemRepository
      .createQueryBuilder('memo_item')
      .innerJoin('memo_item.outbound_memo', 'memo')
      .select('COALESCE(SUM(memo_item.quantity_delivered), 0)', 'total')
      .where('memo.origin = :origin', { origin: 'CWH' })
      .andWhere('memo.type = :type', { type: 'AMO' })
      .andWhere('UPPER(memo.destination) LIKE :destinationPattern', { destinationPattern })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }
}
