export interface SnowflakeStatementsResponse {
  resultSetMetaData?: {
    numRows?: number;
    format?: string;
  };
  data?: string[][];
  code?: string;
  message?: string;
  statementStatusUrl?: string;
}
