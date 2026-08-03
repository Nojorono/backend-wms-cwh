import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreateBtbDto } from './create-btb.dto';
import { CreateBtbDetailDto } from './create-btb-detail.dto';

export class UpdateBtbDto extends PartialType(CreateBtbDto) {
  @ApiPropertyOptional({
    type: [CreateBtbDetailDto],
    description:
      'When provided, upserts detail lines (update by id, create when id omitted). Existing lines not listed are left unchanged.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBtbDetailDto)
  details?: CreateBtbDetailDto[];
}
