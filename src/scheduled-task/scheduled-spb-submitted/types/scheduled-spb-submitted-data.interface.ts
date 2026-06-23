export interface ScheduledSpbSubmittedSuggestionResult {
  do_suggestion_id: string;
  callplan_number: string | null;
  spb_number: string | null;
  previous_status: string | null;
  updated_lines: number;
}

export interface ScheduledSpbSubmittedSubmitResult {
  total_pending: number;
  submitted_count: number;
  skipped_count: number;
  failed_count: number;
  updated_lines: number;
  suggestions: ScheduledSpbSubmittedSuggestionResult[];
  errors: Array<{ do_suggestion_id: string; message: string }>;
}
