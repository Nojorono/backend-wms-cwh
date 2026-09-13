export const DO_SUGGESTION_VOID_BACK_TO_KECIL_SUFFIX = '-V';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function buildVoidBackToKecilSourceHeaderId(doSuggestionId: string): string {
  return `${doSuggestionId}${DO_SUGGESTION_VOID_BACK_TO_KECIL_SUFFIX}`;
}

export function buildVoidBackToKecilSourceLineId(lineId: string): string {
  return `${lineId}${DO_SUGGESTION_VOID_BACK_TO_KECIL_SUFFIX}`;
}

export function parseDoSuggestionIdFromVoidSourceHeaderId(
  sourceHeaderId?: string | null,
): string | null {
  if (!sourceHeaderId?.endsWith(DO_SUGGESTION_VOID_BACK_TO_KECIL_SUFFIX)) {
    return null;
  }

  const doSuggestionId = sourceHeaderId.slice(
    0,
    -DO_SUGGESTION_VOID_BACK_TO_KECIL_SUFFIX.length,
  );

  return UUID_PATTERN.test(doSuggestionId) ? doSuggestionId : null;
}
