import { ShipConfirmInternalTransactionType } from '../../core/domain/entities/outbound-integration-deliveries.entity';

export type OutboundIntegrationJobType = 'PO_INTERNAL_REQ' | 'SHIP_CONFIRM';

export interface OutboundJobPayload {
  outboundDoId: string;
  retryCount: number;
  maxRetry: number;
  jobType?: OutboundIntegrationJobType;
  /** Scopes shipconfirm.find / status evaluation to one staging transaction type */
  transactionType?: ShipConfirmInternalTransactionType;
}

export type OutboundJobProcessStatus = 'SUCCESS' | 'ERROR' | 'PENDING';

export type OutboundMemoCheckResult = {
  outboundMemoId: string;
  status: OutboundJobProcessStatus;
  reason: string;
};

export type OutboundDoCheckResult = {
  status: OutboundJobProcessStatus;
  reason: string;
  memos: OutboundMemoCheckResult[];
};

export type ShipConfirmDoCheckResult = {
  status: OutboundJobProcessStatus;
  reason: string;
  deliveriesUpdated: number;
  hasError: boolean;
};
