/** SPB/{callplan_number}/5{NNN} — e.g. SPB/CP-2026-0001/5001 */
export function formatSpbNumber(callplanNumber: string, sequence: number): string {
  const normalizedCallplan = callplanNumber.trim();
  const suffix = `5${String(sequence).padStart(3, '0')}`;
  return `SPB/${normalizedCallplan}/${suffix}`;
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
