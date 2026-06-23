/** Redis queue payload — insert (create_with_lines) jobs only. */
export interface MoveOrderIntegrationInsertJobPayload {
  moveOrderIntegrationId: string;
  request_number: string;
  source_system?: string;
  userId?: number;
  userName?: string;
}

/** RMQ integration queue payload — poll Oracle status and update WMS. */
export interface MoveOrderIntegrationPollJobPayload {
  moveOrderIntegrationId: string;
  request_number: string;
  source_system?: string;
  retryCount: number;
  maxRetry: number;
}

export type MoveOrderIntegrationJobStatus = 'SUCCESS' | 'ERROR' | 'PENDING';

export type MoveOrderIntegrationCheckResult = {
  status: MoveOrderIntegrationJobStatus;
  reason: string;
};
