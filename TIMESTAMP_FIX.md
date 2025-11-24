# Timestamp Handling Fix - Indonesia Timezone

## Problem
Timestamps were not being handled consistently, causing timezone issues where dates/times would appear different than expected. The application now uses Indonesia timezone (WIB, UTC+7) for display while storing in UTC in the database.

## Solution Implemented

### 1. TypeORM Configuration
- Added UTC timezone configuration in `typeorm.config.ts` and `app.module.ts`
- Ensures all database connections use UTC timezone for storage
- **Important**: Database stores in UTC, but API responses show Indonesia timezone

### 2. BaseEntity Update
- Updated `BaseEntity` to use `timestamp with time zone` type
- This ensures PostgreSQL stores timestamps with timezone information
- All entities extending `BaseEntity` now have consistent timestamp handling

### 3. Response Interceptor Enhancement
- Enhanced `ResponseInterceptor` to automatically transform all Date objects to Indonesia timezone (WIB, UTC+7)
- Recursively processes nested objects and arrays
- Converts UTC dates from database to Indonesia timezone for API responses
- Format: ISO 8601 with `+07:00` offset (e.g., `2025-01-15T10:30:00.000+07:00`)

### 4. Date Transformer Utility
- Created `date-transformer.util.ts` with utility functions:
  - `TransformDate()`: Decorator for transforming date strings to Date objects in DTOs
  - `TransformDateToIndonesia()`: Decorator for transforming dates to Indonesia timezone ISO strings
  - `TransformDateToISO()`: Decorator for transforming dates to UTC ISO strings
  - `toUTC()`: Helper function to convert dates to UTC (for database storage)
  - `formatDateToIndonesia()`: Helper function to format dates to Indonesia timezone (UTC+7)
  - `fromIndonesiaToUTC()`: Helper function to convert Indonesia timezone dates to UTC

## Timezone Configuration

- **Database Storage**: UTC (for consistency and best practices)
- **API Responses**: Indonesia timezone (WIB, UTC+7)
- **Timezone Constant**: `Asia/Jakarta` (UTC+7)

## Usage

### In DTOs
```typescript
import { TransformDate } from '../../core/utils/date-transformer.util';

export class CreateOutboundMemoDto {
  @ApiProperty({ example: '2025-01-15T00:00:00.000+07:00' })
  @IsDate()
  @Type(() => Date)
  @TransformDate()
  delivery_date: Date;
}
```

### Automatic Date Serialization
All Date objects in responses are automatically converted to Indonesia timezone (UTC+7) by the `ResponseInterceptor`. No additional code needed.

### Manual Date Conversion
```typescript
import { formatDateToIndonesia, fromIndonesiaToUTC } from '../core/utils/date-transformer.util';

// Convert UTC date to Indonesia timezone for display
const indonesiaDate = formatDateToIndonesia(new Date());
// Returns: "2025-01-15T10:30:00.000+07:00"

// Convert Indonesia timezone date to UTC for storage
const utcDate = fromIndonesiaToUTC("2025-01-15T10:30:00.000+07:00");
// Returns: Date object in UTC
```

## Benefits

1. **Consistency**: All timestamps stored in UTC in database, eliminating timezone confusion
2. **Localization**: API responses show Indonesia timezone (WIB, UTC+7) for better user experience
3. **Automatic**: Response interceptor handles date serialization automatically
4. **Type Safety**: TypeORM properly handles timestamp with timezone
5. **Standards Compliant**: ISO 8601 format with timezone offset for all date responses

## How It Works

1. **Storage**: When saving dates, they are stored in UTC in the database
2. **Retrieval**: When reading dates from database, they are in UTC
3. **Response**: Response interceptor automatically converts UTC dates to Indonesia timezone (UTC+7) before sending to client
4. **Format**: All dates in API responses use format: `YYYY-MM-DDTHH:mm:ss.SSS+07:00`

## Example

**Database (UTC)**: `2025-01-15 03:30:00.000 UTC`
**API Response (Indonesia)**: `2025-01-15T10:30:00.000+07:00`

## Database Migration Note

If you have existing data, you may need to run a migration to update existing timestamp columns to `timestamp with time zone`:

```sql
ALTER TABLE your_table 
ALTER COLUMN created_at TYPE timestamp with time zone USING created_at AT TIME ZONE 'UTC',
ALTER COLUMN updated_at TYPE timestamp with time zone USING updated_at AT TIME ZONE 'UTC';
```

## Testing

To verify the fix:
1. Create a new record with a date field
2. Check the response - dates should be in Indonesia timezone format (e.g., `2025-01-15T10:30:00.000+07:00`)
3. Check the database - timestamps should be stored in UTC
4. Retrieve the record - dates should be converted to Indonesia timezone automatically

