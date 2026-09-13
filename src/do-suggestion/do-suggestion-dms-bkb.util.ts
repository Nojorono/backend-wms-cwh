/** WMS callplan e.g. KRW/2026/8/000001.1 → DMS JAS/CP/2026/09/00001 */
export function toDmsCallplanNumber(callplanNumber: string): string {
  const trimmed = callplanNumber.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (/\/CP\//.test(trimmed)) {
    return trimmed;
  }

  const wmsMatch = /^([^/]+)\/(\d{4})\/(\d{1,2})\/(\d+)\.1$/.exec(trimmed);
  if (wmsMatch) {
    const [, org, year, month, seq] = wmsMatch;
    return `${org}/CP/${year}/${String(month).padStart(2, '0')}/${String(Number(seq)).padStart(5, '0')}`;
  }

  return trimmed;
}

/** WMS SPB e.g. SPB/KRW/2026/8/000001.1/5001 → DMS KRW/SPB/2026/08/0001 */
export function toDmsSpbNumber(spbNumber: string): string {
  const trimmed = spbNumber.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (!trimmed.startsWith('SPB/') && /\/SPB\//.test(trimmed)) {
    return trimmed;
  }

  const wmsMatch = /^SPB\/([^/]+)\/(\d{4})\/(\d{1,2})\/(\d+)\.1\/5(\d+)$/.exec(trimmed);
  if (wmsMatch) {
    const [, org, year, month, , spbSeqSuffix] = wmsMatch;
    const sequence = Number(spbSeqSuffix);
    return `${org}/SPB/${year}/${String(month).padStart(2, '0')}/${String(sequence).padStart(4, '0')}`;
  }

  return trimmed;
}
