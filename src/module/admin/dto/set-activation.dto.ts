import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetActivationDto {
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}
