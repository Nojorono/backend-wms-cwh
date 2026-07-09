import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  INDONESIA_HOLIDAY_API_BASE_URL,
  INDONESIA_HOLIDAY_CACHE_TTL_MS,
  IndonesiaHolidayApiResponse,
  IndonesiaHolidayEntry,
} from './indonesia-national-holidays.data';

interface HolidayCacheEntry {
  holidays: IndonesiaHolidayEntry[];
  fetchedAt: number;
}

@Injectable()
export class IndonesiaNationalHolidayService {
  private readonly logger = new Logger(IndonesiaNationalHolidayService.name);
  private readonly cache = new Map<number, HolidayCacheEntry>();

  async getHolidays(year: number): Promise<IndonesiaHolidayEntry[]> {
    this.validateYear(year);

    const cached = this.cache.get(year);
    if (cached && Date.now() - cached.fetchedAt < INDONESIA_HOLIDAY_CACHE_TTL_MS) {
      return cached.holidays;
    }

    const holidays = await this.fetchHolidaysFromApi(year);
    this.cache.set(year, { holidays, fetchedAt: Date.now() });
    return holidays;
  }

  async hasHolidayData(year: number): Promise<boolean> {
    const holidays = await this.getHolidays(year);
    return holidays.length > 0;
  }

  getCachedYears(): number[] {
    return Array.from(this.cache.keys()).sort((a, b) => a - b);
  }

  clearCache(year?: number): void {
    if (year === undefined) {
      this.cache.clear();
      return;
    }

    this.cache.delete(year);
  }

  private validateYear(year: number): void {
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new BadRequestException('Year must be between 2000 and 2100');
    }
  }

  private async fetchHolidaysFromApi(year: number): Promise<IndonesiaHolidayEntry[]> {
    const url = `${INDONESIA_HOLIDAY_API_BASE_URL}?year=${year}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new BadGatewayException(
          `Failed to fetch Indonesia national holidays for ${year} (HTTP ${response.status})`,
        );
      }

      const payload = (await response.json()) as IndonesiaHolidayApiResponse;

      if (!Array.isArray(payload.data)) {
        throw new BadGatewayException(
          `Invalid holiday API response for year ${year}`,
        );
      }

      const holidays = payload.data.map((item) => this.mapApiItem(item));

      this.logger.log(
        `Fetched ${holidays.length} holiday entries for ${year} from ${INDONESIA_HOLIDAY_API_BASE_URL}`,
      );

      return holidays;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Holiday API request failed for year ${year}: ${message}`);
      throw new BadGatewayException(
        `Unable to fetch Indonesia national holidays for ${year}. Please try again later.`,
      );
    }
  }

  private mapApiItem(item: IndonesiaHolidayApiResponse['data'][number]): IndonesiaHolidayEntry {
    const name = item.description?.trim() || 'Hari Libur';
    const isJointLeave = this.isJointLeaveDescription(name);

    return {
      date: item.date,
      name,
      isJointLeave,
    };
  }

  private isJointLeaveDescription(description: string): boolean {
    return /cuti\s*bersama/i.test(description);
  }
}
