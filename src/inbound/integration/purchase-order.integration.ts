import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ensureRmqConnection } from 'src/core/helpers/rmq-connection.helper';

/** Line from PURCHASE_ORDER_SERVICE `purchase-order.findByNomorPO` */
export interface PurchaseOrderLineItemDto {
  PO_LINE_NUM: number;
  SKU: string;
  KODE_ITEM: string;
  DESKRIPSI_ITEM_LINE_PO: string;
  PO_LINE_QUANTITY: string;
  UOM: string;
  STATUS: string;
}

export interface PurchaseOrderHeaderDto {
  NOMOR_PO: string;
  ID_VENDOR: number;
  NAMA_VENDOR: string;
  ALAMAT_VENDOR: string;
  PRIN_GROUP: string;
  TANGGAL_PEMBUATAN_PO: string;
  STATUS_PO: string;
  TANGGAL_APPROVE_PO: string;
  ITEM: PurchaseOrderLineItemDto[];
}

/**
 * Meta may return HTTP-style `{ statusCode, message, data }`, a plain array of rows,
 * `{ rows }`, `{ result }`, or a single PO object. Transport errors become `{ success: false, error }`.
 */
export type PurchaseOrderFindResponseDto =
  | {
      statusCode?: number | string;
      message?: string;
      data?: PurchaseOrderHeaderDto[] | PurchaseOrderHeaderDto;
      rows?: unknown[];
      result?: unknown[];
    }
  | PurchaseOrderHeaderDto[]
  | {
      success: false;
      error: string;
    };

/**
 * Extracts a non-empty list of records from meta PO responses so validation matches
 * `findByNomorPO` / Oracle whether or not `statusCode` is present.
 */
export function extractPurchaseOrderResultRows(res: unknown): unknown[] | null {
  if (res === null || res === undefined) {
    return null;
  }
  if (Array.isArray(res)) {
    return res;
  }
  if (typeof res !== 'object') {
    return null;
  }
  const o = res as Record<string, unknown>;
  if (o.success === false) {
    return null;
  }
  if (Array.isArray(o.data)) {
    return o.data;
  }
  if (o.data != null && typeof o.data === 'object' && !Array.isArray(o.data)) {
    return [o.data];
  }
  if (Array.isArray(o.rows)) {
    return o.rows;
  }
  if (Array.isArray(o.result)) {
    return o.result;
  }
  if (o.NOMOR_PO != null || o.ITEM != null) {
    return [o];
  }
  const code = o.statusCode;
  if (code !== undefined && code !== null && code !== '') {
    const n = typeof code === 'string' ? parseInt(code, 10) : Number(code);
    if (!Number.isNaN(n) && n >= 400) {
      return null;
    }
  }
  return null;
}

export function isPurchaseOrderFindSuccessful(res: unknown): boolean {
  if (res === null || res === undefined) {
    return false;
  }
  if (typeof res === 'object' && 'success' in res && (res as { success?: boolean }).success === false) {
    return false;
  }
  const rows = extractPurchaseOrderResultRows(res);
  return rows !== null && rows.length > 0;
}

@Injectable()
export class PurchaseOrderIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(PurchaseOrderIntegrationService.name);
  private connectionEstablished = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private readonly CONNECTION_RETRY_DELAY = 2000;

  constructor(
    @Inject('PURCHASE_ORDER_SERVICE')
    private readonly purchaseOrderClient: ClientProxy,
  ) { }

  async onModuleInit() {
    this.logger.log('Initializing PURCHASE_ORDER_SERVICE RabbitMQ integration...');
    await this.ensureConnection();
    this.logger.log('PURCHASE_ORDER_SERVICE RabbitMQ integration initialization completed');
  }

  private async ensureConnection(): Promise<void> {
    const state = {
      connectionEstablished: this.connectionEstablished,
      connectionAttempts: this.connectionAttempts,
    };

    await ensureRmqConnection(this.purchaseOrderClient, this.logger, state, {
      maxAttempts: this.MAX_CONNECTION_ATTEMPTS,
      baseRetryDelayMs: this.CONNECTION_RETRY_DELAY,
      serviceName: 'purchase_order',
    });

    this.connectionEstablished = state.connectionEstablished;
    this.connectionAttempts = state.connectionAttempts;
  }

  /**
   * Calls meta `PurchaseOrderMicroserviceController` @MessagePattern('purchase-order.findByNomorPO')
   * with `{ nomorPO }` (same value as WMS `inbound_do.inbound_po_number`).
   */
  async findByOrderNumber(nomorPO: string): Promise<PurchaseOrderFindResponseDto> {
    try {
      const timeoutMs = 30000;
      return await firstValueFrom(
        this.purchaseOrderClient
          .send<PurchaseOrderFindResponseDto>('purchase-order.findByNomorPO', { nomorPO })
          .pipe(
            timeout(timeoutMs),
            catchError((error: unknown) => {
              const msg = formatMicroserviceError(error);
              this.logger.error(`PURCHASE_ORDER_SERVICE request failed: ${msg}`);
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );
    } catch (error: unknown) {
      this.connectionEstablished = false;
      const msg = formatMicroserviceError(error);
      this.logger.error(`Error calling purchase-order.findByNomorPO: ${msg}`, error instanceof Error ? error.stack : undefined);
      return { success: false, error: msg };
    }
  }
}

function formatMicroserviceError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
