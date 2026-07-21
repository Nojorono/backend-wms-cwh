import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { OracleInboundStatusCheckerService } from 'src/inbound/integration/oracle-inbound-status-checker.service';
import { InboundIntegrationPollResponseDto } from './dto/inbound-integration-poll-response.dto';

@Injectable()
export class InboundIntegrationPollService {
  constructor(
    @Inject(forwardRef(() => OracleInboundStatusCheckerService))
    private readonly statusChecker: OracleInboundStatusCheckerService,
  ) {}

  pollByInboundDoId(inboundDoId: string): Promise<InboundIntegrationPollResponseDto> {
    return this.statusChecker.pollByInboundDoId(inboundDoId);
  }
}
