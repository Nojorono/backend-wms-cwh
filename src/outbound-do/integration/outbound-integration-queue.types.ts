export interface OutboundJobPayload {
  outboundDoId: string;
  retryCount: number;
  maxRetry: number;
}

export type OutboundJobProcessStatus = 'SUCCESS' | 'ERROR' | 'PENDING';
