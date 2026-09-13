import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { Public } from './public.decorator';
import { DmsIntegrationAuthGuard } from '../../infrastructure/guards/dms-integration-auth.guard';
import {
  DMS_INTEGRATION_APP_ID_HEADER,
  DMS_INTEGRATION_APP_SECRET_HEADER,
} from '../../infrastructure/services/dms-integration-auth.service';

export function DmsIntegrationAuth() {
  return applyDecorators(
    Public(),
    UseGuards(DmsIntegrationAuthGuard),
    ApiHeader({
      name: DMS_INTEGRATION_APP_ID_HEADER,
      description: 'DMS integration app ID from environment (direct auth, no JWT required)',
      required: false,
    }),
    ApiHeader({
      name: DMS_INTEGRATION_APP_SECRET_HEADER,
      description: 'DMS integration app secret from environment (direct auth, no JWT required)',
      required: false,
    }),
    ApiBearerAuth('DMS-auth'),
  );
}
