import { BadRequestException, Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

export interface ShipmentPlanExcelFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

interface ShipmentPlanExtractedRow {
  type: string;
  reg: string;
  code: string;
  name: string;
  destination: string;
  metric: string;
  quantity: number;
}

interface ShipmentPlanHeaderPosition {
  rowIndex: number;
  typeCol: number;
  regCol: number;
  codeCol: number;
  nameCol: number;
}

interface ShipmentPlanColumnMapCandidate {
  map: Array<{ colIndex: number; destination: string; metric: string }>;
  score: number;
}

@Injectable()
export class ShipmentPlanService {
  uploadExcel(file: ShipmentPlanExcelFile): {

    fileName: string;
    size: number;
    mimeType: string;
    totalExtractedRows: number;
    rows: ShipmentPlanExtractedRow[];
  } {
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

    return {
      fileName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      totalExtractedRows: rows.length,
      rows,
    };
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
        const type = this.normalizeCell(row[headerPosition.typeCol]);
        const reg = this.normalizeCell(row[headerPosition.regCol]);
        const code = this.normalizeCell(row[headerPosition.codeCol]);
        const name = this.normalizeCell(row[headerPosition.nameCol]);

        const hasIdentity = Boolean(type || reg || code || name);
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
            type,
            reg,
            code,
            name,
            destination: column.destination,
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
        const maybeType = this.normalizeHeader(row[col]);
        const maybeReg = this.normalizeHeader(row[col + 1]);
        const maybeCode = this.normalizeHeader(row[col + 2]);
        const maybeFourth = this.normalizeHeader(row[col + 3]);

        if (maybeType === 'TYPE' && maybeReg === 'REG' && maybeCode === 'CODE' && maybeFourth) {
          const candidate: ShipmentPlanHeaderPosition = {
            rowIndex,
            typeCol: col,
            regCol: col + 1,
            codeCol: col + 2,
            nameCol: col + 3,
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
}
