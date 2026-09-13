export const computeMoveOrderIntegrationRetryDelayMs = (retryCount: number): number =>
  Math.min(60000, 2000 * Math.pow(2, retryCount));

export const sleepMs = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
