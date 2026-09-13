export const computeInboundRetryDelayMs = (retryCount: number): number =>
  Math.min(60000, 2000 * Math.pow(2, retryCount));
