import { DoSuggestionDetail } from '../../core/domain/entities/do-suggestion-detail.entity';

export function resolveSubmittedQty(detail: Pick<DoSuggestionDetail, 'item_qty_revision' | 'item_qty_suggestion'>): number | null {
  if (detail.item_qty_revision != null) {
    return Number(detail.item_qty_revision);
  }

  if (detail.item_qty_suggestion != null) {
    return Number(detail.item_qty_suggestion);
  }

  return null;
}
