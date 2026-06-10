import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

/** 24-hour HH:mm (e.g. "07:00", "18:30") */
const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class DayOpeningHoursDto {
  @ApiProperty({
    example: true,
    description: 'When false, the business is closed this day.',
  })
  @IsBoolean()
  isOpen: boolean;

  @ApiPropertyOptional({
    example: '07:00',
    description: 'Opening time in 24-hour HH:mm format. Required when isOpen is true.',
  })
  @ValidateIf((day: DayOpeningHoursDto) => day.isOpen)
  @IsString()
  @IsNotEmpty()
  @Matches(HH_MM, { message: 'open must be HH:mm (24-hour)' })
  open?: string;

  @ApiPropertyOptional({
    example: '18:00',
    description: 'Closing time in 24-hour HH:mm format. Required when isOpen is true.',
  })
  @ValidateIf((day: DayOpeningHoursDto) => day.isOpen)
  @IsString()
  @IsNotEmpty()
  @Matches(HH_MM, { message: 'close must be HH:mm (24-hour)' })
  close?: string;
}

/**
 * Weekly opening hours for a business. All seven days must be provided when
 * setting openingHours. Stored as JSONB on the business row.
 */
export class OpeningHoursDto {
  @ApiProperty({ type: DayOpeningHoursDto })
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  monday: DayOpeningHoursDto;

  @ApiProperty({ type: DayOpeningHoursDto })
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  tuesday: DayOpeningHoursDto;

  @ApiProperty({ type: DayOpeningHoursDto })
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  wednesday: DayOpeningHoursDto;

  @ApiProperty({ type: DayOpeningHoursDto })
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  thursday: DayOpeningHoursDto;

  @ApiProperty({ type: DayOpeningHoursDto })
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  friday: DayOpeningHoursDto;

  @ApiProperty({ type: DayOpeningHoursDto })
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  saturday: DayOpeningHoursDto;

  @ApiProperty({ type: DayOpeningHoursDto })
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  sunday: DayOpeningHoursDto;
}
