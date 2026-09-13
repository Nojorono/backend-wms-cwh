/** SPB/{callplan_number}/5{NNN} — e.g. SPB/KRW/2026/6/000046.1/5001 */
export function formatSpbNumber(callplanNumber: string, sequence: number): string {
  const normalizedCallplan = callplanNumber.trim();
  const suffix = `5${String(sequence).padStart(3, '0')}`;
  return `SPB/${normalizedCallplan}/${suffix}`;
}

/** e.g. KRW/2026/6 */
export function buildOrganizationCallplanPrefix(
  organizationCode: string,
  callplanDateStart: Date,
): string {
  const code = organizationCode.trim();
  const year = callplanDateStart.getFullYear();
  const month = callplanDateStart.getMonth() + 1;
  return `${code}/${year}/${month}`;
}

/** e.g. KRW/2026/6/000046.1 */
export function formatOrganizationCallplanNumber(
  organizationCode: string,
  callplanDateStart: Date,
  sequence: number,
): string {
  const prefix = buildOrganizationCallplanPrefix(organizationCode, callplanDateStart);
  const sequencePart = `${String(sequence).padStart(6, '0')}.1`;
  return `${prefix}/${sequencePart}`;
}

/** Extracts 46 from KRW/2026/6/000046.1 */
export function parseOrganizationCallplanSequence(
  callplanNumber?: string | null,
  expectedPrefix?: string,
): number | null {
  if (!callplanNumber?.trim()) {
    return null;
  }

  const trimmed = callplanNumber.trim();
  if (expectedPrefix && !trimmed.startsWith(`${expectedPrefix}/`)) {
    return null;
  }

  const lastPart = trimmed.split('/').pop();
  const match = /^(\d+)\.1$/.exec(lastPart ?? '');
  if (!match) {
    return null;
  }

  const sequence = Number.parseInt(match[1], 10);
  return Number.isNaN(sequence) ? null : sequence;
}

/** Extracts NNN from suffix 5NNN (5001 → 1). */
export function parseSpbSequence(spbNumber?: string | null): number | null {
  if (!spbNumber?.trim()) {
    return null;
  }

  const lastPart = spbNumber.trim().split('/').pop();
  if (!lastPart?.startsWith('5')) {
    return null;
  }

  const sequence = Number.parseInt(lastPart.slice(1), 10);
  return Number.isNaN(sequence) ? null : sequence;
}
