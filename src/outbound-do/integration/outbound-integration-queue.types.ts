export interface OutboundJobPayload {
  outboundDoId: string;
  retryCount: number;
  maxRetry: number;
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
