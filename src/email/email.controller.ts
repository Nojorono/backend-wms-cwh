import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { SmtpConfigDto } from './dto/smtp-config.dto';
import { SendEmailResponseDto } from './dto/send-email-response.dto';

@ApiTags('Email')
@Controller('email')
@ApiBearerAuth('JWT-auth')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @ApiOperation({
    summary: 'Send email',
    description:
      'Send email with dynamic SMTP config in body, or omit smtp to use SMTP_* environment variables.',
  })
  @ApiResponse({ status: 201, description: 'Email sent.', type: SendEmailResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid payload or SMTP failure.' })
  sendEmail(@Body() dto: SendEmailDto): Promise<SendEmailResponseDto> {
    return this.emailService.sendEmail(dto);
  }

  @Post('verify-smtp')
  @ApiOperation({
    summary: 'Verify SMTP connection',
    description:
      'Test SMTP credentials/connectivity. Pass dynamic smtp config or use SMTP_* env defaults.',
  })
  @ApiResponse({ status: 200, description: 'SMTP verified.', type: SendEmailResponseDto })
  @ApiResponse({ status: 400, description: 'SMTP verification failed.' })
  verifySmtp(@Body() smtp?: SmtpConfigDto): Promise<SendEmailResponseDto> {
    return this.emailService.verifySmtpConnection(smtp);
  }
}
