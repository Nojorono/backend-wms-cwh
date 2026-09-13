export interface SnowflakePartitionInfo {
  rowCount: number;
  uncompressedSize?: number;
  compressedSize?: number;
}

export interface SnowflakeStatementsResponse {
  resultSetMetaData?: {
    numRows?: number;
    format?: string;
    partitionInfo?: SnowflakePartitionInfo[];
  };
  data?: string[][];
  code?: string;
  message?: string;
  statementHandle?: string;
  statementStatusUrl?: string;
}
