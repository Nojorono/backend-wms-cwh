import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../core/decorators/public.decorator';
import { CallPlanReminderPreviewQueryDto } from './dto/call-plan-reminder-preview-query.dto';
import { CallPlanReminderTemplateDto } from './dto/call-plan-reminder-template.dto';
import { PreviewCallPlanReminderEmailDto } from './dto/preview-call-plan-reminder-email.dto';
import { SendCallPlanReminderEmailDto } from './dto/send-call-plan-reminder-email.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { SendEmailResponseDto } from './dto/send-email-response.dto';
import { SmtpConfigDto } from './dto/smtp-config.dto';
import { EmailService } from './email.service';
import { mergeCallPlanReminderPreviewBody } from './template-email/call-plan-reminder-preview.sample';

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

  @Public()
  @Get('call-plan-reminder/preview/html')
  @ApiOperation({
    summary: 'Open call plan reminder preview in browser',
    description:
      'Public GET endpoint. Open this URL in a web browser to view the rendered HTML email. Optional query params override sample data.',
  })
  @ApiProduces('text/html')
  @ApiResponse({ status: 200, description: 'Rendered HTML email page.' })
  openCallPlanReminderPreviewHtml(
    @Query() query: CallPlanReminderPreviewQueryDto,
    @Res() res: Response,
  ): void {
    this.sendCallPlanReminderHtml(res, mergeCallPlanReminderPreviewBody(query));
  }

  @Post('call-plan-reminder/preview')
  @ApiOperation({
    summary: 'Preview call plan reminder email template (JSON)',
    description:
      'Render HTML/text template as JSON. Use GET /call-plan-reminder/preview/html to open in browser.',
  })
  @ApiResponse({ status: 200, description: 'Rendered call plan reminder email.' })
  previewCallPlanReminder(@Body() dto: PreviewCallPlanReminderEmailDto) {
    return this.emailService.renderCallPlanReminderPreview(dto.body);
  }

  @Post('call-plan-reminder/preview/html')
  @ApiOperation({
    summary: 'Preview call plan reminder as HTML page (POST)',
    description:
      'Returns text/html response for browser preview. Send the same body as /preview.',
  })
  @ApiProduces('text/html')
  @ApiResponse({ status: 200, description: 'Rendered HTML email page.' })
  previewCallPlanReminderHtml(
    @Body() dto: PreviewCallPlanReminderEmailDto,
    @Res() res: Response,
  ): void {
    this.sendCallPlanReminderHtml(res, dto.body);
  }

  @Post('call-plan-reminder/send')
  @ApiOperation({
    summary: 'Send call plan reminder email',
    description: 'Send reminder to supervisor (TO) with AHOM in CC.',
  })
  @ApiResponse({ status: 201, description: 'Reminder email sent.', type: SendEmailResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid payload or SMTP failure.' })
  sendCallPlanReminder(@Body() dto: SendCallPlanReminderEmailDto): Promise<SendEmailResponseDto> {
    return this.emailService.sendCallPlanReminderEmail(dto);
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

  private sendCallPlanReminderHtml(res: Response, body: CallPlanReminderTemplateDto): void {
    const rendered = this.emailService.renderCallPlanReminderPreview(body);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(rendered.html);
  }
}
