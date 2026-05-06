import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { Inbound } from 'src/core/domain/entities/inbound.entity';
import { InboundDo } from 'src/core/domain/entities/inbound-do.entity';
import { InboundItem } from 'src/core/domain/entities/inbound-item.entity';
import { TransactionScanInbound } from 'src/core/domain/entities/transaction-scan-inbound.entity';
import { MasterItem } from 'src/core/domain/entities/master-item.entity';
import { MasterWarehouseSub } from 'src/core/domain/entities/master-warehouse-sub.entity';
import { MasterWarehouse } from 'src/core/domain/entities/master-warehouse.entity';
import {
  PurchaseOrderIntegrationService,
  extractPurchaseOrderResultRows,
  isPurchaseOrderFindSuccessful,
  type PurchaseOrderHeaderDto,
} from './purchase-order.integration';
import { SalesOrderIntegrationService } from './sales-order.integration';

type InboundIntegrationItem = InboundItem & {
  transaction_scan_inbounds?: TransactionScanInbound[];
  warehouse_sub?: MasterWarehouseSub;
  /** Physical location from scan (warehouse sub → parent warehouse). */
  warehouse?: MasterWarehouse;
  /** Sub-inventory / locator for quantity difference (`sub_inventory_difference` → `m_warehouse`). */
  warehouse_diff?: MasterWarehouse;
};
export type InboundIntegrationToOracleResult = Omit<
  Inbound,
  'transaction_scan_inbounds' | 'inbound_dos'
> & {
  inbound_reference_number?: string | null;
  inbound_dos?: (InboundDo & { inbound_items?: InboundIntegrationItem[] })[];
};
type InboundWithReference = Inbound & {
  inbound_reference_number?: string | null;
};
type InboundWithDos = {
  inbound_dos?: (InboundDo & { inbound_items?: InboundIntegrationItem[] })[];
};

@Injectable()
export class IntegrationToOracleService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly purchaseOrderIntegrationService: PurchaseOrderIntegrationService,
    private readonly salesOrderIntegrationService: SalesOrderIntegrationService,
  ) { }

  async build(
    inbound: InboundWithReference,
  ): Promise<InboundIntegrationToOracleResult> {
    const withItems = await this.populateInboundItemsItemRelation(inbound);
    await this.validateInboundDoOrderNumbersForIntegration(withItems);

    const nested = this.nestTransactionScansUnderInboundItems(withItems);
    const normalized = this.normalizeInboundItemsDecimalsForJson(nested);
    const withItemRelation = await this.populateInboundItemsItemRelation(normalized);
    return this.populateInboundItemsWarehouseRelation(withItemRelation);
  }

  private async validateInboundDoOrderNumbersForIntegration(inbound: Inbound): Promise<void> {
    const isPoType = (inbound.inbound_type || '').toUpperCase() === 'PO';

    for (const inboundDo of inbound.inbound_dos ?? []) {
      if (!inboundDo.inbound_po_number) {
        continue;
      }

      if (isPoType) {
        const poValidation = await this.purchaseOrderIntegrationService.findByOrderNumber(
          inboundDo.inbound_po_number,
        );
        if (!isPurchaseOrderFindSuccessful(poValidation)) {
          const err =
            'success' in poValidation && poValidation.success === false
              ? poValidation.error
              : 'No purchase order data returned';
          throw new BadRequestException(
            `Purchase order validation failed for ${inboundDo.inbound_po_number}: ${err || 'Unknown error'}`,
          );
        }
        await this.enrichInboundDoFromPurchaseOrderResponse(inboundDo, poValidation);
      } else {
        const soValidation = await this.salesOrderIntegrationService.findByOrderNumber(
          inboundDo.inbound_po_number,
        );
        if (soValidation?.success === false) {
          throw new BadRequestException(
            `Sales order validation failed for ${inboundDo.inbound_po_number}: ${soValidation.error || 'Unknown error'}`,
          );
        }
      }
    }
  }

  private normalizeInboundItemsDecimalsForJson(
    inbound: InboundIntegrationToOracleResult,
  ): InboundIntegrationToOracleResult {
    for (const inboundDo of inbound.inbound_dos ?? []) {
      for (const inboundItem of inboundDo.inbound_items ?? []) {
        const q = inboundItem.quantity_inspection;
        if (q == null) {
          continue;
        }
        const n = typeof q === 'string' ? parseFloat(q) : Number(q);
        if (!Number.isNaN(n)) {
          inboundItem.quantity_inspection = n;
        }
      }
    }
    return inbound;
  }

  private nestTransactionScansUnderInboundItems(
    inbound: Inbound & { inbound_reference_number?: string | null },
  ): InboundIntegrationToOracleResult {
    const scans = inbound.transaction_scan_inbounds ?? [];
    const byItemId = new Map<string, TransactionScanInbound[]>();
    for (const scan of scans) {
      if (!scan.item_id) {
        continue;
      }
      const list = byItemId.get(scan.item_id) ?? [];
      list.push(scan);
      byItemId.set(scan.item_id, list);
    }
    type ItemWithScans = InboundItem & { transaction_scan_inbounds?: TransactionScanInbound[] };
    for (const inboundDo of inbound.inbound_dos ?? []) {
      for (const inboundItem of inboundDo.inbound_items ?? []) {
        Object.assign(inboundItem, {
          transaction_scan_inbounds: inboundItem.item_id
            ? (byItemId.get(inboundItem.item_id) ?? [])
            : [],
        });
      }
    }

    const scanIsOnAnyLine = (scanId: string): boolean => {
      for (const inboundDo of inbound.inbound_dos ?? []) {
        for (const inboundItem of inboundDo.inbound_items ?? []) {
          const arr = (inboundItem as ItemWithScans).transaction_scan_inbounds;
          if (arr?.some((s) => s.id === scanId)) {
            return true;
          }
        }
      }
      return false;
    };

    const unattachedScans = scans
      .filter((s) => !scanIsOnAnyLine(s.id))
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    const nullItemLinesNeedingScans: InboundItem[] = [];
    for (const inboundDo of inbound.inbound_dos ?? []) {
      const ordered = [...(inboundDo.inbound_items ?? [])].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      for (const inboundItem of ordered) {
        if (!inboundItem.item_id) {
          const arr = (inboundItem as ItemWithScans).transaction_scan_inbounds;
          if (!arr?.length) {
            nullItemLinesNeedingScans.push(inboundItem);
          }
        }
      }
    }

    const toNum = (value: unknown): number | null => {
      if (value == null) return null;
      const n = typeof value === 'string' ? parseFloat(value) : Number(value);
      return Number.isNaN(n) ? null : n;
    };

    const unmatchedLines: InboundItem[] = [];
    for (const line of nullItemLinesNeedingScans) {
      const lineQtyInspection = toNum(line.quantity_inspection);
      const lineQty = toNum(line.quantity);
      const lineUom = line.uom ?? null;

      const idx = unattachedScans.findIndex((scan) => {
        const scanQty = toNum(scan.quantity);
        if (scanQty == null) return false;
        const qtyMatch =
          (lineQtyInspection != null && scanQty === lineQtyInspection) ||
          (lineQty != null && scanQty === lineQty);
        if (!qtyMatch) return false;
        return !lineUom || !scan.uom || scan.uom === lineUom;
      });

      if (idx === -1) {
        unmatchedLines.push(line);
        continue;
      }

      const [matchedScan] = unattachedScans.splice(idx, 1);
      Object.assign(line, { transaction_scan_inbounds: [matchedScan] });
    }

    const pairCount = Math.min(unattachedScans.length, unmatchedLines.length);
    for (let i = 0; i < pairCount; i++) {
      Object.assign(unmatchedLines[i], {
        transaction_scan_inbounds: [unattachedScans[i]],
      });
    }

    for (const inboundDo of inbound.inbound_dos ?? []) {
      for (const inboundItem of inboundDo.inbound_items ?? []) {
        const arr = (inboundItem as ItemWithScans).transaction_scan_inbounds ?? [];
        if (!inboundItem.item_id && arr.length > 0 && arr[0].item_id) {
          inboundItem.item_id = arr[0].item_id;
        }
      }
    }

    const { transaction_scan_inbounds: _rootScans, ...rest } = inbound;
    return rest;
  }

  private async populateInboundItemsItemRelation<T extends InboundWithDos>(
    inbound: T,
  ): Promise<T> {
    const itemIds = new Set<string>();
    for (const inboundDo of inbound.inbound_dos ?? []) {
      for (const inboundItem of inboundDo.inbound_items ?? []) {
        if (inboundItem.item_id) {
          itemIds.add(inboundItem.item_id);
        }
      }
    }

    if (!itemIds.size) {
      return inbound;
    }

    const items = await this.dataSource.getRepository(MasterItem).find({
      where: { id: In([...itemIds]) },
    });
    const itemMap = new Map(items.map((i) => [i.id, i]));

    for (const inboundDo of inbound.inbound_dos ?? []) {
      for (const inboundItem of inboundDo.inbound_items ?? []) {
        if (inboundItem.item_id) {
          const mapped = itemMap.get(inboundItem.item_id);
          if (mapped) {
            inboundItem.item = mapped;
          }
        }
      }
    }

    return inbound;
  }

  private async populateInboundItemsWarehouseRelation<T extends InboundWithDos>(
    inbound: T,
  ): Promise<T> {
    type InboundItemWithScansAndWarehouse = InboundItem & {
      transaction_scan_inbounds?: TransactionScanInbound[];
      warehouse_sub?: MasterWarehouseSub;
      warehouse?: MasterWarehouse;
      warehouse_diff?: MasterWarehouse;
    };

    const warehouseSubIds = new Set<string>();
    /** `inbound_item.sub_inventory_difference` stores FK to `m_warehouse.id` (difference / selisih warehouse). */
    const warehouseIdsFromSubInventoryDifference = new Set<string>();

    for (const inboundDo of inbound.inbound_dos ?? []) {
      for (const inboundItem of inboundDo.inbound_items ?? []) {
        const scans = (inboundItem as InboundItemWithScansAndWarehouse).transaction_scan_inbounds ?? [];
        for (const scan of scans) {
          if (scan.m_warehouse_sub_id) {
            warehouseSubIds.add(scan.m_warehouse_sub_id);
          }
        }
        const wid =
          inboundItem.sub_inventory_difference &&
            String(inboundItem.sub_inventory_difference).trim() !== ''
            ? String(inboundItem.sub_inventory_difference).trim()
            : null;
        if (wid) {
          warehouseIdsFromSubInventoryDifference.add(wid);
        }
      }
    }

    const warehouseSubs = warehouseSubIds.size
      ? await this.dataSource.getRepository(MasterWarehouseSub).find({
        where: { id: In([...warehouseSubIds]) },
      })
      : [];
    const warehouseSubMap = new Map(warehouseSubs.map((s) => [s.id, s]));

    const warehouseIds = new Set<string>(warehouseIdsFromSubInventoryDifference);
    for (const s of warehouseSubs) {
      if (s.warehouse_id) {
        warehouseIds.add(s.warehouse_id);
      }
    }

    if (!warehouseIds.size && !warehouseSubIds.size) {
      return inbound;
    }

    const warehouses = warehouseIds.size
      ? await this.dataSource.getRepository(MasterWarehouse).find({
        where: { id: In([...warehouseIds]) },
      })
      : [];
    const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));

    for (const inboundDo of inbound.inbound_dos ?? []) {
      for (const inboundItem of inboundDo.inbound_items ?? []) {
        const item = inboundItem as InboundItemWithScansAndWarehouse;
        const scans = item.transaction_scan_inbounds ?? [];
        const firstSubId = scans.find((s) => s.m_warehouse_sub_id)?.m_warehouse_sub_id;
        if (firstSubId) {
          const sub = warehouseSubMap.get(firstSubId);
          if (sub) {
            item.warehouse_sub = sub;
            if (sub.warehouse_id) {
              const wh = warehouseMap.get(sub.warehouse_id);
              if (wh) {
                item.warehouse = wh;
              }
            }
          }
        }

        const warehouseIdFromDiff =
          inboundItem.sub_inventory_difference &&
            String(inboundItem.sub_inventory_difference).trim() !== ''
            ? String(inboundItem.sub_inventory_difference).trim()
            : null;
        if (warehouseIdFromDiff) {
          const whDiff = warehouseMap.get(warehouseIdFromDiff);
          if (whDiff) {
            item.warehouse_diff = whDiff;
          }
        }
      }
    }

    return inbound;
  }

  /** Fills DO header and line fields from Oracle PO when WMS values are missing. */
  private async enrichInboundDoFromPurchaseOrderResponse(
    inboundDo: InboundDo,
    poResponse: unknown,
  ): Promise<void> {
    const rawRows = extractPurchaseOrderResultRows(poResponse);
    if (!rawRows?.length) {
      return;
    }
    const rows = rawRows as PurchaseOrderHeaderDto[];
    const po =
      rows.find(
        (r) =>
          inboundDo.inbound_po_number &&
          this.normalizePoItemCode(r.NOMOR_PO) ===
          this.normalizePoItemCode(inboundDo.inbound_po_number),
      ) ?? rows[0];
    if (!po) {
      return;
    }

    if (inboundDo.vendor_id == null && po.ID_VENDOR != null) {
      const v = Number(po.ID_VENDOR);
      if (!Number.isNaN(v)) {
        inboundDo.vendor_id = v;
      }
    }

    if (inboundDo.vendor_site_id == null) {
      const siteId = this.pickVendorSiteIdFromPoHeader(po);
      if (siteId != null) {
        inboundDo.vendor_site_id = siteId;
      }
    }

    // total count from purchase order
    // const lines = po.ITEM ?? [];
    // if (inboundDo.total_line_items == null && lines.length > 0) {
    //   inboundDo.total_line_items = lines.length;
    // }

    const inboundItemCount = inboundDo.inbound_items?.length ?? 0;
    if (inboundDo.total_line_items == null && inboundItemCount > 0) {
      inboundDo.total_line_items = inboundItemCount;
    }

    const unresolvedItemIds = Array.from(
      new Set(
        (inboundDo.inbound_items ?? [])
          .filter((i) => !i.item?.sku && i.item_id)
          .map((i) => i.item_id as string),
      ),
    );
    const itemLookup = new Map<string, MasterItem>();
    if (unresolvedItemIds.length > 0) {
      const rows = await this.dataSource.getRepository(MasterItem).find({
        where: { id: In(unresolvedItemIds) },
      });
      for (const row of rows) {
        itemLookup.set(row.id, row);
      }
    }

    // const usedPoLineNumbers = new Set<number>();
    // const unresolvedInboundItems: InboundItem[] = [];

    // for (const inboundItem of inboundDo.inbound_items ?? []) {
    //   if (inboundItem.line_number != null) {
    //     usedPoLineNumbers.add(inboundItem.line_number);
    //     continue;
    //   }
    //   const item =
    //     inboundItem.item ??
    //     (inboundItem.item_id ? itemLookup.get(inboundItem.item_id) : undefined);
    //   if (item && !inboundItem.item) {
    //     inboundItem.item = item;
    //   }
    //   const sku =
    //     item?.sku != null ? this.normalizePoItemCode(item.sku) : '';
    //   const kode =
    //     item?.item_number != null
    //       ? this.normalizePoItemCode(item.item_number)
    //       : '';

    //   const matched = lines.find((line) => {
    //     if (sku && this.normalizePoItemCode(line.SKU) === sku) {
    //       return true;
    //     }
    //     if (kode && this.normalizePoItemCode(line.KODE_ITEM) === kode) {
    //       return true;
    //     }
    //     return false;
    //   });

    //   const fallbackLine =
    //     matched ??
    //     (lines.length === 1 && (inboundDo.inbound_items?.length ?? 0) === 1
    //       ? lines[0]
    //       : undefined);

    //   if (fallbackLine != null) {
    //     const num = Number(fallbackLine.PO_LINE_NUM);
    //     if (!Number.isNaN(num)) {
    //       inboundItem.line_number = num;
    //       usedPoLineNumbers.add(num);
    //     }
    //   } else {
    //     unresolvedInboundItems.push(inboundItem);
    //   }
    // }

    // if (unresolvedInboundItems.length > 0) {
    //   const remainingPoLines = lines
    //     .map((line) => ({ line, num: Number(line.PO_LINE_NUM) }))
    //     .filter((x) => !Number.isNaN(x.num) && !usedPoLineNumbers.has(x.num))
    //     .sort((a, b) => a.num - b.num);

    //   const orderedInboundItems = [...unresolvedInboundItems].sort(
    //     (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    //   );

    //   const pairCount = Math.min(orderedInboundItems.length, remainingPoLines.length);
    //   for (let i = 0; i < pairCount; i++) {
    //     orderedInboundItems[i].line_number = remainingPoLines[i].num;
    //   }
    // }
  }

  private normalizePoItemCode(value: string | null | undefined): string {
    return (value ?? '').trim().toUpperCase();
  }

  /** Meta may add vendor site on the PO header under varying keys. */
  private pickVendorSiteIdFromPoHeader(header: PurchaseOrderHeaderDto): number | null {
    const ext = header as unknown as Record<string, unknown>;
    const candidates = [ext.VENDOR_SITE_ID, ext.ID_VENDOR_SITE, ext.SITE_ID];
    for (const c of candidates) {
      if (c == null || c === '') {
        continue;
      }
      const n = typeof c === 'string' ? parseInt(c, 10) : Number(c);
      if (!Number.isNaN(n)) {
        return n;
      }
    }
    return null;
  }
}
