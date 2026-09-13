export interface InboundJobPayload {
  inboundId: string;
  requestId?: number;
  retryCount: number;
  maxRetry: number;
}

export type InboundJobProcessStatus = 'SUCCESS' | 'ERROR' | 'PENDING';
