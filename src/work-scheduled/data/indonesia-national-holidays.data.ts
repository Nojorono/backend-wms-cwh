export interface IndonesiaHolidayEntry {
  date: string;
  name: string;
  isJointLeave?: boolean;
}

export const INDONESIA_HOLIDAY_API_BASE_URL =
  process.env.INDONESIA_HOLIDAY_API_URL?.trim() || 'https://api-hari-libur.vercel.app/api';

export const INDONESIA_HOLIDAY_CACHE_TTL_MS = Number(
  process.env.INDONESIA_HOLIDAY_CACHE_TTL_MS ?? 24 * 60 * 60 * 1000,
);

export interface IndonesiaHolidayApiItem {
  date: string;
  description: string;
}

export interface IndonesiaHolidayApiResponse {
  status: string;
  code: number;
  data: IndonesiaHolidayApiItem[];
  message?: string;
}
