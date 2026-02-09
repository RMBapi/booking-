import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CanScheduleTimeDto } from './create-scheduler.dto';

export class UpdateSchedulerDto {
  @ApiPropertyOptional({
    description: 'The scheduler configuration',
    type: CanScheduleTimeDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CanScheduleTimeDto)
  canScheduleTime?: CanScheduleTimeDto;
}
