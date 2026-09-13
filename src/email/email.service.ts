import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { CallPlanNullAhomTemplateDto } from './dto/call-plan-null-ahom-template.dto';
import { CallPlanReminderTemplateDto } from './dto/call-plan-reminder-template.dto';
import { SendCallPlanNullAhomEmailDto } from './dto/send-call-plan-null-ahom-email.dto';
import { SendCallPlanReminderEmailDto } from './dto/send-call-plan-reminder-email.dto';
import { SmtpConfigDto } from './dto/smtp-config.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { SendEmailResponseDto } from './dto/send-email-response.dto';
import { EmailTemplateService } from './email-template.service';
import { CallPlanNullAhomTemplateContext } from './template-email/types/call-plan-null-ahom-template.interface';
import { CallPlanReminderTemplateContext } from './template-email/types/call-plan-reminder-template.interface';
import { DoSuggestionVoidTemplateContext } from './template-email/types/do-suggestion-void-template.interface';

export interface ResolvedSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
  reply_to?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  /**
   * Send email using dynamic SMTP from request body, or SMTP_* env defaults.
   */
  async sendEmail(dto: SendEmailDto): Promise<SendEmailResponseDto> {
    if (!dto.text?.trim() && !dto.html?.trim()) {
      throw new BadRequestException('Either text or html body is required');
    }

    const smtpConfig = this.resolveSmtpConfig(dto.smtp);
    const transporter = this.createTransporter(smtpConfig);

    try {
      const result = await transporter.sendMail({
        from: smtpConfig.from,
        replyTo: smtpConfig.reply_to,
        to: dto.to,
        cc: dto.cc,
        bcc: dto.bcc,
        subject: dto.subject,
        text: dto.text,
        html: dto.html,
      });

      this.logger.log(
        `Email sent to=${dto.to.join(',')} subject="${dto.subject}" messageId=${result.messageId ?? 'N/A'}`,
      );

      return {
        success: true,
        message: 'Email sent successfully',
        message_id: result.messageId,
        smtp_host: smtpConfig.host,
        smtp_port: smtpConfig.port,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email: ${message}`);
      throw new BadRequestException(`Failed to send email: ${message}`);
    } finally {
      transporter.close();
    }
  }

  renderCallPlanReminderPreview(body: CallPlanReminderTemplateDto) {
    return this.emailTemplateService.renderCallPlanReminder(
      this.toCallPlanReminderContext(body),
    );
  }

  renderCallPlanNullAhomPreview(body: CallPlanNullAhomTemplateDto) {
    return this.emailTemplateService.renderCallPlanNullAhom(
      this.toCallPlanNullAhomContext(body),
    );
  }

  async sendCallPlanNullAhomEmail(
    dto: SendCallPlanNullAhomEmailDto,
  ): Promise<SendEmailResponseDto> {
    if (!dto.body.supervisors.length) {
      throw new BadRequestException('At least one supervisor block is required in body.supervisors');
    }

    const rendered = this.emailTemplateService.renderCallPlanNullAhom(
      this.toCallPlanNullAhomContext(dto.body),
    );

    return this.sendEmail({
      smtp: dto.smtp,
      to: dto.ahomEmail,
      cc: dto.supervisorEmail?.length ? dto.supervisorEmail : undefined,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }

  async sendCallPlanReminderEmail(
    dto: SendCallPlanReminderEmailDto,
  ): Promise<SendEmailResponseDto> {
    if (!dto.body.sales.length) {
      throw new BadRequestException('At least one sales row is required in body.sales');
    }

    const rendered = this.emailTemplateService.renderCallPlanReminder(
      this.toCallPlanReminderContext(dto.body),
    );

    return this.sendEmail({
      smtp: dto.smtp,
      to: dto.supervisorEmail,
      cc: dto.ahomEmail?.length ? dto.ahomEmail : undefined,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }

  async sendDoSuggestionVoidEmail(
    to: string[],
    context: DoSuggestionVoidTemplateContext,
  ): Promise<SendEmailResponseDto> {
    if (!to.length) {
      throw new BadRequestException('At least one recipient email is required');
    }

    const rendered = this.emailTemplateService.renderDoSuggestionVoid(context);

    return this.sendEmail({
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }

  private toCallPlanNullAhomContext(
    body: CallPlanNullAhomTemplateDto,
  ): CallPlanNullAhomTemplateContext {
    return {
      callPlanStartDate: body.callPlanStartDate,
      cabang: body.cabang,
      ahomName: body.ahomName,
      ahomNik: body.ahomNik,
      generatedAt: body.generatedAt ?? '',
      supervisors: body.supervisors.map((supervisor) => ({
        supervisorName: supervisor.supervisorName,
        supervisorNik: supervisor.supervisorNik,
        sales: supervisor.sales.map((row) => ({
          salesName: row.salesName,
          salesNik: row.salesNik,
          routeNumber: row.routeNumber ?? '',
          callPlanStartDate: row.callPlanStartDate ?? '',
          callPlanEndDate: row.callPlanEndDate ?? '',
          isLuarkota: row.isLuarkota === true,
        })),
      })),
    };
  }

  private toCallPlanReminderContext(
    body: CallPlanReminderTemplateDto,
  ): CallPlanReminderTemplateContext {
    return {
      callPlanStartDate: body.callPlanStartDate,
      cabang: body.cabang,
      supervisorName: body.supervisorName,
      supervisorNik: body.supervisorNik,
      ahomName: body.ahomName,
      ahomNik: body.ahomNik,
      generatedAt: body.generatedAt ?? '',
      sales: body.sales.map((row) => ({
        salesName: row.salesName,
        salesNik: row.salesNik,
        routeNumber: row.routeNumber ?? '',
        callPlanStartDate: row.callPlanStartDate ?? '',
        callPlanEndDate: row.callPlanEndDate ?? '',
        isLuarkota: row.isLuarkota === true,
      })),
    };
  }

  /** Verify SMTP connection (dynamic config or env defaults). */
  async verifySmtpConnection(smtp?: SmtpConfigDto): Promise<SendEmailResponseDto> {
    const smtpConfig = this.resolveSmtpConfig(smtp);
    const transporter = this.createTransporter(smtpConfig);

    try {
      await transporter.verify();
      this.logger.log(`SMTP connection verified host=${smtpConfig.host} port=${smtpConfig.port}`);

      return {
        success: true,
        message: 'SMTP connection verified successfully',
        smtp_host: smtpConfig.host,
        smtp_port: smtpConfig.port,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`SMTP verification failed: ${message}`);
      throw new BadRequestException(`SMTP verification failed: ${message}`);
    } finally {
      transporter.close();
    }
  }

  /** Build nodemailer transporter from resolved SMTP settings. */
  createTransporter(config: ResolvedSmtpConfig): Transporter {
    const hasAuth = Boolean(config.user?.trim() && config.pass?.trim());

    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      // 465 = implicit TLS; 587 = plain connect then STARTTLS.
      secure: config.secure,
      requireTLS: !config.secure && config.port === 587,
      auth: hasAuth
        ? {
            user: config.user!.trim(),
            pass: config.pass!.trim(),
          }
        : undefined,
    });
  }

  /** Merge request SMTP with environment defaults. */
  resolveSmtpConfig(override?: SmtpConfigDto): ResolvedSmtpConfig {
    const host =
      override?.host?.trim() ||
      this.configService.get<string>('SMTP_HOST')?.trim() ||
      '';
    const portRaw =
      override?.port ??
      this.configService.get<number>('SMTP_PORT') ??
      this.configService.get<string>('SMTP_PORT');
    const port = portRaw != null ? Number(portRaw) : NaN;
    const secure = this.resolveSmtpSecure(override?.secure, port);
    const user =
      override?.user?.trim() ||
      this.configService.get<string>('SMTP_USER')?.trim() ||
      undefined;
    const pass =
      override?.pass?.trim() ||
      this.configService.get<string>('SMTP_PASS')?.trim() ||
      undefined;
    const from =
      override?.from?.trim() ||
      this.configService.get<string>('SMTP_FROM')?.trim() ||
      '';
    const reply_to =
      override?.reply_to?.trim() ||
      this.configService.get<string>('SMTP_REPLY_TO')?.trim() ||
      undefined;

    if (!host) {
      throw new BadRequestException(
        'SMTP host is required (provide smtp.host or set SMTP_HOST)',
      );
    }
    if (!Number.isFinite(port) || port < 1 || port > 65535) {
      throw new BadRequestException(
        'SMTP port is required (provide smtp.port or set SMTP_PORT)',
      );
    }
    if (!from) {
      throw new BadRequestException(
        'SMTP from address is required (provide smtp.from or set SMTP_FROM)',
      );
    }

    return {
      host,
      port,
      secure,
      user,
      pass,
      from,
      reply_to,
    };
  }

  /**
   * Implicit TLS (`secure: true`) is only valid on port 465.
   * Port 587 speaks plain SMTP then STARTTLS — using implicit TLS causes
   * `ssl3_get_record:wrong version number`.
   */
  private resolveSmtpSecure(override: boolean | undefined, port: number): boolean {
    let secure: boolean;
    if (override !== undefined) {
      secure = override;
    } else {
      const envSecure = this.configService.get<string>('SMTP_SECURE');
      if (envSecure != null && String(envSecure).trim() !== '') {
        secure = this.parseBoolean(String(envSecure), port === 465);
      } else {
        secure = port === 465;
      }
    }

    if (port === 587 && secure) {
      this.logger.warn(
        'SMTP_SECURE=true is incompatible with port 587 (STARTTLS). Using secure=false.',
      );
      return false;
    }

    return secure;
  }

  private parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value == null || value === '') {
      return defaultValue;
    }
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
}
