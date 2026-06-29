export function normalizeLogMessage(message: unknown): string {
  if (message == null) {
    return '';
  }
  if (typeof message === 'string') {
    return message;
  }
  if (message instanceof Error) {
    return message.message;
  }
  try {
    return JSON.stringify(message);
  } catch {
    return String(message);
  }
}

export function formatLogMetaValue(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof Error) {
    return value.message;
  }

  try {
    return JSON.stringify(value);
  } catch {
    try {
      return String(value);
    } catch {
      return '[Unserializable]';
    }
  }
}

export function formatLogMeta(meta: Record<string, unknown>): string {
  return Object.entries(meta)
    .filter(([, value]) => value != null && value !== '')
    .map(([key, value]) => `${key}=${formatLogMetaValue(value)}`)
    .join(' ');
}

export function extractOracleErrorCode(message?: string): string | undefined {
  if (!message) {
    return undefined;
  }
  return message.match(/ORA-\d+/)?.[0];
}

export function summarizeOracleError(message?: string): string | undefined {
  if (!message) {
    return undefined;
  }

  const code = extractOracleErrorCode(message);
  const firstLine = message.split('\n').find((line) => line.trim())?.trim();
  if (!firstLine) {
    return code;
  }

  return code ? `${code}: ${firstLine.replace(/^.*ORA-\d+:\s*/, '')}` : firstLine;
}
