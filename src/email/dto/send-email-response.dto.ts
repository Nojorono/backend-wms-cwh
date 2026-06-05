import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Email sent successfully' })
  message: string;

  @ApiPropertyOptional({ example: '<message-id@smtp.gmail.com>' })
  message_id?: string;

  @ApiPropertyOptional({ example: 'smtp.gmail.com' })
  smtp_host?: string;

  @ApiPropertyOptional({ example: 587 })
  smtp_port?: number;
}
