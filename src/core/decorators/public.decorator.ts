import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const SKIP_AUDIT_LOG_KEY = 'skipAuditLog';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const SkipAuditLog = () => SetMetadata(SKIP_AUDIT_LOG_KEY, true);
