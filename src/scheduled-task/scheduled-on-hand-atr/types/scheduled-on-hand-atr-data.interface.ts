export interface ScheduledOnHandAtrBranchResult {
  cabang: string;
  organization_id: string;
  organization_name?: string;
  organization_type?: string;
  row_count: number;
  status: 'success' | 'skipped' | 'failed';
  message?: string;
}

export interface ScheduledOnHandAtrFetchResult {
  date: string;
  subinventory_code: string | string[];
  total_branches: number;
  processed_branches: number;
  skipped_branches: number;
  failed_branches: number;
  total_rows: number;
  branches: ScheduledOnHandAtrBranchResult[];
}
